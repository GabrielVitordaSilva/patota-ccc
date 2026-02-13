-- View para ranking mensal
CREATE OR REPLACE VIEW ranking_mensal AS
SELECT 
  m.id as member_id,
  m.nome,
  DATE_TRUNC('month', pl.criado_em) as mes,
  SUM(pl.pontos) as total_pontos,
  COUNT(DISTINCT pl.event_id) as total_presencas
FROM members m
JOIN points_ledger pl ON m.id = pl.member_id
WHERE m.ativo = true
GROUP BY m.id, m.nome, DATE_TRUNC('month', pl.criado_em)
ORDER BY DATE_TRUNC('month', pl.criado_em) DESC, total_pontos DESC;

-- View para ranking geral
CREATE OR REPLACE VIEW ranking_geral AS
SELECT 
  m.id as member_id,
  m.nome,
  SUM(pl.pontos) as total_pontos,
  COUNT(DISTINCT pl.event_id) as total_presencas
FROM members m
JOIN points_ledger pl ON m.id = pl.member_id
WHERE m.ativo = true
GROUP BY m.id, m.nome
ORDER BY total_pontos DESC;
