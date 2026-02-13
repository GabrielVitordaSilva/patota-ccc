-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de membros
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de admins (2 admins fixos)
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id)
);

-- Tabela de eventos (jogos e eventos internos)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('JOGO', 'INTERNO')),
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  local TEXT NOT NULL,
  descricao TEXT,
  criado_por UUID REFERENCES members(id),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de confirmação de presença (RSVP)
CREATE TABLE event_rsvp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('VOU', 'NAO_VOU', 'TALVEZ')),
  convidados INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

-- Tabela de presença real (marcada pelo admin)
CREATE TABLE event_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('PRESENTE', 'AUSENTE', 'ATRASO', 'JUSTIFICADO')),
  marcado_por UUID REFERENCES members(id),
  marcado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

-- Tabela de mensalidades
CREATE TABLE dues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL, -- formato: YYYY-MM
  vencimento DATE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDENTE', 'PAGO', 'ISENTO')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, competencia)
);

-- Tabela de isenções
CREATE TABLE exemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL,
  motivo TEXT NOT NULL CHECK (motivo IN ('LESAO', 'TRABALHO')),
  observacao TEXT,
  aprovado_por UUID REFERENCES members(id),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, competencia)
);

-- Tabela de multas
CREATE TABLE fines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ATRASO', 'FALTA_CONFIRMADA', 'CONVIDADO')),
  valor DECIMAL(10,2) NOT NULL,
  observacao TEXT,
  criado_por UUID REFERENCES members(id),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pagamentos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  due_id UUID REFERENCES dues(id) ON DELETE SET NULL,
  fine_id UUID REFERENCES fines(id) ON DELETE SET NULL,
  valor DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'REJEITADO')),
  comprovante_url TEXT,
  observacao TEXT,
  confirmado_por UUID REFERENCES members(id),
  confirmado_em TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de caixa (ledger)
CREATE TABLE cash_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
  categoria TEXT NOT NULL, -- MENSALIDADE, MULTA, CONVIDADO, CAMPO, ARBITRAGEM, BOLA, OUTRO
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  referencia_id UUID, -- pode ser fine_id, due_id, payment_id, etc
  referencia_tipo TEXT, -- 'fine', 'due', 'payment', 'custom'
  lancado_por UUID REFERENCES members(id),
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pontos
CREATE TABLE points_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  pontos INTEGER NOT NULL,
  motivo TEXT NOT NULL, -- PRESENCA_JOGO, BONUS, PENALIDADE
  observacao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de auditoria
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tabela TEXT NOT NULL,
  registro_id UUID NOT NULL,
  acao TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  dados_anteriores JSONB,
  dados_novos JSONB,
  usuario_id UUID REFERENCES members(id),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
