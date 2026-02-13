# Sistema de Gestão Patota CCC 🏃‍♂️⚽

Sistema completo de gestão para patota de futebol com controle financeiro, presença, ranking e muito mais!

## 🎯 Características

- **100% Gratuito** - Todos os serviços usados têm planos free robustos
- **PWA** - Instalável no celular como app nativo
- **Offline-first** - Funciona mesmo sem internet
- **Seguro** - Autenticação via e-mail (magic link)
- **Responsivo** - Funciona em qualquer dispositivo

## 📱 Funcionalidades

### Para Jogadores
- ✅ Confirmar presença em jogos
- 💰 Ver e pagar mensalidades e multas
- 🏆 Acompanhar ranking de presença
- 📊 Transparência total do caixa
- 👥 Adicionar convidados aos jogos

### Para Admins
- 📅 Criar e gerenciar eventos
- ✔️ Marcar presença dos jogadores
- 💵 Gerenciar caixa (entradas/saídas)
- 👤 Gerenciar membros e isenções
- 📄 Confirmar pagamentos

## 🚀 Como Começar

### 1. Clone este repositório
```bash
git clone https://github.com/seu-usuario/patota-ccc.git
cd patota-ccc
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase

Siga o guia completo em `GUIA_COMPLETO_IMPLEMENTACAO.md`

Resumo:
1. Crie projeto no Supabase
2. Execute os scripts SQL em `BANCO_DE_DADOS_E_RLS.md`
3. Configure variáveis de ambiente

### 4. Configure variáveis de ambiente

Crie arquivo `.env.local`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 5. Rode o projeto localmente
```bash
npm run dev
```

Acesse: http://localhost:5173

## 📚 Documentação Completa

Este projeto vem com documentação detalhada dividida em arquivos:

1. **GUIA_COMPLETO_IMPLEMENTACAO.md** - Setup inicial e estrutura
2. **BANCO_DE_DADOS_E_RLS.md** - Banco de dados e segurança
3. **FUNCIONALIDADES_JOGADOR.md** - Features para jogadores
4. **PAGINAS_EVENTOS.md** - Sistema de eventos
5. **PAGINAS_FINANCEIRO_RANKING.md** - Financeiro e ranking
6. **FUNCIONALIDADES_ADMIN.md** - Painel administrativo
7. **MEMBROS_PWA_DEPLOY.md** - PWA e deploy

## 🛠️ Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Cloudflare Pages
- **PWA**: Vite PWA Plugin

## 💾 Estrutura do Banco de Dados

```
members          → Membros da patota
admins           → Administradores (2 fixos)
events           → Jogos e eventos internos
event_rsvp       → Confirmações de presença
event_attendance → Presença real (marcada por admin)
dues             → Mensalidades
exemptions       → Isenções (lesão/trabalho)
fines            → Multas (atraso, falta, convidado)
payments         → Pagamentos
cash_ledger      → Caixa (entradas e saídas)
points_ledger    → Pontos de presença
audit_logs       → Logs de auditoria
```

## 💰 Regras Financeiras

- **Mensalidade**: R$ 35,00 (vencimento dia 10)
- **Multa por Atraso**: R$ 5,00
- **Multa por Falta Confirmada**: R$ 10,00
- **Convidado**: R$ 5,00 por pessoa
- **Isenção**: Possível por lesão ou trabalho (R$ 0)

## 🏆 Sistema de Pontos

- +1 ponto por presença em jogo
- Ranking mensal e geral
- Transparência total

## 🔐 Segurança

- Row Level Security (RLS) ativado em todas as tabelas
- Cada usuário só vê seus próprios dados
- Admins têm acesso completo
- Logs de auditoria para ações críticas

## 📱 Instalação como App

1. Abra o site no Chrome (celular)
2. Menu > "Adicionar à tela inicial"
3. Use como app nativo!

## 🚀 Deploy

### Cloudflare Pages (Recomendado)

1. Conecte seu repositório GitHub
2. Configure:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Adicione variáveis de ambiente
4. Deploy automático a cada push!

Veja detalhes em `MEMBROS_PWA_DEPLOY.md`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📄 Licença

MIT License - sinta-se livre para usar em sua patota!

## 🎯 Roadmap

### v1.0 (Atual)
- [x] Gestão de eventos
- [x] Controle financeiro
- [x] Ranking de presença
- [x] Painel admin

### v2.0 (Futuro)
- [ ] Notificações push
- [ ] Chat da patota
- [ ] Estatísticas detalhadas
- [ ] Integração com reserva de campo
- [ ] Upload de fotos dos jogos
- [ ] Estatísticas individuais

## 📞 Suporte

Dúvidas? Consulte a documentação ou abra uma issue!

## 🙏 Agradecimentos

Feito com ❤️ para facilitar a gestão de patotas de futebol!

---

**Feito com React + Supabase + Cloudflare Pages**
