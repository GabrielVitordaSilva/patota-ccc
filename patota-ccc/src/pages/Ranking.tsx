import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Trophy, Medal, Award } from 'lucide-react'

interface RankingEntry {
  member_id: string
  nome: string
  total_pontos: number
  total_presencas: number
  posicao?: number
}

export default function Ranking() {
  const [view, setView] = useState<'mensal' | 'geral'>('mensal')
  const [rankingData, setRankingData] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadRanking()
  }, [view])

  const loadRanking = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    if (view === 'mensal') {
      // Ranking do mês atual
      const { data } = await supabase
        .from('ranking_mensal')
        .select('*')
        .gte('mes', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .order('total_pontos', { ascending: false })

      if (data) {
        const withPositions = data.map((entry, index) => ({
          ...entry,
          posicao: index + 1
        }))
        setRankingData(withPositions)
      }
    } else {
      // Ranking geral
      const { data } = await supabase
        .from('ranking_geral')
        .select('*')
        .order('total_pontos', { ascending: false })

      if (data) {
        const withPositions = data.map((entry, index) => ({
          ...entry,
          posicao: index + 1
        }))
        setRankingData(withPositions)
      }
    }

    setLoading(false)
  }

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />
      case 2:
        return <Medal className="w-7 h-7 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />
      default:
        return null
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
        <h1 className="text-2xl font-bold mb-2">Ranking</h1>
        <p className="text-gray-600">Classificação por presença</p>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('mensal')}
          className={`btn flex-1 ${
            view === 'mensal' ? 'btn-primary' : 'border border-gray-300'
          }`}
        >
          Mensal
        </button>
        <button
          onClick={() => setView('geral')}
          className={`btn flex-1 ${
            view === 'geral' ? 'btn-primary' : 'border border-gray-300'
          }`}
        >
          Geral
        </button>
      </div>

      {/* Pódio (Top 3) */}
      {rankingData.length > 0 && (
        <div className="card bg-gradient-to-br from-primary to-blue-600 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-6 h-6" />
            <h2 className="text-xl font-bold">Pódio</h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* 2º Lugar */}
            {rankingData[1] && (
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  {getMedalIcon(2)}
                </div>
                <p className="font-bold text-lg">{rankingData[1].nome}</p>
                <p className="text-sm opacity-90">{rankingData[1].total_pontos} pts</p>
                <p className="text-xs opacity-75">{rankingData[1].total_presencas} jogos</p>
              </div>
            )}

            {/* 1º Lugar */}
            {rankingData[0] && (
              <div className="text-center -mt-4">
                <div className="flex justify-center mb-2">
                  {getMedalIcon(1)}
                </div>
                <p className="font-bold text-xl">{rankingData[0].nome}</p>
                <p className="text-sm opacity-90">{rankingData[0].total_pontos} pts</p>
                <p className="text-xs opacity-75">{rankingData[0].total_presencas} jogos</p>
              </div>
            )}

            {/* 3º Lugar */}
            {rankingData[2] && (
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  {getMedalIcon(3)}
                </div>
                <p className="font-bold text-lg">{rankingData[2].nome}</p>
                <p className="text-sm opacity-90">{rankingData[2].total_pontos} pts</p>
                <p className="text-xs opacity-75">{rankingData[2].total_presencas} jogos</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista Completa */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">Classificação Completa</h2>

        {rankingData.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            Nenhum dado de ranking disponível
          </p>
        ) : (
          <div className="space-y-2">
            {rankingData.map((entry) => (
              <div
                key={entry.member_id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  entry.member_id === currentUserId
                    ? 'bg-blue-50 border-2 border-primary'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 text-center">
                    {entry.posicao && entry.posicao <= 3 ? (
                      getMedalIcon(entry.posicao)
                    ) : (
                      <span className="text-xl font-bold text-gray-400">
                        {entry.posicao}º
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{entry.nome}</p>
                    <p className="text-sm text-gray-600">
                      {entry.total_presencas} {entry.total_presencas === 1 ? 'jogo' : 'jogos'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {entry.total_pontos}
                  </p>
                  <p className="text-xs text-gray-600">pontos</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
