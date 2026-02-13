# Parte 7: Gestão de Membros, PWA e Deploy

## 8.4 Página de Gestão de Membros

**src/pages/admin/Members.tsx:**
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, UserPlus, UserMinus, Shield } from 'lucide-react'

interface Member {
  id: string
  nome: string
  email: string
  ativo: boolean
  criado_em: string
  is_admin: boolean
}

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showIsencao, setShowIsencao] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  // Form states
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [motivoIsencao, setMotivoIsencao] = useState<'LESAO' | 'TRABALHO'>('LESAO')
  const [competenciaIsencao, setCompetenciaIsencao] = useState(
    new Date().toISOString().substring(0, 7) // YYYY-MM
  )

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    const { data: membersData } = await supabase
      .from('members')
      .select(`
        id,
        nome,
        email,
        ativo,
        criado_em
      `)
      .order('nome')

    const { data: adminsData } = await supabase
      .from('admins')
      .select('member_id')

    if (membersData && adminsData) {
      const adminIds = adminsData.map(a => a.member_id)
      setMembers(membersData.map(m => ({
        ...m,
        is_admin: adminIds.includes(m.id)
      })))
    }

    setLoading(false)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase
      .from('members')
      .insert({
        nome,
        email: email.toLowerCase(),
        ativo: true
      })

    if (!error) {
      setShowAddMember(false)
      setNome('')
      setEmail('')
      loadMembers()
      
      // Enviar convite por e-mail
      await supabase.auth.signInWithOtp({
        email: email.toLowerCase(),
        options: {
          emailRedirectTo: window.location.origin
        }
      })
    }
  }

  const handleToggleAtivo = async (memberId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('members')
      .update({ ativo: !currentStatus })
      .eq('id', memberId)

    if (!error) {
      loadMembers()
    }
  }

  const handleGerarMensalidades = async () => {
    const competencia = prompt('Digite a competência (YYYY-MM):')
    if (!competencia) return

    const { data, error } = await supabase
      .rpc('gerar_mensalidades_mes', { mes_competencia: competencia })

    if (!error) {
      alert(`${data} mensalidades geradas para ${competencia}`)
    } else {
      alert('Erro ao gerar mensalidades')
    }
  }

  const handleAddIsencao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('exemptions')
      .insert({
        member_id: selectedMember,
        competencia: competenciaIsencao,
        motivo: motivoIsencao,
        aprovado_por: user.id
      })

    if (!error) {
      setShowIsencao(false)
      setSelectedMember(null)
      alert('Isenção adicionada!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Membros</h1>
          <p className="text-gray-600">{members.length} membros cadastrados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGerarMensalidades}
            className="btn border border-gray-300"
          >
            Gerar Mensalidades
          </button>
          <button
            onClick={() => setShowAddMember(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Adicionar Membro
          </button>
        </div>
      </div>

      {/* Lista de Membros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div key={member.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">{member.nome}</h3>
                  {member.is_admin && (
                    <Shield className="w-4 h-4 text-primary" title="Admin" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{member.email}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                member.ativo
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {member.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleToggleAtivo(member.id, member.ativo)}
                className={`btn flex-1 text-sm ${
                  member.ativo
                    ? 'border border-gray-300'
                    : 'btn-success'
                }`}
              >
                {member.ativo ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-1" />
                    Desativar
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Ativar
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setSelectedMember(member.id)
                  setShowIsencao(true)
                }}
                className="btn border border-gray-300 flex-1 text-sm"
              >
                Isenção
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Adicionar Membro */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Adicionar Novo Membro</h2>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="João da Silva"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@email.com"
                  className="input"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  Um convite será enviado para este e-mail
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="btn border border-gray-300 flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Isenção */}
      {showIsencao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Marcar Isenção</h2>

            <form onSubmit={handleAddIsencao} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Competência (Mês)</label>
                <input
                  type="month"
                  value={competenciaIsencao}
                  onChange={(e) => setCompetenciaIsencao(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Motivo</label>
                <select
                  value={motivoIsencao}
                  onChange={(e) => setMotivoIsencao(e.target.value as 'LESAO' | 'TRABALHO')}
                  className="input"
                  required
                >
                  <option value="LESAO">Lesão</option>
                  <option value="TRABALHO">Trabalho</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  A mensalidade do mês será marcada como ISENTA (R$ 0) para este membro.
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowIsencao(false)
                    setSelectedMember(null)
                  }}
                  className="btn border border-gray-300 flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Confirmar Isenção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 9. Configuração PWA

### 9.1 Adicionar ícones do PWA

Crie os ícones da aplicação (você pode usar https://realfavicongenerator.net):

- `public/icon-192x192.png` (192x192)
- `public/icon-512x512.png` (512x512)
- `public/apple-touch-icon.png` (180x180)

### 9.2 Configurar cores do tema

**public/index.html** - Adicione no `<head>`:
```html
<meta name="theme-color" content="#1d4ed8" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

### 9.3 Service Worker customizado (opcional)

Se precisar de funcionalidades offline específicas, crie:

**src/service-worker.ts:**
```typescript
/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

// Precache todos os assets
precacheAndRoute(self.__WB_MANIFEST)

// Estratégia para API calls
registerRoute(
  ({ url }) => url.origin === 'https://seu-projeto.supabase.co',
  new NetworkFirst({
    cacheName: 'api-cache',
  })
)

// Estratégia para imagens
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
  })
)
```

---

## 10. Deploy no Cloudflare Pages

### 10.1 Preparar o projeto para deploy

**Adicionar script de build no `package.json`:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### 10.2 Criar arquivo de redirecionamento

**public/_redirects:**
```
/*    /index.html   200
```

Isso garante que o React Router funcione corretamente.

### 10.3 Deploy via GitHub

1. **Crie um repositório no GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/patota-ccc.git
git push -u origin main
```

2. **Configure no Cloudflare Pages:**
   - Acesse https://dash.cloudflare.com
   - Vá em "Workers & Pages"
   - Clique em "Create application" > "Pages" > "Connect to Git"
   - Selecione seu repositório
   - Configure:
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
     - **Environment variables**:
       - `VITE_SUPABASE_URL`: sua URL do Supabase
       - `VITE_SUPABASE_ANON_KEY`: sua chave anon do Supabase

3. **Deploy:**
   - Clique em "Save and Deploy"
   - Aguarde o build (1-2 minutos)
   - Sua aplicação estará disponível em `https://seu-projeto.pages.dev`

### 10.4 Configurar domínio customizado (opcional)

Se você tiver um domínio:

1. No Cloudflare Pages, vá em "Custom domains"
2. Adicione seu domínio (ex: `patotaccc.com.br`)
3. Configure os DNS conforme instruções
4. Aguarde propagação (alguns minutos)

---

## 11. Testes Finais

### 11.1 Checklist de funcionalidades

**Jogador:**
- [ ] Login com magic link
- [ ] Ver próximo jogo na home
- [ ] Confirmar presença em eventos
- [ ] Adicionar convidados
- [ ] Ver lista de eventos
- [ ] Ver pendências financeiras
- [ ] Copiar chave PIX
- [ ] Enviar comprovante de pagamento
- [ ] Ver ranking mensal e geral
- [ ] Ver regras e valores

**Admin:**
- [ ] Criar eventos (jogos e internos)
- [ ] Marcar presença dos jogadores
- [ ] Confirmar/rejeitar pagamentos
- [ ] Adicionar lançamentos no caixa
- [ ] Ver saldo do caixa
- [ ] Adicionar/desativar membros
- [ ] Marcar isenções
- [ ] Gerar mensalidades do mês

### 11.2 Testar PWA

1. **No Chrome mobile:**
   - Abra o app
   - Menu > "Adicionar à tela inicial"
   - Verifique se abre em modo standalone
   - Teste modo offline (desligue internet)

2. **Notificações (opcional - implementar depois):**
   - Pedir permissão de notificações
   - Testar envio de notificações

---

## 12. Próximos Passos e Melhorias

### 12.1 Features v2 (futuras)

1. **Notificações Push:**
   - Lembrete de mensalidade
   - Novo evento criado
   - Pagamento confirmado

2. **Chat da Patota:**
   - Chat em tempo real
   - Compartilhar fotos dos jogos

3. **Estatísticas:**
   - Gráficos de presença
   - Histórico de jogos
   - Evolução do caixa

4. **Reserva de Campo:**
   - Integração com sistema de reservas
   - Divisão de custos automática

### 12.2 Otimizações

1. **Performance:**
   - Lazy loading de páginas
   - Compressão de imagens
   - Cache agressivo

2. **UX:**
   - Skeleton loaders
   - Feedback visual melhor
   - Animações suaves

3. **Segurança:**
   - Rate limiting
   - Validações mais robustas
   - Logs de auditoria detalhados

---

## 13. Manutenção

### 13.1 Backups

Configure backups automáticos no Supabase:
1. Vá em Settings > Database
2. Configure "Point-in-time recovery" (plano pago)
3. Ou faça backups manuais mensais via SQL dump

### 13.2 Monitoramento

Use o Supabase Dashboard para:
- Monitorar uso de API
- Ver logs de erros
- Acompanhar performance de queries

### 13.3 Atualizações

Mantenha dependências atualizadas:
```bash
npm update
npm audit fix
```

---

## Conclusão

Agora você tem um sistema completo de gestão da patota! 🎉

**O que você construiu:**
- ✅ PWA instalável no celular
- ✅ Sistema 100% gratuito
- ✅ Autenticação segura
- ✅ Gestão de eventos e presenças
- ✅ Controle financeiro completo
- ✅ Ranking de jogadores
- ✅ Painel admin poderoso

**Stack usado:**
- React + Vite + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- Cloudflare Pages (hosting)
- Tailwind CSS (styling)

Qualquer dúvida, consulte a documentação oficial:
- React: https://react.dev
- Supabase: https://supabase.com/docs
- Cloudflare Pages: https://developers.cloudflare.com/pages
