# Parte 6: Funcionalidades do Admin

## 8. Painel Admin

### 8.1 Layout Admin

**src/components/AdminLayout.tsx:**
```typescript
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Wallet, Users, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/caixa', icon: Wallet, label: 'Caixa' },
    { path: '/admin/membros', icon: Users, label: 'Membros' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-gray-800 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-gray-600 hover:text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
```

### 8.2 Dashboard Admin

**src/pages/admin/Dashboard.tsx:**
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Calendar, Plus, Users, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Event {
  id: string
  tipo: string
  data_hora: string
  local: string
  confirmados: number
  lista_fechada: boolean
}

interface PendingPayment {
  id: string
  member_nome: string
  valor: number
  criado_em: string
  comprovante_url: string | null
}

export default function AdminDashboard() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateEvent, setShowCreateEvent] = useState(false)

  // Form states
  const [eventType, setEventType] = useState<'JOGO' | 'INTERNO'>('JOGO')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventDescription, setEventDescription] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    // Carregar eventos próximos
    const { data: events } = await supabase
      .from('events')
      .select(`
        id,
        tipo,
        data_hora,
        local,
        event_rsvp!left(status)
      `)
      .gte('data_hora', new Date().toISOString())
      .order('data_hora', { ascending: true })
      .limit(5)

    if (events) {
      setUpcomingEvents(events.map(e => ({
        ...e,
        confirmados: e.event_rsvp?.filter((r: any) => r.status === 'VOU').length || 0,
        lista_fechada: false // TODO: implementar controle de lista fechada
      })))
    }

    // Carregar pagamentos pendentes
    const { data: payments } = await supabase
      .from('payments')
      .select(`
        id,
        valor,
        criado_em,
        comprovante_url,
        members!payments_member_id_fkey(nome)
      `)
      .eq('status', 'PENDENTE')
      .order('criado_em', { ascending: true })

    if (payments) {
      setPendingPayments(payments.map(p => ({
        id: p.id,
        member_nome: p.members?.nome || 'Desconhecido',
        valor: p.valor,
        criado_em: p.criado_em,
        comprovante_url: p.comprovante_url
      })))
    }

    setLoading(false)
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dataHora = new Date(`${eventDate}T${eventTime}`)

    const { error } = await supabase
      .from('events')
      .insert({
        tipo: eventType,
        data_hora: dataHora.toISOString(),
        local: eventLocation,
        descricao: eventDescription || null,
        criado_por: user.id
      })

    if (!error) {
      setShowCreateEvent(false)
      setEventDate('')
      setEventTime('')
      setEventLocation('')
      setEventDescription('')
      loadDashboardData()
    }
  }

  const handleConfirmPayment = async (paymentId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.rpc('confirmar_pagamento', {
      p_payment_id: paymentId,
      p_admin_id: user.id
    })

    if (!error) {
      alert('Pagamento confirmado!')
      loadDashboardData()
    }
  }

  const handleRejectPayment = async (paymentId: string) => {
    const { error } = await supabase
      .from('payments')
      .update({ status: 'REJEITADO' })
      .eq('id', paymentId)

    if (!error) {
      alert('Pagamento rejeitado')
      loadDashboardData()
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
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-gray-600">Visão geral e ações rápidas</p>
        </div>
        <button
          onClick={() => setShowCreateEvent(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Criar Evento
        </button>
      </div>

      {/* Próximos Eventos */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Próximos Eventos</h2>
        </div>

        {upcomingEvents.length === 0 ? (
          <p className="text-gray-600">Nenhum evento agendado</p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => window.location.href = `/admin/evento/${event.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      event.tipo === 'JOGO' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {event.tipo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{event.confirmados} confirmados</span>
                  </div>
                </div>
                <p className="font-medium">
                  {format(new Date(event.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-sm text-gray-600">{event.local}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagamentos Pendentes */}
      {pendingPayments.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-6 h-6 text-warning" />
            <h2 className="text-xl font-bold">Pagamentos Pendentes ({pendingPayments.length})</h2>
          </div>

          <div className="space-y-3">
            {pendingPayments.map((payment) => (
              <div key={payment.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{payment.member_nome}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(payment.criado_em), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <p className="font-bold text-lg">R$ {payment.valor.toFixed(2)}</p>
                </div>

                {payment.comprovante_url && (
                  <a
                    href={payment.comprovante_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mb-3 block"
                  >
                    📎 Ver Comprovante
                  </a>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirmPayment(payment.id)}
                    className="btn btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirmar
                  </button>
                  <button
                    onClick={() => handleRejectPayment(payment.id)}
                    className="btn btn-danger flex-1 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Criar Evento */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Criar Novo Evento</h2>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Evento</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as 'JOGO' | 'INTERNO')}
                  className="input"
                  required
                >
                  <option value="JOGO">Jogo</option>
                  <option value="INTERNO">Evento Interno</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Horário</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Local</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Ex: Arena do Parque"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Informações adicionais..."
                  className="input"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateEvent(false)}
                  className="btn border border-gray-300 flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Criar Evento
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

### 8.3 Página de Gestão do Caixa

**src/pages/admin/Caixa.tsx:**
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Wallet, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { format } from 'date-fns'

interface CaixaEntry {
  id: string
  tipo: 'ENTRADA' | 'SAIDA'
  categoria: string
  valor: number
  descricao: string | null
  data_lancamento: string
  lancado_por: {
    nome: string
  }
}

interface SaldoInfo {
  total_entradas: number
  total_saidas: number
  saldo_atual: number
}

export default function AdminCaixa() {
  const [entries, setEntries] = useState<CaixaEntry[]>([])
  const [saldo, setSaldo] = useState<SaldoInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddEntry, setShowAddEntry] = useState(false)

  // Form states
  const [tipo, setTipo] = useState<'ENTRADA' | 'SAIDA'>('SAIDA')
  const [categoria, setCategoria] = useState('CAMPO')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataLancamento, setDataLancamento] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    loadCaixaData()
  }, [])

  const loadCaixaData = async () => {
    // Carregar saldo
    const { data: saldoData } = await supabase
      .from('saldo_caixa')
      .select('*')
      .single()

    setSaldo(saldoData)

    // Carregar lançamentos
    const { data: entriesData } = await supabase
      .from('cash_ledger')
      .select(`
        id,
        tipo,
        categoria,
        valor,
        descricao,
        data_lancamento,
        members!cash_ledger_lancado_por_fkey(nome)
      `)
      .order('data_lancamento', { ascending: false })
      .limit(50)

    if (entriesData) {
      setEntries(entriesData.map(e => ({
        ...e,
        lancado_por: { nome: e.members?.nome || 'Sistema' }
      })))
    }

    setLoading(false)
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('cash_ledger')
      .insert({
        tipo,
        categoria,
        valor: parseFloat(valor),
        descricao: descricao || null,
        data_lancamento: dataLancamento,
        lancado_por: user.id
      })

    if (!error) {
      setShowAddEntry(false)
      setValor('')
      setDescricao('')
      loadCaixaData()
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
          <h1 className="text-2xl font-bold">Gestão do Caixa</h1>
          <p className="text-gray-600">Controle de entradas e saídas</p>
        </div>
        <button
          onClick={() => setShowAddEntry(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Lançamento
        </button>
      </div>

      {/* Saldo */}
      {saldo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <p className="text-sm opacity-90">Entradas</p>
            </div>
            <p className="text-3xl font-bold">
              R$ {saldo.total_entradas.toFixed(2)}
            </p>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5" />
              <p className="text-sm opacity-90">Saídas</p>
            </div>
            <p className="text-3xl font-bold">
              R$ {saldo.total_saidas.toFixed(2)}
            </p>
          </div>

          <div className="card bg-gradient-to-br from-primary to-blue-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5" />
              <p className="text-sm opacity-90">Saldo Atual</p>
            </div>
            <p className="text-3xl font-bold">
              R$ {saldo.saldo_atual.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Lançamentos */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Últimos Lançamentos</h2>

        {entries.length === 0 ? (
          <p className="text-gray-600">Nenhum lançamento encontrado</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`p-4 rounded-lg border-2 ${
                  entry.tipo === 'ENTRADA'
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        entry.tipo === 'ENTRADA'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.tipo}
                      </span>
                      <span className="text-xs font-medium text-gray-600">
                        {entry.categoria}
                      </span>
                    </div>
                    <p className="font-medium">{entry.descricao || '-'}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(entry.data_lancamento), 'dd/MM/yyyy')} • 
                      Por {entry.lancado_por.nome}
                    </p>
                  </div>
                  <p className={`text-2xl font-bold ${
                    entry.tipo === 'ENTRADA' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {entry.tipo === 'ENTRADA' ? '+' : '-'}R$ {entry.valor.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Adicionar Lançamento */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Novo Lançamento</h2>

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as 'ENTRADA' | 'SAIDA')}
                  className="input"
                  required
                >
                  <option value="SAIDA">Saída</option>
                  <option value="ENTRADA">Entrada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="input"
                  required
                >
                  {tipo === 'SAIDA' ? (
                    <>
                      <option value="CAMPO">Campo</option>
                      <option value="ARBITRAGEM">Arbitragem</option>
                      <option value="BOLA">Bola/Material</option>
                      <option value="OUTRO">Outro</option>
                    </>
                  ) : (
                    <>
                      <option value="MENSALIDADE">Mensalidade</option>
                      <option value="MULTA">Multa</option>
                      <option value="CONVIDADO">Convidado</option>
                      <option value="ARRECADACAO">Arrecadação</option>
                      <option value="OUTRO">Outro</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0.00"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data</label>
                <input
                  type="date"
                  value={dataLancamento}
                  onChange={(e) => setDataLancamento(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Aluguel do campo dia 15/02"
                  className="input"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddEntry(false)}
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
    </div>
  )
}
```

*(Continua no próximo arquivo...)*
