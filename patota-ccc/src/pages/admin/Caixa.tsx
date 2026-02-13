import { useEffect, useState, FormEvent } from 'react'
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

  const handleAddEntry = async (e: FormEvent) => {
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
