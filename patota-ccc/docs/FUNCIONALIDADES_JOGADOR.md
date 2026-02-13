# Parte 3: Implementação React - Funcionalidades do Jogador

## 7. Estrutura de Componentes e Rotas

### 7.1 Configurar React Router

**src/App.tsx:**
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'

// Layouts
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'

// Páginas públicas
import Login from './pages/Login'

// Páginas do jogador
import Home from './pages/Home'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Finance from './pages/Finance'
import Ranking from './pages/Ranking'
import Rules from './pages/Rules'

// Páginas admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminCaixa from './pages/admin/Caixa'
import AdminMembers from './pages/admin/Members'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkAdmin(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Escuta mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkAdmin(session.user.id)
      } else {
        setIsAdmin(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase
      .from('admins')
      .select('member_id')
      .eq('member_id', userId)
      .single()
    
    setIsAdmin(!!data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

        {/* Rotas do jogador */}
        <Route element={<Layout isAdmin={isAdmin} />}>
          <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
          <Route path="/eventos" element={user ? <Events /> : <Navigate to="/login" />} />
          <Route path="/eventos/:id" element={user ? <EventDetail /> : <Navigate to="/login" />} />
          <Route path="/financeiro" element={user ? <Finance /> : <Navigate to="/login" />} />
          <Route path="/ranking" element={user ? <Ranking /> : <Navigate to="/login" />} />
          <Route path="/regras" element={user ? <Rules /> : <Navigate to="/login" />} />
        </Route>

        {/* Rotas admin */}
        <Route element={<AdminLayout />}>
          <Route 
            path="/admin" 
            element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/admin/caixa" 
            element={user && isAdmin ? <AdminCaixa /> : <Navigate to="/" />} 
          />
          <Route 
            path="/admin/membros" 
            element={user && isAdmin ? <AdminMembers /> : <Navigate to="/" />} 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

### 7.2 Layout Principal

**src/components/Layout.tsx:**
```typescript
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Calendar, DollarSign, Trophy, BookOpen, Settings, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface LayoutProps {
  isAdmin: boolean
}

export default function Layout({ isAdmin }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/eventos', icon: Calendar, label: 'Eventos' },
    { path: '/financeiro', icon: DollarSign, label: 'Financeiro' },
    { path: '/ranking', icon: Trophy, label: 'Ranking' },
    { path: '/regras', icon: BookOpen, label: 'Regras' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Patota CCC</h1>
          <div className="flex gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                title="Admin"
              >
                <Shield className="w-6 h-6" />
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              title="Sair"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 safe-area-bottom">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex justify-around">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center py-3 px-4 transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
      
      {/* Spacer for bottom nav */}
      <div className="h-20"></div>
    </div>
  )
}
```

### 7.3 Página de Login

**src/pages/Login.tsx:**
```typescript
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Lock } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) throw error

      setMessage('Verifique seu e-mail para fazer login!')
    } catch (error: any) {
      setMessage(error.message || 'Erro ao enviar e-mail')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-blue-600 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Patota CCC</h1>
            <p className="text-gray-600">Sistema de Gestão</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5" />
                  Entrar com Link Mágico
                </div>
              )}
            </button>
          </form>

          {/* Message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.includes('Verifique')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Info */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Você receberá um link de acesso por e-mail.</p>
            <p className="mt-1">Sem senha necessária! 🎉</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 7.4 Página Home (Dashboard do Jogador)

**src/pages/Home.tsx:**
```typescript
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
```

*(Continua...)*
