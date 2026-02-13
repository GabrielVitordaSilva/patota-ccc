import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { UserPlus, UserMinus, Shield } from 'lucide-react'

interface Member {
  id: string
  nome: string
  email: string
  ativo: boolean
  criado_em: string
  is_admin: boolean
}

type AdminRow = { member_id: string }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMembers = async () => {
    setLoading(true)

    const { data: membersData, error: membersErr } = await supabase
      .from('members')
      .select('id,nome,email,ativo,criado_em')
      .order('nome')
      .returns<Omit<Member, 'is_admin'>[]>()

    const { data: adminsData, error: adminsErr } = await supabase
      .from('admins')
      .select('member_id')
      .returns<AdminRow[]>()

    if (!membersErr && !adminsErr && membersData && adminsData) {
      const adminIds = adminsData.map((a) => a.member_id)

      setMembers(
        membersData.map((m) => ({
          ...m,
          is_admin: adminIds.includes(m.id),
        }))
      )
    } else {
      // Se quiser, dá pra logar os erros:
      // console.error({ membersErr, adminsErr })
      setMembers([])
    }

    setLoading(false)
  }

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault()

    const emailLower = email.toLowerCase()

    const { error } = await supabase.from('members').insert([
      {
        nome,
        email: emailLower,
        ativo: true,
      },
    ])

    if (!error) {
      setShowAddMember(false)
      setNome('')
      setEmail('')
      await loadMembers()

      // Enviar convite por e-mail
      await supabase.auth.signInWithOtp({
        email: emailLower,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
    } else {
      alert('Erro ao adicionar membro')
    }
  }

  const handleToggleAtivo = async (memberId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('members')
      .update({ ativo: !currentStatus })
      .eq('id', memberId)

    if (!error) {
      await loadMembers()
    } else {
      alert('Erro ao atualizar status')
    }
  }

  const handleGerarMensalidades = async () => {
    const competencia = prompt('Digite a competência (YYYY-MM):')
    if (!competencia) return

    const { data, error } = await supabase.rpc('gerar_mensalidades_mes', {
      mes_competencia: competencia,
    })

    if (!error) {
      alert(`${data} mensalidades geradas para ${competencia}`)
    } else {
      alert('Erro ao gerar mensalidades')
    }
  }

  const handleAddIsencao = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('exemptions').insert([
      {
        member_id: selectedMember,
        competencia: competenciaIsencao,
        motivo: motivoIsencao,
        aprovado_por: user.id,
      },
    ])

    if (!error) {
      setShowIsencao(false)
      setSelectedMember(null)
      alert('Isenção adicionada!')
    } else {
      alert('Erro ao adicionar isenção')
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
          <button onClick={handleGerarMensalidades} className="btn border border-gray-300">
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
                    <span title="Admin" className="inline-flex">
                      <Shield className="w-4 h-4 text-primary" aria-label="Admin" />
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600">{member.email}</p>
              </div>

              <span
                className={`text-xs px-2 py-1 rounded ${
                  member.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {member.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleToggleAtivo(member.id, member.ativo)}
                className={`btn flex-1 text-sm ${member.ativo ? 'border border-gray-300' : 'btn-success'}`}
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
                <p className="text-xs text-gray-600 mt-1">Um convite será enviado para este e-mail</p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="btn border border-gray-300 flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1">
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
                <button type="submit" className="btn btn-primary flex-1">
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
