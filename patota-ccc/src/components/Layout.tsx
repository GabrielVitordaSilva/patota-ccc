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
