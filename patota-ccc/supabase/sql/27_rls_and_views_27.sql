CREATE OR REPLACE FUNCTION adicionar_convidados(
  p_event_id UUID,
  p_member_id UUID,
  p_quantidade INTEGER
)
RETURNS JSONB AS $$
DECLARE
  multa_criada UUID;
  valor_total DECIMAL(10,2);
BEGIN
  -- Calcula valor: R$ 5 por convidado
  valor_total := p_quantidade * 5.00;
  
  -- Atualiza o RSVP com quantidade de convidados
  UPDATE event_rsvp
  SET convidados = p_quantidade
  WHERE event_id = p_event_id AND member_id = p_member_id;
  
  -- Cria multa por convidados
  INSERT INTO fines (member_id, event_id, tipo, valor, observacao, criado_por)
  VALUES (
    p_member_id,
    p_event_id,
    'CONVIDADO',
    valor_total,
    p_quantidade || ' convidado(s)',
    p_member_id
  )
  RETURNING id INTO multa_criada;
  
  -- Lança no caixa
  INSERT INTO cash_ledger (tipo, categoria, valor, descricao, referencia_id, referencia_tipo, lancado_por)
  VALUES (
    'ENTRADA',
    'CONVIDADO',
    valor_total,
    p_quantidade || ' convidado(s)',
    multa_criada,
    'fine',
    p_member_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'multa_id', multa_criada,
    'valor', valor_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
