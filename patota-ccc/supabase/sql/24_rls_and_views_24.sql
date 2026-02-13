CREATE OR REPLACE FUNCTION gerar_mensalidades_mes(mes_competencia TEXT)
RETURNS INTEGER AS $$
DECLARE
  contador INTEGER := 0;
  membro RECORD;
  tem_isencao BOOLEAN;
BEGIN
  -- Loop por todos os membros ativos
  FOR membro IN 
    SELECT id FROM members WHERE ativo = true
  LOOP
    -- Verifica se já existe mensalidade para este membro neste mês
    IF NOT EXISTS (
      SELECT 1 FROM dues 
      WHERE member_id = membro.id 
      AND competencia = mes_competencia
    ) THEN
      -- Verifica se tem isenção aprovada
      SELECT EXISTS (
        SELECT 1 FROM exemptions
        WHERE member_id = membro.id
        AND competencia = mes_competencia
      ) INTO tem_isencao;
      
      -- Insere a mensalidade
      IF tem_isencao THEN
        -- Com isenção: valor 0 e status ISENTO
        INSERT INTO dues (member_id, competencia, vencimento, valor, status)
        VALUES (
          membro.id,
          mes_competencia,
          (mes_competencia || '-10')::DATE,
          0,
          'ISENTO'
        );
      ELSE
        -- Sem isenção: valor 35 e status PENDENTE
        INSERT INTO dues (member_id, competencia, vencimento, valor, status)
        VALUES (
          membro.id,
          mes_competencia,
          (mes_competencia || '-10')::DATE,
          35,
          'PENDENTE'
        );
      END IF;
      
      contador := contador + 1;
    END IF;
  END LOOP;
  
  RETURN contador;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
