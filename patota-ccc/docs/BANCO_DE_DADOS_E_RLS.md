# Parte 2: Segurança RLS e Funções do Banco

## 4. Segurança e RLS (Row Level Security)

### 4.1 Ativar RLS em todas as tabelas

Execute no SQL Editor:

```sql
-- Ativar RLS em todas as tabelas
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE exemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

### 4.2 Criar função helper para verificar se é admin

```sql
-- Função para verificar se o usuário atual é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE member_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.3 Políticas RLS - Tabela MEMBERS

```sql
-- Members: Todos podem ler membros ativos
CREATE POLICY "Todos podem ver membros ativos"
  ON members FOR SELECT
  USING (ativo = true);

-- Members: Só admin pode inserir
CREATE POLICY "Só admin pode criar membros"
  ON members FOR INSERT
  WITH CHECK (is_admin());

-- Members: Só admin pode atualizar
CREATE POLICY "Só admin pode atualizar membros"
  ON members FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Members: Ninguém pode deletar (usar soft delete com ativo=false)
```

### 4.4 Políticas RLS - Tabela ADMINS

```sql
-- Admins: Todos podem ver quem são os admins
CREATE POLICY "Todos podem ver admins"
  ON admins FOR SELECT
  USING (true);

-- Admins: Ninguém pode modificar via app (configuração manual no banco)
```

### 4.5 Políticas RLS - Tabela EVENTS

```sql
-- Events: Todos podem ver eventos
CREATE POLICY "Todos podem ver eventos"
  ON events FOR SELECT
  USING (true);

-- Events: Só admin pode criar
CREATE POLICY "Só admin pode criar eventos"
  ON events FOR INSERT
  WITH CHECK (is_admin());

-- Events: Só admin pode atualizar
CREATE POLICY "Só admin pode atualizar eventos"
  ON events FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Events: Só admin pode deletar
CREATE POLICY "Só admin pode deletar eventos"
  ON events FOR DELETE
  USING (is_admin());
```

### 4.6 Políticas RLS - Tabela EVENT_RSVP

```sql
-- RSVP: Todos podem ver
CREATE POLICY "Todos podem ver RSVPs"
  ON event_rsvp FOR SELECT
  USING (true);

-- RSVP: Cada um pode inserir/atualizar seu próprio RSVP
CREATE POLICY "Membros podem gerenciar seu RSVP"
  ON event_rsvp FOR INSERT
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "Membros podem atualizar seu RSVP"
  ON event_rsvp FOR UPDATE
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- RSVP: Pode deletar o próprio
CREATE POLICY "Membros podem deletar seu RSVP"
  ON event_rsvp FOR DELETE
  USING (member_id = auth.uid());
```

### 4.7 Políticas RLS - Tabela EVENT_ATTENDANCE

```sql
-- Attendance: Todos podem ver
CREATE POLICY "Todos podem ver presenças"
  ON event_attendance FOR SELECT
  USING (true);

-- Attendance: Só admin pode marcar presença
CREATE POLICY "Só admin pode marcar presença"
  ON event_attendance FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Só admin pode atualizar presença"
  ON event_attendance FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Só admin pode deletar presença"
  ON event_attendance FOR DELETE
  USING (is_admin());
```

### 4.8 Políticas RLS - Tabela DUES

```sql
-- Dues: Cada um vê suas próprias mensalidades, admin vê todas
CREATE POLICY "Ver próprias mensalidades"
  ON dues FOR SELECT
  USING (member_id = auth.uid() OR is_admin());

-- Dues: Só admin pode criar/atualizar
CREATE POLICY "Só admin pode criar mensalidades"
  ON dues FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Só admin pode atualizar mensalidades"
  ON dues FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
```

### 4.9 Políticas RLS - Tabela EXEMPTIONS

