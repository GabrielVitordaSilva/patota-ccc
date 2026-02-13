# Scripts SQL Úteis e Troubleshooting

## 📊 Scripts de Manutenção

### Ver estatísticas gerais

```sql
-- Resumo geral do sistema
SELECT 
  (SELECT COUNT(*) FROM members WHERE ativo = true) as membros_ativos,
  (SELECT COUNT(*) FROM events WHERE data_hora > NOW()) as proximos_eventos,
  (SELECT COUNT(*) FROM dues WHERE status = 'PENDENTE') as mensalidades_pendentes,
  (SELECT COUNT(*) FROM payments WHERE status = 'PENDENTE') as pagamentos_pendentes,
  (SELECT saldo_atual FROM saldo_caixa) as saldo_caixa;
```

### Ver membros com pendências

```sql
-- Membros com mensalidades ou multas pendentes
SELECT 
  m.nome,
  m.email,
  COUNT(DISTINCT d.id) as mensalidades_pendentes,
  COUNT(DISTINCT f.id) as multas_pendentes,
  COALESCE(SUM(DISTINCT d.valor), 0) + COALESCE(SUM(DISTINCT f.valor), 0) as total_pendente
FROM members m
LEFT JOIN dues d ON m.id = d.member_id AND d.status = 'PENDENTE'
LEFT JOIN fines f ON m.id = f.member_id AND NOT EXISTS (
  SELECT 1 FROM payments p 
  WHERE p.fine_id = f.id AND p.status = 'CONFIRMADO'
)
WHERE m.ativo = true
GROUP BY m.id, m.nome, m.email
HAVING COUNT(DISTINCT d.id) > 0 OR COUNT(DISTINCT f.id) > 0
ORDER BY total_pendente DESC;
```

### Ver top 10 ranking de todos os tempos

```sql
-- Top 10 jogadores com mais presenças
SELECT 
  m.nome,
  COUNT(DISTINCT pl.event_id) as total_jogos,
  SUM(pl.pontos) as total_pontos
FROM members m
JOIN points_ledger pl ON m.id = pl.member_id
WHERE m.ativo = true
GROUP BY m.id, m.nome
ORDER BY total_pontos DESC
LIMIT 10;
```

### Ver caixa detalhado do mês atual

```sql
-- Entradas e saídas do mês atual
SELECT 
  categoria,
  tipo,
  COUNT(*) as quantidade,
  SUM(valor) as total
FROM cash_ledger
WHERE DATE_TRUNC('month', data_lancamento) = DATE_TRUNC('month', NOW())
GROUP BY categoria, tipo
ORDER BY tipo, total DESC;
```

### Ver eventos com baixa adesão

```sql
-- Eventos futuros com menos de 8 confirmações
SELECT 
  e.id,
  e.tipo,
  e.data_hora,
  e.local,
  COUNT(r.id) FILTER (WHERE r.status = 'VOU') as confirmados
FROM events e
LEFT JOIN event_rsvp r ON e.id = r.event_id
WHERE e.data_hora > NOW()
GROUP BY e.id, e.tipo, e.data_hora, e.local
HAVING COUNT(r.id) FILTER (WHERE r.status = 'VOU') < 8
ORDER BY e.data_hora;
```

## 🔧 Scripts de Correção

### Recalcular pontos de um membro

```sql
-- Útil se houver inconsistência nos pontos
DELETE FROM points_ledger WHERE member_id = 'uuid-do-membro';

INSERT INTO points_ledger (member_id, event_id, pontos, motivo)
SELECT 
  'uuid-do-membro',
  a.event_id,
  1,
  'PRESENCA_JOGO'
FROM event_attendance a
JOIN events e ON a.event_id = e.id
WHERE a.member_id = 'uuid-do-membro'
  AND a.status = 'PRESENTE'
  AND e.tipo = 'JOGO';
```

### Limpar dados de teste

```sql
-- CUIDADO: Isso apaga TODOS os dados!
TRUNCATE 
  event_attendance,
  event_rsvp,
  points_ledger,
  payments,
  cash_ledger,
  fines,
  exemptions,
  dues,
  events,
  admins,
  members
CASCADE;

-- Resetar sequences se necessário
ALTER SEQUENCE IF EXISTS members_id_seq RESTART WITH 1;
```

