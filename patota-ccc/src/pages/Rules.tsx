import { Copy, Check, DollarSign, Calendar, Users } from 'lucide-react'
import { useState } from 'react'

export default function Rules() {
  const [copiedPix, setCopiedPix] = useState(false)
  const PIX_KEY = 'patotaccc@email.com'

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY)
    setCopiedPix(true)
    setTimeout(() => setCopiedPix(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Regras da Patota</h1>
        <p className="text-gray-600">Funcionamento e valores</p>
      </div>

      {/* Mensalidade */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Mensalidade</h2>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700">Valor</span>
            <span className="font-bold text-lg">R$ 35,00</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700">Vencimento</span>
            <span className="font-medium">Todo dia 10</span>
          </div>
          <div className="py-2">
            <p className="text-sm text-gray-600">
              <strong>Isenção:</strong> Em caso de lesão ou trabalho, você pode solicitar
              isenção do mês (mensalidade = R$ 0).
            </p>
          </div>
        </div>
      </div>

      {/* Multas */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-6 h-6 text-warning" />
          <h2 className="text-xl font-bold">Tabela de Multas</h2>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div>
              <p className="font-medium">⏱️ Atraso</p>
              <p className="text-sm text-gray-600">Chegar atrasado no jogo</p>
            </div>
            <span className="font-bold text-lg text-warning">R$ 5,00</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="font-medium">❌ Falta Confirmada</p>
              <p className="text-sm text-gray-600">Confirmou presença mas faltou</p>
            </div>
            <span className="font-bold text-lg text-danger">R$ 10,00</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="font-medium">👥 Convidado</p>
              <p className="text-sm text-gray-600">Por cada convidado</p>
            </div>
            <span className="font-bold text-lg text-primary">R$ 5,00</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            💡 <strong>Importante:</strong> Todas as multas entram automaticamente no caixa
            da patota para custear despesas como campo, bola, arbitragem, etc.
          </p>
        </div>
      </div>

      {/* Pontos */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Sistema de Pontos</h2>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div>
              <p className="font-medium">✅ Presença em Jogo</p>
              <p className="text-sm text-gray-600">Cada jogo que você participa</p>
            </div>
            <span className="font-bold text-lg text-success">+1 ponto</span>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Os pontos são usados para o ranking mensal e geral. Quanto mais você joga,
              mais pontos acumula!
            </p>
          </div>
        </div>
      </div>

      {/* PIX */}
      <div className="card bg-gradient-to-br from-primary to-blue-600 text-white">
        <h2 className="text-xl font-bold mb-4">Chave PIX</h2>

        <div className="space-y-3">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Chave PIX</p>
            <p className="font-mono text-lg break-all">{PIX_KEY}</p>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Nome</p>
            <p className="font-medium">PATOTA CCC</p>
          </div>

          <button
            onClick={copyPixKey}
            className="btn bg-white text-primary hover:bg-gray-100 w-full flex items-center justify-center gap-2"
          >
            {copiedPix ? (
              <>
                <Check className="w-5 h-5" />
                Chave Copiada!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copiar Chave PIX
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
