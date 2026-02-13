# Parte 4: Mais Funcionalidades do Jogador

## 7.5 Página de Eventos

**src/pages/Events.tsx:**
```typescript
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Event {
  id: string
  tipo: string
  data_hora: string
  local: string
  descricao: string | null
  confirmados: number
  minha_confirmacao: string | null
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([])
  const [filter, setFilter] = useState<'proximos' | 'passados'>('proximos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [filter])

  const loadEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    let query = supabase
      .from('events')
      .select(`
        id,
        tipo,
        data_hora,
        local,
        descricao,
        event_rsvp!left(status, member_id)
      `)

    if (filter === 'proximos') {
      query = query.gte('data_hora', new Date().toISOString())
        .order('data_hora', { ascending: true })
    } else {
      query = query.lt('data_hora', new Date().toISOString())
        .order('data_hora', { ascending: false })
    }

    const { data, error } = await query

    if (data && !error) {
      const eventsWithConfirmations = data.map(event => ({
        id: event.id,
        tipo: event.tipo,
        data_hora: event.data_hora,
        local: event.local,
        descricao: event.descricao,
        confirmados: event.event_rsvp?.filter((r: any) => r.status === 'VOU').length || 0,
        minha_confirmacao: event.event_rsvp?.find((r: any) => r.member_id === user?.id)?.status || null
      }))
      
      setEvents(eventsWithConfirmations)
    }

    setLoading(false)
  }

  const getConfirmationBadge = (status: string | null) => {
    switch (status) {
      case 'VOU':
        return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ Confirmado</span>
      case 'TALVEZ':
        return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">🤔 Talvez</span>
      case 'NAO_VOU':
        return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">❌ Não vou</span>
      default:
        return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">⏳ Pendente</span>
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
      <div>
        <h1 className="text-2xl font-bold mb-2">Eventos</h1>
        <p className="text-gray-600">Jogos e eventos internos da patota</p>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('proximos')}
          className={`btn flex-1 ${
            filter === 'proximos' ? 'btn-primary' : 'border border-gray-300'
          }`}
        >
          Próximos
        </button>
        <button
          onClick={() => setFilter('passados')}
          className={`btn flex-1 ${
            filter === 'passados' ? 'btn-primary' : 'border border-gray-300'
          }`}
        >
          Passados
        </button>
      </div>

      {/* Lista de Eventos */}
      {events.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            Nenhum evento {filter === 'proximos' ? 'agendado' : 'encontrado'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/eventos/${event.id}`}
              className="card hover:shadow-lg transition-shadow block"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    event.tipo === 'JOGO' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {event.tipo}
                  </span>
                </div>
                {getConfirmationBadge(event.minha_confirmacao)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    {format(new Date(event.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{event.local}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{event.confirmados} confirmado(s)</span>
                </div>

                {event.descricao && (
                  <p className="text-sm text-gray-600 mt-2">{event.descricao}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

**src/pages/EventDetail.tsx:**
```typescript
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, MapPin, Users, ArrowLeft, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EventDetail {
  id: string
  tipo: string
  data_hora: string
  local: string
  descricao: string | null
  rsvps: Array<{
    member_id: string
    status: string
    convidados: number
    member: {
      nome: string
    }
  }>
  minha_confirmacao: string | null
  meus_convidados: number
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [convidados, setConvidados] = useState(0)
  const [showConvidadosModal, setShowConvidadosModal] = useState(false)

  useEffect(() => {
    loadEvent()
  }, [id])

  const loadEvent = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        tipo,
        data_hora,
        local,
        descricao,
        event_rsvp!left(
          member_id,
          status,
          convidados,
          members(nome)
        )
      `)
      .eq('id', id)
      .single()

    if (data && !error) {
      const minhaConfirmacao = data.event_rsvp?.find((r: any) => r.member_id === user?.id)
      
      setEvent({
        ...data,
        rsvps: data.event_rsvp || [],
        minha_confirmacao: minhaConfirmacao?.status || null,
        meus_convidados: minhaConfirmacao?.convidados || 0
      })
      setConvidados(minhaConfirmacao?.convidados || 0)
    }

    setLoading(false)
  }

  const handleConfirmarPresenca = async (status: 'VOU' | 'NAO_VOU' | 'TALVEZ') => {
    if (!event || !user) return

    const { error } = await supabase
      .from('event_rsvp')
      .upsert({
        event_id: event.id,
        member_id: user.id,
        status,
        convidados: status === 'VOU' ? convidados : 0
      })

    if (!error) {
      loadEvent()
    }
  }

  const handleSalvarConvidados = async () => {
    if (!event || !user) return

    // Chama a função do banco para criar multa
    const { data, error } = await supabase
      .rpc('adicionar_convidados', {
        p_event_id: event.id,
        p_member_id: user.id,
        p_quantidade: convidados
      })

    if (!error) {
      setShowConvidadosModal(false)
      loadEvent()
      alert(`${convidados} convidado(s) adicionado(s). Multa de R$ ${convidados * 5} gerada.`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600">Evento não encontrado</p>
      </div>
    )
  }

  const confirmados = event.rsvps.filter(r => r.status === 'VOU')
  const talvez = event.rsvps.filter(r => r.status === 'TALVEZ')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            event.tipo === 'JOGO' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-purple-100 text-purple-800'
          }`}>
            {event.tipo}
          </span>
        </div>
      </div>

      {/* Detalhes do Evento */}
      <div className="card">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">
              {format(new Date(event.data_hora), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-5 h-5" />
            <span>{event.local}</span>
          </div>

          {event.descricao && (
            <p className="text-gray-700 mt-2">{event.descricao}</p>
          )}
        </div>
      </div>

      {/* Confirmar Presença */}
      <div className="card">
        <h3 className="font-bold mb-3">Sua Confirmação</h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => handleConfirmarPresenca('VOU')}
            className={`btn ${
              event.minha_confirmacao === 'VOU'
                ? 'btn-success'
                : 'border border-gray-300'
            }`}
          >
            ✅ Vou
          </button>
          <button
            onClick={() => handleConfirmarPresenca('TALVEZ')}
            className={`btn ${
              event.minha_confirmacao === 'TALVEZ'
                ? 'bg-yellow-500 text-white'
                : 'border border-gray-300'
            }`}
          >
            🤔 Talvez
          </button>
          <button
            onClick={() => handleConfirmarPresenca('NAO_VOU')}
            className={`btn ${
              event.minha_confirmacao === 'NAO_VOU'
                ? 'btn-danger'
                : 'border border-gray-300'
            }`}
          >
            ❌ Não
          </button>
        </div>

        {event.minha_confirmacao === 'VOU' && (
          <button
            onClick={() => setShowConvidadosModal(true)}
            className="btn border border-gray-300 w-full flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Convidados {event.meus_convidados > 0 && `(${event.meus_convidados})`}
          </button>
        )}
      </div>

      {/* Lista de Confirmados */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Confirmados ({confirmados.length})</h3>
        </div>

        {confirmados.length === 0 ? (
          <p className="text-gray-600 text-sm">Nenhuma confirmação ainda</p>
        ) : (
          <ul className="space-y-2">
            {confirmados.map((rsvp) => (
              <li key={rsvp.member_id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span>{rsvp.member.nome}</span>
                {rsvp.convidados > 0 && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    +{rsvp.convidados} convidado(s)
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {talvez.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Talvez ({talvez.length})</h4>
            <ul className="space-y-1">
              {talvez.map((rsvp) => (
                <li key={rsvp.member_id} className="text-sm text-gray-600">
                  {rsvp.member.nome}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Modal de Convidados */}
      {showConvidadosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Adicionar Convidados</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Quantos convidados?
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={convidados}
                onChange={(e) => setConvidados(parseInt(e.target.value) || 0)}
                className="input"
              />
              <p className="text-sm text-gray-600 mt-2">
                Custo: R$ {convidados * 5}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConvidadosModal(false)}
                className="btn border border-gray-300 flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarConvidados}
                className="btn btn-primary flex-1"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

*(Continua...)*
