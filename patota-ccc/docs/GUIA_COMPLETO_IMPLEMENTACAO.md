# Guia Completo de Implementação - Sistema Patota CCC

## 📋 Índice

1. [Setup Inicial do Projeto](#1-setup-inicial-do-projeto)
2. [Configuração do Supabase](#2-configuração-do-supabase)
3. [Estrutura do Banco de Dados](#3-estrutura-do-banco-de-dados)
4. [Segurança e RLS](#4-segurança-e-rls)
5. [Estrutura do Projeto React](#5-estrutura-do-projeto-react)
6. [Implementação PWA](#6-implementação-pwa)
7. [Funcionalidades do Jogador](#7-funcionalidades-do-jogador)
8. [Funcionalidades do Admin](#8-funcionalidades-do-admin)
9. [Sistema de Notificações](#9-sistema-de-notificações)
10. [Deploy no Cloudflare Pages](#10-deploy-no-cloudflare-pages)

---

## 1. Setup Inicial do Projeto

### 1.1 Criar o projeto Vite + React

```bash
# Criar projeto
npm create vite@latest patota-ccc -- --template react-ts
cd patota-ccc

# Instalar dependências principais
npm install @supabase/supabase-js
npm install react-router-dom
npm install date-fns
npm install lucide-react

# Instalar dependências PWA
npm install -D vite-plugin-pwa
npm install -D workbox-window

# Instalar ferramentas de desenvolvimento
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 1.2 Configurar Tailwind CSS

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8', // Azul para o tema do app
        secondary: '#9333ea',
        success: '#16a34a',
        danger: '#dc2626',
        warning: '#ea580c',
      },
    },
  },
  plugins: [],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }
  
  .btn-primary {
    @apply bg-primary text-white hover:bg-blue-700;
  }
  
  .btn-success {
    @apply bg-success text-white hover:bg-green-700;
  }
  
  .btn-danger {
    @apply bg-danger text-white hover:bg-red-700;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
  
  .input {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent;
  }
}
```

### 1.3 Configurar Vite para PWA

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Patota CCC',
        short_name: 'CCC',
        description: 'Sistema de gestão da Patota CCC',
        theme_color: '#1d4ed8',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
})
```

---

## 2. Configuração do Supabase

### 2.1 Criar projeto no Supabase

1. Acesse https://supabase.com
2. Clique em "New Project"
3. Preencha:
   - **Name**: patota-ccc
   - **Database Password**: (crie uma senha forte)
   - **Region**: South America (São Paulo) - para melhor latência no Brasil
4. Aguarde a criação do projeto

### 2.2 Obter credenciais

No painel do Supabase:
1. Vá em **Settings** > **API**
2. Copie:
   - **Project URL**: `https://seu-projeto.supabase.co`
   - **anon/public key**: `eyJhbG...` (chave pública)

### 2.3 Configurar variáveis de ambiente

**Criar arquivo `.env.local`:**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Criar arquivo `.env.example`:**
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**Adicionar ao `.gitignore`:**
```
.env.local
.env
```

### 2.4 Criar cliente Supabase

**src/lib/supabase.ts:**
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Helper para obter o usuário atual
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper para verificar se é admin
export const isAdmin = async () => {
  const user = await getCurrentUser()
  if (!user) return false
  
  const { data } = await supabase
    .from('admins')
    .select('member_id')
    .eq('member_id', user.id)
    .single()
  
  return !!data
}
```

---

## 3. Estrutura do Banco de Dados

### 3.1 Executar no SQL Editor do Supabase

Acesse **SQL Editor** no painel do Supabase e execute os seguintes scripts:

#### Script 1: Criar tabelas principais

```sql
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
```

#### Script 2: Criar índices para performance

```sql
-- Índices para melhor performance
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_ativo ON members(ativo);

CREATE INDEX idx_events_data_hora ON events(data_hora DESC);
CREATE INDEX idx_events_tipo ON events(tipo);

CREATE INDEX idx_event_rsvp_event ON event_rsvp(event_id);
CREATE INDEX idx_event_rsvp_member ON event_rsvp(member_id);

CREATE INDEX idx_event_attendance_event ON event_attendance(event_id);
CREATE INDEX idx_event_attendance_member ON event_attendance(member_id);

CREATE INDEX idx_dues_member ON dues(member_id);
CREATE INDEX idx_dues_competencia ON dues(competencia);
CREATE INDEX idx_dues_status ON dues(status);

CREATE INDEX idx_fines_member ON fines(member_id);
CREATE INDEX idx_fines_event ON fines(event_id);

CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_cash_ledger_data ON cash_ledger(data_lancamento DESC);
CREATE INDEX idx_cash_ledger_tipo ON cash_ledger(tipo);

CREATE INDEX idx_points_member ON points_ledger(member_id);
CREATE INDEX idx_points_event ON points_ledger(event_id);
```

#### Script 3: Criar triggers para updated_at

```sql
-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_rsvp_updated_at BEFORE UPDATE ON event_rsvp
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dues_updated_at BEFORE UPDATE ON dues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3.2 Configurar Storage para comprovantes

No painel do Supabase:

1. Vá em **Storage**
2. Clique em **Create bucket**
3. Configure:
   - **Name**: `comprovantes`
   - **Public**: OFF (privado)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, application/pdf`

---

*(Continua no próximo arquivo...)*
