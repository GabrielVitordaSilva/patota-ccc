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
import AdminEvent from './pages/admin/Event'

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
          <Route 
            path="/admin/evento/:id" 
            element={user && isAdmin ? <AdminEvent /> : <Navigate to="/" />} 
          />

        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
