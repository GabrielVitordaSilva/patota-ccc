import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NextEvent {
  id: string
  tipo: string
  data_hora: string
  local: string
  minha_confirmacao: string | null
}

interface Pendencias {
  mensalidades_pendentes: number
  multas_pendentes: number
  total_pendente: number
}

export default function Home() {
  const [nextEvent, setNextEvent] = useState<NextEvent | null>(null)
  const [pendencias, setPendencias] = useState<Pendencias | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    // Buscar próximo evento
    const { data: eventos } = await supabase
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
      .limit(1)

    if (eventos && eventos.length > 0) {
      const evento = eventos[0]
      setNextEvent({
        ...evento,
        minha_confirmacao: evento.event_rsvp?.[0]?.status || null
      })
    }

    // Buscar pendências financeiras
    if (user) {
      const { data: dues } = await supabase
        .from('dues')
        .select('valor')
        .eq('member_id', user.id)
        .eq('status', 'PENDENTE')

      const { data: fines } = await supabase
        .from('fines')
        .select('valor')
        .eq('member_id', user.id)
        .not('id', 'in', 
          supabase
            .from('payments')
            .select('fine_id')
            .eq('status', 'CONFIRMADO')
        )

      const totalDues = dues?.reduce((acc, d) => acc + parseFloat(d.valor.toString()), 0) || 0
      const totalFines = fines?.reduce((acc, f) => acc + parseFloat(f.valor.toString()), 0) || 0

      setPendencias({
        mensalidades_pendentes: dues?.length || 0,
        multas_pendentes: fines?.length || 0,
        total_pendente: totalDues + totalFines
      })
    }

    setLoading(false)
  }

  const handleConfirmarPresenca = async (status: 'VOU' | 'NAO_VOU' | 'TALVEZ') => {
    if (!nextEvent || !user) return

    const { error } = await supabase
      .from('event_rsvp')
      .upsert({
        event_id: nextEvent.id,
        member_id: user.id,
        status
      })

    if (!error) {
      setNextEvent({ ...nextEvent, minha_confirmacao: status })
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
      {/* Próximo Jogo */}
      {nextEvent && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Próximo {nextEvent.tipo}</h2>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Data e Hora</p>
              <p className="font-medium">
                {format(new Date(nextEvent.data_hora), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Local</p>
              <p className="font-medium">{nextEvent.local}</p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Confirmar Presença:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleConfirmarPresenca('VOU')}
                  className={`btn ${
                    nextEvent.minha_confirmacao === 'VOU'
                      ? 'btn-success'
                      : 'border border-gray-300'
                  }`}
                >
                  ✅ Vou
                </button>
                <button
                  onClick={() => handleConfirmarPresenca('TALVEZ')}
                  className={`btn ${
                    nextEvent.minha_confirmacao === 'TALVEZ'
                      ? 'bg-yellow-500 text-white'
                      : 'border border-gray-300'
                  }`}
                >
                  🤔 Talvez
                </button>
                <button
                  onClick={() => handleConfirmarPresenca('NAO_VOU')}
                  className={`btn ${
                    nextEvent.minha_confirmacao === 'NAO_VOU'
                      ? 'btn-danger'
                      : 'border border-gray-300'
                  }`}
                >
                  ❌ Não
                </button>
              </div>
            </div>

            <Link
              to={`/eventos/${nextEvent.id}`}
              className="btn btn-primary w-full mt-4"
            >
              Ver Detalhes do Evento
            </Link>
          </div>
        </div>
      )}

      {/* Pendências Financeiras */}
      {pendencias && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Minhas Pendências</h2>
          </div>

          {pendencias.total_pendente > 0 ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900 mb-2">
                      Você possui valores pendentes
                    </p>
                    <div className="space-y-1 text-sm text-yellow-800">
                      {pendencias.mensalidades_pendentes > 0 && (
                        <p>• {pendencias.mensalidades_pendentes} mensalidade(s) pendente(s)</p>
                      )}
                      {pendencias.multas_pendentes > 0 && (
                        <p>• {pendencias.multas_pendentes} multa(s) pendente(s)</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total a Pagar</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {pendencias.total_pendente.toFixed(2)}
                </p>
              </div>

              <Link
                to="/financeiro"
                className="btn btn-primary w-full"
              >
                Ir para Financeiro
              </Link>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Tudo certo!</p>
                  <p className="text-sm text-green-700">Você não possui pendências.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
