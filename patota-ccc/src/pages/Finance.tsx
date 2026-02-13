import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DollarSign, AlertCircle, Copy, Check, Upload } from 'lucide-react'
import { format } from 'date-fns'

interface Due {
  id: string
  competencia: string
  vencimento: string
  valor: number
  status: string
}

interface Fine {
  id: string
  tipo: string
  valor: number
  observacao: string | null
  criado_em: string
  event: {
    tipo: string
    data_hora: string
  } | null
}

interface Payment {
  id: string
  valor: number
  status: string
  comprovante_url: string | null
  criado_em: string
}

export default function Finance() {
  const [dues, setDues] = useState<Due[]>([])
  const [fines, setFines] = useState<Fine[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [copiedPix, setCopiedPix] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Dados PIX da patota (configure com os dados reais)
  const PIX_KEY = 'patotaccc@email.com' // ou chave aleatória, CPF, etc
  const PIX_NOME = 'PATOTA CCC'

  useEffect(() => {
    loadFinanceData()
  }, [])

  const loadFinanceData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (!user) return

    // Carregar mensalidades
    const { data: duesData } = await supabase
      .from('dues')
      .select('*')
      .eq('member_id', user.id)
      .order('competencia', { ascending: false })

    setDues(duesData || [])

    // Carregar multas (que não foram pagas)
    const { data: finesData } = await supabase
      .from('fines')
      .select(`
        id,
        tipo,
        valor,
        observacao,
        criado_em,
        events(tipo, data_hora)
      `)
      .eq('member_id', user.id)
      .order('criado_em', { ascending: false })

    setFines(finesData || [])

    // Carregar pagamentos
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', user.id)
      .order('criado_em', { ascending: false })

    setPayments(paymentsData || [])

    setLoading(false)
  }

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY)
    setCopiedPix(true)
    setTimeout(() => setCopiedPix(false), 2000)
  }

  const handleUploadComprovante = async (dueId: string, file: File) => {
    if (!user) return

    setUploading(true)

    try {
      // Upload do arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(fileName)

      // Buscar o valor da mensalidade
      const due = dues.find(d => d.id === dueId)
      if (!due) throw new Error('Mensalidade não encontrada')

      // Criar registro de pagamento
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          member_id: user.id,
          due_id: dueId,
          valor: due.valor,
          status: 'PENDENTE',
          comprovante_url: publicUrl
        })

      if (paymentError) throw paymentError

      alert('Comprovante enviado! Aguarde a confirmação do admin.')
      loadFinanceData()
    } catch (error: any) {
      alert('Erro ao enviar comprovante: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const totalPendente = dues
    .filter(d => d.status === 'PENDENTE')
    .reduce((acc, d) => acc + parseFloat(d.valor.toString()), 0) +
    fines.reduce((acc, f) => acc + parseFloat(f.valor.toString()), 0)

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
        <h1 className="text-2xl font-bold mb-2">Meu Financeiro</h1>
        <p className="text-gray-600">Mensalidades, multas e pagamentos</p>
      </div>

      {/* Resumo */}
      <div className="card bg-gradient-to-br from-primary to-blue-600 text-white">
        <p className="text-sm opacity-90 mb-1">Total Pendente</p>
        <p className="text-4xl font-bold mb-4">R$ {totalPendente.toFixed(2)}</p>
        
        <button
          onClick={copyPixKey}
          className="btn bg-white text-primary hover:bg-gray-100 w-full flex items-center justify-center gap-2"
        >
          {copiedPix ? (
            <>
              <Check className="w-5 h-5" />
              Chave PIX Copiada!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copiar Chave PIX
            </>
          )}
        </button>

        <div className="mt-3 text-sm opacity-90 text-center">
          <p>PIX: {PIX_KEY}</p>
          <p>Nome: {PIX_NOME}</p>
        </div>
      </div>

      {/* Mensalidades */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary" />
          Mensalidades
        </h2>

        {dues.length === 0 ? (
          <p className="text-gray-600 text-sm">Nenhuma mensalidade encontrada</p>
        ) : (
          <div className="space-y-3">
            {dues.map((due) => (
              <div
                key={due.id}
                className={`p-4 rounded-lg border-2 ${
                  due.status === 'PAGO'
                    ? 'border-green-200 bg-green-50'
                    : due.status === 'ISENTO'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">
                      {format(new Date(due.competencia + '-01'), 'MMMM/yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Venc: {format(new Date(due.vencimento), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">R$ {parseFloat(due.valor.toString()).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      due.status === 'PAGO'
                        ? 'bg-green-100 text-green-800'
                        : due.status === 'ISENTO'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {due.status}
                    </span>
                  </div>
                </div>

                {due.status === 'PENDENTE' && (
                  <div className="mt-3 pt-3 border-t">
                    <label className="btn btn-primary cursor-pointer w-full flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Enviando...' : 'Enviar Comprovante'}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUploadComprovante(due.id, file)
                        }}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multas */}
      {fines.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-warning" />
            Multas
          </h2>

          <div className="space-y-3">
            {fines.map((fine) => (
              <div
                key={fine.id}
                className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {fine.tipo === 'ATRASO' && '⏱️ Atraso'}
                      {fine.tipo === 'FALTA_CONFIRMADA' && '❌ Falta Confirmada'}
                      {fine.tipo === 'CONVIDADO' && '👥 Convidado'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(fine.criado_em), 'dd/MM/yyyy')}
                    </p>
                    {fine.observacao && (
                      <p className="text-sm text-gray-600 mt-1">{fine.observacao}</p>
                    )}
                  </div>
                  <p className="font-bold text-lg">R$ {parseFloat(fine.valor.toString()).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico de Pagamentos */}
      {payments.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Histórico de Pagamentos</h2>

          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="p-4 rounded-lg border"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      R$ {parseFloat(payment.valor.toString()).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(payment.criado_em), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    payment.status === 'CONFIRMADO'
                      ? 'bg-green-100 text-green-800'
                      : payment.status === 'REJEITADO'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
