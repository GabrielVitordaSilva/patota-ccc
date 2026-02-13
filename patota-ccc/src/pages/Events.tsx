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
