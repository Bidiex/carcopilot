import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Users } from './pages/Users'
import { UserDetail } from './pages/UserDetail'
import { Notifications } from './pages/Notifications'
import { NotificationNew } from './pages/NotificationNew'
import { PromoSplashes } from './pages/PromoSplashes'
import { PromoSplashNew } from './pages/PromoSplashNew'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isAdmin, loading } = useAdminAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Cargando...</div>
  if (!session || !isAdmin) return <Navigate to="/login" replace />

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/users/:id" element={<ProtectedRoute><UserDetail /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/notifications/new" element={<ProtectedRoute><NotificationNew /></ProtectedRoute>} />
          <Route path="/promo-splashes" element={<ProtectedRoute><PromoSplashes /></ProtectedRoute>} />
          <Route path="/promo-splashes/new" element={<ProtectedRoute><PromoSplashNew /></ProtectedRoute>} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  )
}
