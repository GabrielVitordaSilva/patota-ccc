# Guia Rápido - Começando em 30 Minutos ⚡

Este guia te leva do zero ao app funcionando em 30 minutos!

## ⏱️ Passo a Passo Rápido

### Minuto 0-5: Setup do Projeto

```bash
# 1. Criar projeto
npm create vite@latest patota-ccc -- --template react-ts
cd patota-ccc

# 2. Instalar dependências
npm install @supabase/supabase-js react-router-dom date-fns lucide-react
npm install -D vite-plugin-pwa tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Minuto 5-10: Configurar Tailwind

**tailwind.config.js:**
```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8',
        success: '#16a34a',
        danger: '#dc2626',
        warning: '#ea580c',
      },
    },
  },
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Minuto 10-15: Criar Projeto Supabase

1. Acesse: https://supabase.com
2. Clique em "New Project"
3. Preencha:
   - Name: `patota-ccc`
   - Password: (crie uma senha forte)
   - Region: `South America (São Paulo)`
4. Aguarde criação (2-3 minutos)

### Minuto 15-20: Configurar Banco de Dados

No Supabase Dashboard:

1. Vá em **SQL Editor**
2. Copie e execute os scripts de `BANCO_DE_DADOS_E_RLS.md` na ordem:
   - Script 1: Criar tabelas ✅
   - Script 2: Criar índices ✅
   - Script 3: Criar triggers ✅
   - Script 4: Ativar RLS ✅
   - Script 5: Políticas RLS ✅
   - Script 6: Funções ✅

### Minuto 20-22: Configurar Storage

1. Vá em **Storage**
2. Crie bucket: `comprovantes` (privado)
3. Execute políticas de storage do guia

### Minuto 22-25: Configurar Variáveis

1. No Supabase, vá em **Settings > API**
2. Copie `URL` e `anon public key`

**Crie `.env.local`:**
```env
VITE_SUPABASE_URL=sua-url-aqui
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

### Minuto 25-30: Copiar Código Base

1. Copie os arquivos de código dos guias para seu projeto
2. Estrutura de pastas:

```
src/
  lib/
    supabase.ts
  pages/
    Login.tsx
    Home.tsx
    Events.tsx
    Finance.tsx
    Ranking.tsx
    Rules.tsx
    admin/
      Dashboard.tsx
      Caixa.tsx
      Members.tsx
  components/
    Layout.tsx
    AdminLayout.tsx
  App.tsx
```

### Minuto 30: Rodar!

```bash
npm run dev
```

Acesse: http://localhost:5173

## 🎯 Primeiros Passos Após Instalação

### 1. Criar Primeiro Admin

No Supabase SQL Editor:

```sql
-- 1. Pegue o ID do primeiro usuário que fizer login
-- (ele aparecerá na tabela auth.users após o primeiro login)

-- 2. Adicione-o como admin:
INSERT INTO admins (member_id)
VALUES ('cole-o-uuid-do-usuario-aqui');
```

### 2. Testar Funcionalidades

**Como Jogador:**
1. Faça login com seu e-mail
2. Confirme presença em um evento
3. Veja seu financeiro
4. Confira o ranking

**Como Admin:**
1. Crie um evento
2. Marque presença de alguém
3. Adicione um lançamento no caixa
4. Gere mensalidades do mês

### 3. Adicionar Membros

**Via Admin Panel:**
1. Admin > Membros
2. "Adicionar Membro"
3. Preencha nome e e-mail
4. Membro recebe convite automático!

**Ou via SQL:**
```sql
INSERT INTO members (nome, email, ativo)
VALUES ('João Silva', 'joao@email.com', true);
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Rodar em dev mode
npm run build           # Build para produção
npm run preview         # Preview do build

# Supabase (se usar CLI)
npx supabase init       # Inicializar Supabase localmente
npx supabase start      # Rodar Supabase local
npx supabase db push    # Aplicar migrations
```

## 📊 Gerar Dados de Teste

Execute no SQL Editor para popular com dados de teste:

```sql
-- Criar alguns membros de teste
INSERT INTO members (nome, email, ativo) VALUES
  ('João Silva', 'joao@test.com', true),
  ('Maria Santos', 'maria@test.com', true),
  ('Pedro Oliveira', 'pedro@test.com', true),
  ('Ana Costa', 'ana@test.com', true);

-- Criar um evento de teste
INSERT INTO events (tipo, data_hora, local, descricao)
VALUES (
  'JOGO',
  (NOW() + interval '2 days'),
  'Arena do Parque',
  'Rachão de sábado'
);

-- Gerar mensalidades do mês atual
SELECT gerar_mensalidades_mes(TO_CHAR(NOW(), 'YYYY-MM'));
```

## 🐛 Problemas Comuns

### Erro: "Invalid API key"
**Solução:** Verifique se copiou a chave `anon` (não a `service_role`)

### Erro: "Row Level Security"
**Solução:** Execute todos os scripts de políticas RLS

### Login não funciona
**Solução:** Verifique configuração de e-mail no Supabase (Settings > Auth)

### PWA não instala
**Solução:** 
1. Verifique se está em HTTPS (ou localhost)
2. Confirme que tem `manifest.json` correto
3. Veja console para erros de service worker

## 📱 Testar PWA Localmente

### No Chrome Desktop:
1. Abra DevTools (F12)
2. Aba "Application"
3. Seção "Manifest"
4. Clique em "Add to home screen" (ícone +)

### No Chrome Mobile:
1. Abra o site
2. Menu (3 pontos)
3. "Adicionar à tela inicial"
4. Confirmar

## 🚀 Deploy Rápido

### Cloudflare Pages (5 minutos):

1. **Commit no GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/patota-ccc.git
git push -u origin main
```

2. **No Cloudflare:**
   - Acesse: https://dash.cloudflare.com
   - Workers & Pages > Create > Pages > Connect to Git
   - Selecione repositório
   - Build: `npm run build`
   - Output: `dist`
   - Add env vars (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)
   - Deploy!

3. **Pronto!** App no ar em: `https://seu-projeto.pages.dev`

## 💡 Dicas Importantes

### Segurança
- ✅ Sempre use RLS
- ✅ Nunca exponha `service_role` key
- ✅ Valide dados no backend

### Performance
- ✅ Use índices nas queries frequentes
- ✅ Limite resultados com `.limit()`
- ✅ Cache dados quando possível

### UX
- ✅ Sempre mostre loading states
- ✅ Dê feedback visual nas ações
- ✅ Trate erros com mensagens amigáveis

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [React Router](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite PWA](https://vite-pwa-org.netlify.app)

## 🎯 Próximos Passos

1. ✅ Personalize cores e logo
2. ✅ Adicione seus membros
3. ✅ Crie o primeiro evento
4. ✅ Configure PIX da patota
5. ✅ Teste todas as funcionalidades
6. ✅ Deploy em produção
7. ✅ Compartilhe com a patota!

---

**Dúvidas?** Consulte os guias detalhados ou abra uma issue no GitHub!

**Boa sorte com sua patota! 🎉⚽**