```sql
-- Exemptions: Cada um vê suas isenções, admin vê todas
CREATE POLICY "Ver próprias isenções"
  ON exemptions FOR SELECT
  USING (member_id = auth.uid() OR is_admin());

-- Exemptions: Só admin pode criar/gerenciar
CREATE POLICY "Só admin pode criar isenções"
  ON exemptions FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Só admin pode atualizar isenções"
  ON exemptions FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
```

### 4.10 Políticas RLS - Tabela FINES

```sql
-- Fines: Cada um vê suas próprias multas, admin vê todas
CREATE POLICY "Ver próprias multas"
  ON fines FOR SELECT
  USING (member_id = auth.uid() OR is_admin());

-- Fines: Só admin pode criar multas
CREATE POLICY "Só admin pode criar multas"
  ON fines FOR INSERT
  WITH CHECK (is_admin());
```

### 4.11 Políticas RLS - Tabela PAYMENTS

```sql
-- Payments: Cada um vê seus próprios pagamentos, admin vê todos
CREATE POLICY "Ver próprios pagamentos"
  ON payments FOR SELECT
  USING (member_id = auth.uid() OR is_admin());

-- Payments: Membros podem criar pagamentos (enviar comprovantes)
CREATE POLICY "Membros podem criar pagamentos"
  ON payments FOR INSERT
  WITH CHECK (member_id = auth.uid());

-- Payments: Só admin pode confirmar/rejeitar
CREATE POLICY "Só admin pode atualizar pagamentos"
  ON payments FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
```

### 4.12 Políticas RLS - Tabela CASH_LEDGER

```sql
-- Cash Ledger: Todos podem ver (transparência total)
CREATE POLICY "Todos podem ver lançamentos do caixa"
  ON cash_ledger FOR SELECT
  USING (true);

-- Cash Ledger: Só admin pode lançar
CREATE POLICY "Só admin pode lançar no caixa"
  ON cash_ledger FOR INSERT
  WITH CHECK (is_admin());

-- Cash Ledger: Admin pode atualizar (correções)
CREATE POLICY "Só admin pode atualizar caixa"
  ON cash_ledger FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
```

### 4.13 Políticas RLS - Tabela POINTS_LEDGER

```sql
-- Points: Cada um vê seus próprios pontos, mas ranking é público
CREATE POLICY "Ver próprios pontos"
  ON points_ledger FOR SELECT
  USING (member_id = auth.uid() OR is_admin());

-- Points: Só admin pode lançar pontos
CREATE POLICY "Só admin pode lançar pontos"
  ON points_ledger FOR INSERT
  WITH CHECK (is_admin());
```

### 4.14 Políticas RLS - Tabela AUDIT_LOGS

```sql
-- Audit: Só admin pode ver logs
CREATE POLICY "Só admin pode ver logs"
  ON audit_logs FOR SELECT
  USING (is_admin());

-- Audit: Sistema insere automaticamente (via triggers)
```

---

## 5. Funções do Banco (Business Logic)

### 5.1 Função para gerar mensalidades do mês

```sql
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
```

**Como usar:**
```sql
-- Gerar mensalidades de março/2026
SELECT gerar_mensalidades_mes('2026-03');
```

### 5.2 Função para marcar presença e aplicar regras automáticas

```sql
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
```

### 5.3 Função para adicionar convidados e criar multa

```sql
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
```

### 5.4 Função para confirmar pagamento

```sql
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
```

### 5.5 View para ranking de pontos

```sql
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
```

### 5.6 View para saldo do caixa

```sql
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
```

---

## 6. Configuração de Storage Policies

No SQL Editor, configure as políticas para o bucket de comprovantes:

```sql
-- Política para upload: usuário só pode fazer upload no próprio folder
CREATE POLICY "Usuários podem fazer upload de comprovantes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comprovantes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para leitura: usuário vê seus próprios, admin vê todos
CREATE POLICY "Ver próprios comprovantes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'comprovantes' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
);

-- Política para delete: usuário pode deletar os próprios, admin todos
CREATE POLICY "Deletar próprios comprovantes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'comprovantes' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
);
```

---

*(Continua no próximo arquivo com implementação do React...)*
