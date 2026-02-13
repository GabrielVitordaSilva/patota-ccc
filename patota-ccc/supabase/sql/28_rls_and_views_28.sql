CREATE OR REPLACE FUNCTION confirmar_pagamento(
  p_payment_id UUID,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  pagamento RECORD;
  entrada_caixa UUID;
BEGIN
  -- Busca o pagamento
  SELECT * INTO pagamento
  FROM payments
  WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pagamento não encontrado');
  END IF;
  
  -- Atualiza status do pagamento
  UPDATE payments
  SET 
    status = 'CONFIRMADO',
    confirmado_por = p_admin_id,
    confirmado_em = NOW()
  WHERE id = p_payment_id;
  
  -- Se é pagamento de mensalidade, atualiza a due
  IF pagamento.due_id IS NOT NULL THEN
    UPDATE dues
    SET status = 'PAGO'
    WHERE id = pagamento.due_id;
    
    -- Lança entrada no caixa
    INSERT INTO cash_ledger (tipo, categoria, valor, descricao, referencia_id, referencia_tipo, lancado_por)
    VALUES (
      'ENTRADA',
      'MENSALIDADE',
      pagamento.valor,
      'Mensalidade confirmada',
      pagamento.due_id,
      'due',
      p_admin_id
    )
    RETURNING id INTO entrada_caixa;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'ledger_id', entrada_caixa
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
