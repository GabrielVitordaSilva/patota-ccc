import { useEffect, useState, FormEvent } from 'react'
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

  const handleCreateEvent = async (e: FormEvent) => {
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
