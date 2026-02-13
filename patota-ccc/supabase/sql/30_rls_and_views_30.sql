CREATE OR REPLACE VIEW saldo_caixa AS
SELECT 
  SUM(CASE WHEN tipo = 'ENTRADA' THEN valor ELSE 0 END) as total_entradas,
  SUM(CASE WHEN tipo = 'SAIDA' THEN valor ELSE 0 END) as total_saidas,
  SUM(CASE WHEN tipo = 'ENTRADA' THEN valor ELSE -valor END) as saldo_atual
FROM cash_ledger;

-- View para resumo mensal do caixa
CREATE OR REPLACE VIEW resumo_caixa_mensal AS
SELECT 
  TO_CHAR(data_lancamento, 'YYYY-MM') as mes,
  SUM(CASE WHEN tipo = 'ENTRADA' THEN valor ELSE 0 END) as entradas,
  SUM(CASE WHEN tipo = 'SAIDA' THEN valor ELSE 0 END) as saidas,
  SUM(CASE WHEN tipo = 'ENTRADA' THEN valor ELSE -valor END) as saldo_mes
FROM cash_ledger
GROUP BY TO_CHAR(data_lancamento, 'YYYY-MM')
ORDER BY mes DESC;