### Corrigir mensalidade duplicada

```sql
-- Se houver mensalidades duplicadas para o mesmo membro/mês
DELETE FROM dues
WHERE id NOT IN (
  SELECT MIN(id)
  FROM dues
  GROUP BY member_id, competencia
);
```

### Atualizar valor de mensalidade retroativo

```sql
-- Atualizar valor da mensalidade (ex: de 35 para 40)
UPDATE dues
SET valor = 40.00
WHERE competencia >= '2026-03'  -- a partir de março/2026
  AND status = 'PENDENTE';
```

## 📊 Queries de Relatórios

### Relatório mensal completo

```sql
-- Relatório completo de um mês específico
WITH mes AS (
  SELECT '2026-02' as competencia
)
SELECT 
  'Membros Ativos' as metrica,
  COUNT(DISTINCT m.id)::text as valor
FROM members m, mes
WHERE m.ativo = true

UNION ALL

SELECT 
  'Jogos Realizados',
  COUNT(DISTINCT e.id)::text
FROM events e, mes
WHERE DATE_TRUNC('month', e.data_hora) = (mes.competencia || '-01')::date
  AND e.tipo = 'JOGO'
  AND e.data_hora < NOW()

UNION ALL

SELECT 
  'Taxa de Presença Média',
  ROUND(AVG(presentes_percentual), 2)::text || '%'
FROM (
  SELECT 
    e.id,
    COUNT(a.id) FILTER (WHERE a.status = 'PRESENTE')::float / 
    NULLIF(COUNT(r.id) FILTER (WHERE r.status = 'VOU'), 0) * 100 as presentes_percentual
  FROM events e
  JOIN event_rsvp r ON e.id = r.event_id
  LEFT JOIN event_attendance a ON e.id = a.event_id AND a.member_id = r.member_id
  WHERE DATE_TRUNC('month', e.data_hora) = (SELECT (competencia || '-01')::date FROM mes)
    AND e.tipo = 'JOGO'
  GROUP BY e.id
) stats, mes

UNION ALL

SELECT 
  'Total Arrecadado',
  'R$ ' || COALESCE(SUM(valor), 0)::text
FROM cash_ledger, mes
WHERE tipo = 'ENTRADA'
  AND DATE_TRUNC('month', data_lancamento) = (mes.competencia || '-01')::date

UNION ALL

SELECT 
  'Total de Despesas',
  'R$ ' || COALESCE(SUM(valor), 0)::text
FROM cash_ledger, mes
WHERE tipo = 'SAIDA'
  AND DATE_TRUNC('month', data_lancamento) = (mes.competencia || '-01')::date

UNION ALL

SELECT 
  'Mensalidades Pagas',
  COUNT(*)::text || ' de ' || (SELECT COUNT(*) FROM dues WHERE competencia = mes.competencia)
FROM dues, mes
WHERE competencia = mes.competencia
  AND status = 'PAGO';
```

### Membros que nunca confirmaram presença

```sql
-- Membros ativos que nunca confirmaram em nenhum evento
SELECT 
  m.nome,
  m.email,
  m.criado_em
FROM members m
WHERE m.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM event_rsvp r WHERE r.member_id = m.id
  )
ORDER BY m.criado_em;
```

### Histórico de presença de um jogador

```sql
-- Ver todas as presenças de um jogador específico
SELECT 
  e.data_hora,
  e.tipo,
  e.local,
  a.status,
  CASE 
    WHEN a.status = 'PRESENTE' THEN '✅'
    WHEN a.status = 'AUSENTE' THEN '❌'
    WHEN a.status = 'ATRASO' THEN '⏰'
    ELSE '🩹'
  END as emoji
FROM event_attendance a
JOIN events e ON a.event_id = e.id
WHERE a.member_id = 'uuid-do-jogador'
ORDER BY e.data_hora DESC;
```

## 🛠️ Troubleshooting

### Problema: "permission denied for table X"

**Causa:** RLS não configurado corretamente

**Solução:**
```sql
-- Verificar se RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Se alguma tabela estiver com rowsecurity = false, ative:
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;

-- Depois recrie as políticas
```

### Problema: Mensalidades não sendo geradas

**Causa:** Função não foi criada ou tem erro

