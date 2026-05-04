import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import CabinetPage from './pages/CabinetPage'
import AdminPage from './pages/AdminPage'
import DocsPage from './pages/DocsPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><div className="paw-loader">🐾</div></div>
  return user ? children : <Navigate to="/" replace />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><div className="paw-loader">🐾</div></div>
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'admin' && user.role !== 'staff') return <Navigate to="/cabinet" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route
            path="/cabinet"
            element={
              <PrivateRoute>
                <CabinetPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
