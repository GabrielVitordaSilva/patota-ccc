import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Calendar, MapPin, Users, Save, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type RSVPStatus = 'VOU' | 'NAO_VOU' | 'TALVEZ'
type PresenceStatus = 'PRESENTE' | 'AUSENTE' | 'ATRASO' | 'JUSTIFICADO'

interface EventInfo {
  id: string
  tipo: 'JOGO' | 'INTERNO'
  data_hora: string
  local: string
  descricao: string | null
}

interface PersonRow {
  member_id: string
  nome: string
  telefone: string | null
  rsvp_status: RSVPStatus | null
  convidados: number
  presenca_status: PresenceStatus | null
}

export default function AdminEvent() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [rows, setRows] = useState<PersonRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingAll, setSavingAll] = useState(false)

  useEffect(() => {
    if (!id) return
    load()
  }, [id])

  const load = async () => {
    setLoading(true)

    const { data: ev } = await supabase
      .from('events')
      .select('id,tipo,data_hora,local,descricao')
      .eq('id', id!)
      .single()

    setEvent(ev ?? null)

    const { data: rsvps } = await supabase
      .from('event_rsvp')
      .select('member_id,status,convidados,members(nome,telefone)')
      .eq('event_id', id!)

    const { data: att } = await supabase
      .from('event_attendance')
      .select('member_id,status')
      .eq('event_id', id!)

    const attMap = new Map<string, PresenceStatus>()
    ;(att ?? []).forEach((a: any) => attMap.set(a.member_id, a.status))

    const merged: PersonRow[] = (rsvps ?? []).map((r: any) => ({
      member_id: r.member_id,
      nome: r.members?.nome ?? 'Sem nome',
      telefone: r.members?.telefone ?? null,
      rsvp_status: r.status,
      convidados: r.convidados ?? 0,
      presenca_status: attMap.get(r.member_id) ?? null,
    }))

    // Ordena: primeiro VOU, depois TALVEZ, depois NAO_VOU
    const order: Record<string, number> = { VOU: 0, TALVEZ: 1, NAO_VOU: 2 }
    merged.sort((a, b) => (order[a.rsvp_status ?? 'NAO_VOU'] ?? 99) - (order[b.rsvp_status ?? 'NAO_VOU'] ?? 99) || a.nome.localeCompare(b.nome))

    setRows(merged)
    setLoading(false)
  }

  const summary = useMemo(() => {
    const confirmados = rows.filter(r => r.rsvp_status === 'VOU').length
    const convidados = rows.reduce((acc, r) => acc + (r.convidados || 0), 0)
    const presentes = rows.filter(r => r.presenca_status === 'PRESENTE').length
    const atrasos = rows.filter(r => r.presenca_status === 'ATRASO').length
    const ausentes = rows.filter(r => r.presenca_status === 'AUSENTE').length
    const just = rows.filter(r => r.presenca_status === 'JUSTIFICADO').length
    return { confirmados, convidados, presentes, atrasos, ausentes, just }
  }, [rows])

  const setPresenceLocal = (member_id: string, status: PresenceStatus | null) => {
    setRows(prev => prev.map(r => (r.member_id === member_id ? { ...r, presenca_status: status } : r)))
  }

  const savePresence = async (member_id: string, status: PresenceStatus) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.rpc('marcar_presenca', {
      p_event_id: id,
      p_member_id: member_id,
      p_status: status,
      p_admin_id: user.id,
    })

    if (error) {
      alert('Erro ao salvar presença: ' + error.message)
      return
    }
  }

  const saveAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSavingAll(true)
    try {
      // Salva somente quem já tem seleção
      for (const r of rows) {
        if (!r.presenca_status) continue
        const { error } = await supabase.rpc('marcar_presenca', {
          p_event_id: id,
          p_member_id: r.member_id,
          p_status: r.presenca_status,
          p_admin_id: user.id,
        })
        if (error) throw error
      }
      alert('Presenças salvas!')
      await load()
    } catch (e: any) {
      alert('Erro ao salvar todas: ' + (e?.message || String(e)))
    } finally {
      setSavingAll(false)
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
      <div className="card">
        <p className="font-medium mb-4">Evento não encontrado.</p>
        <Link to="/admin" className="btn btn-primary">Voltar</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-2 rounded-lg hover:bg-gray-200" title="Voltar">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Evento</h1>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              event.tipo === 'JOGO' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {event.tipo}
            </span>
          </div>
          <div className="text-gray-600 mt-2 space-y-1">
            <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {format(new Date(event.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {event.local}</p>
            {event.descricao && <p className="text-sm">{event.descricao}</p>}
          </div>
        </div>

        <button
          onClick={saveAll}
          disabled={savingAll}
          className="btn btn-primary flex items-center gap-2"
          title="Salvar tudo (quem já está marcado)"
        >
          <Save className="w-5 h-5" />
          {savingAll ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gray-600">Confirmados</p>
          <p className="text-2xl font-bold">{summary.confirmados}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600">Convidados</p>
          <p className="text-2xl font-bold">{summary.convidados}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600">Presentes</p>
          <p className="text-2xl font-bold">{summary.presentes}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600">Atrasos</p>
          <p className="text-2xl font-bold">{summary.atrasos}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600">Ausentes</p>
          <p className="text-2xl font-bold">{summary.ausentes}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600">Justificados</p>
          <p className="text-2xl font-bold">{summary.just}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">RSVP e Presença</h2>
        </div>

        {rows.length === 0 ? (
          <p className="text-gray-600 text-sm">Nenhum RSVP encontrado para este evento.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.member_id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{r.nome}</p>
                    <div className="text-sm text-gray-600 flex flex-wrap gap-3 mt-1">
                      <span>RSVP: <b>{r.rsvp_status ?? '-'}</b></span>
                      <span>Convidados: <b>{r.convidados}</b></span>
                      {r.telefone && <a className="text-primary hover:underline" href={`tel:${r.telefone}`}>{r.telefone}</a>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <select
                      className="input"
                      value={r.presenca_status ?? ''}
                      onChange={async (e) => {
                        const v = e.target.value as PresenceStatus | ''
                        setPresenceLocal(r.member_id, v || null)
                        if (v) await savePresence(r.member_id, v)
                      }}
                    >
                      <option value="">— Selecionar —</option>
                      <option value="PRESENTE">PRESENTE</option>
                      <option value="ATRASO">ATRASO</option>
                      <option value="AUSENTE">AUSENTE</option>
                      <option value="JUSTIFICADO">JUSTIFICADO</option>
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className="btn btn-success"
                        onClick={async () => {
                          setPresenceLocal(r.member_id, 'PRESENTE')
                          await savePresence(r.member_id, 'PRESENTE')
                        }}
                      >
                        Presente
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={async () => {
                          setPresenceLocal(r.member_id, 'AUSENTE')
                          await savePresence(r.member_id, 'AUSENTE')
                        }}
                      >
                        Ausente
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  * Ao marcar <b>ATRASO</b> ou <b>AUSENTE</b>, o banco pode gerar multa automaticamente (conforme regras).
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