**Solução:**
```sql
-- Verificar se função existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'gerar_mensalidades_mes';

-- Testar função manualmente
SELECT gerar_mensalidades_mes('2026-03');

-- Ver erros
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%gerar_mensalidades%';
```

### Problema: Pontos não sendo calculados

**Causa:** Trigger ou função de marcar presença com erro

**Solução:**
```sql
-- Verificar função marcar_presenca
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'marcar_presenca';

-- Recriar pontos de todos os jogadores
DELETE FROM points_ledger;

INSERT INTO points_ledger (member_id, event_id, pontos, motivo)
SELECT 
  a.member_id,
  a.event_id,
  1,
  'PRESENCA_JOGO'
FROM event_attendance a
JOIN events e ON a.event_id = e.id
WHERE a.status = 'PRESENTE'
  AND e.tipo = 'JOGO';
```

### Problema: Comprovantes não fazendo upload

**Causa:** Políticas de storage não configuradas

**Solução:**
```sql
-- Ver políticas do bucket
SELECT * FROM storage.policies WHERE bucket_id = 'comprovantes';

-- Recriar políticas se necessário (veja BANCO_DE_DADOS_E_RLS.md)
```

### Problema: Admin não consegue acessar painel

**Causa:** Usuário não está na tabela admins

**Solução:**
```sql
-- Verificar admins
SELECT m.nome, m.email, a.member_id
FROM admins a
JOIN members m ON a.member_id = m.id;

-- Adicionar admin (pegue o UUID do auth.users)
INSERT INTO admins (member_id)
VALUES ('uuid-do-usuario');
```

## 🔍 Queries de Debug

### Ver todas as políticas RLS

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Ver índices das tabelas

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Ver tamanho do banco

```sql
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as tamanho_total,
  (SELECT COUNT(*) FROM members) as total_membros,
  (SELECT COUNT(*) FROM events) as total_eventos,
  (SELECT COUNT(*) FROM dues) as total_mensalidades,
  (SELECT COUNT(*) FROM cash_ledger) as total_lancamentos;
```

### Ver queries lentas

```sql
-- Requer pg_stat_statements extension
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## 🔐 Segurança

### Verificar que todas as tabelas têm RLS

```sql
-- Tabelas que DEVEM ter RLS mas não têm
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT IN ('audit_logs'); -- audit_logs pode não ter RLS
```

### Ver quem tem acesso de admin

```sql
-- Listar todos os admins com detalhes
SELECT 
  m.nome,
  m.email,
  a.criado_em as admin_desde
FROM admins a
JOIN members m ON a.member_id = m.id
ORDER BY a.criado_em;
```

### Limpar sessões antigas

```sql
-- Ver sessões ativas (no Supabase Dashboard: Authentication > Users)
-- Ou force logout de todos:
-- CUIDADO: Isso força logout de TODOS os usuários
-- Execute apenas em emergência

-- No Supabase CLI:
-- supabase auth users list --session-only | supabase auth sessions delete
```

## 📈 Performance

### Adicionar índices se necessário

```sql
-- Se queries de busca por competência estiverem lentas
CREATE INDEX IF NOT EXISTS idx_dues_competencia_status 
ON dues(competencia, status);

-- Se queries de busca por data estiverem lentas
CREATE INDEX IF NOT EXISTS idx_cash_ledger_data_tipo 
ON cash_ledger(data_lancamento, tipo);

-- Se queries de RSVP estiverem lentas
CREATE INDEX IF NOT EXISTS idx_event_rsvp_status 
ON event_rsvp(event_id, status);
```

### Ver estatísticas de uso das tabelas

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_tup_ins AS inserts,
  n_tup_upd AS updates,
  n_tup_del AS deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 💡 Dicas Finais

1. **Sempre faça backup antes de scripts de correção**
2. **Teste scripts em ambiente de desenvolvimento primeiro**
3. **Use transações para scripts críticos:**

```sql
BEGIN;
-- seus comandos aqui
-- Se algo der errado: ROLLBACK;
-- Se tudo OK: COMMIT;
```

4. **Monitore logs do Supabase** (Dashboard > Logs)
5. **Configure alertas** para erros críticos
6. **Documente customizações** que fizer no banco

---

**Lembre-se:** Em caso de dúvida, consulte a documentação oficial do PostgreSQL e Supabase!
