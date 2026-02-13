CREATE OR REPLACE FUNCTION marcar_presenca(
  p_event_id UUID,
  p_member_id UUID,
  p_status TEXT,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  tinha_rsvp TEXT;
  multa_criada UUID;
  resultado JSONB;
BEGIN
  -- Busca o RSVP do membro
  SELECT status INTO tinha_rsvp
  FROM event_rsvp
  WHERE event_id = p_event_id AND member_id = p_member_id;
  
  -- Insere ou atualiza a presença
  INSERT INTO event_attendance (event_id, member_id, status, marcado_por)
  VALUES (p_event_id, p_member_id, p_status, p_admin_id)
  ON CONFLICT (event_id, member_id) 
  DO UPDATE SET 
    status = p_status,
    marcado_por = p_admin_id,
    marcado_em = NOW();
  
  -- Aplica regras de multas
  CASE p_status
    WHEN 'ATRASO' THEN
      -- Multa de R$ 5 por atraso
      INSERT INTO fines (member_id, event_id, tipo, valor, criado_por)
      VALUES (p_member_id, p_event_id, 'ATRASO', 5.00, p_admin_id)
      RETURNING id INTO multa_criada;
      
      -- Lança no caixa
      INSERT INTO cash_ledger (tipo, categoria, valor, descricao, referencia_id, referencia_tipo, lancado_por)
      VALUES (
        'ENTRADA',
        'MULTA',
        5.00,
        'Multa por atraso',
        multa_criada,
        'fine',
        p_admin_id
      );
      
    WHEN 'AUSENTE' THEN
      -- Se confirmou presença mas faltou: multa de R$ 10
      IF tinha_rsvp = 'VOU' THEN
        INSERT INTO fines (member_id, event_id, tipo, valor, criado_por)
        VALUES (p_member_id, p_event_id, 'FALTA_CONFIRMADA', 10.00, p_admin_id)
        RETURNING id INTO multa_criada;
        
        -- Lança no caixa
        INSERT INTO cash_ledger (tipo, categoria, valor, descricao, referencia_id, referencia_tipo, lancado_por)
        VALUES (
          'ENTRADA',
          'MULTA',
          10.00,
          'Multa por falta confirmada',
          multa_criada,
          'fine',
          p_admin_id
        );
      END IF;
      
    WHEN 'PRESENTE' THEN
      -- Adiciona +1 ponto se for jogo
      IF EXISTS (SELECT 1 FROM events WHERE id = p_event_id AND tipo = 'JOGO') THEN
        INSERT INTO points_ledger (member_id, event_id, pontos, motivo)
        VALUES (p_member_id, p_event_id, 1, 'PRESENCA_JOGO');
      END IF;
      
    ELSE
      -- JUSTIFICADO: não faz nada
  END CASE;
  
  resultado := jsonb_build_object(
    'success', true,
    'status', p_status,
    'multa_id', multa_criada
  );
  
  RETURN resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
