// App.jsx
// Main app with routing setup.
// Role-based route protection handled here.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login from './pages/Login'
import ProjectList from './pages/ProjectList'
import ProjectCreate from './pages/ProjectCreate'
import ProjectDetail from './pages/ProjectDetail'
import ApproverDashboard from './pages/ApproverDashboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
})

// Protects routes — redirects to login if not authenticated
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 
                      border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (requiredRole && user.role !== requiredRole) {
    // Wrong role — redirect to their correct dashboard
    return <Navigate to={
      user.role === 'approver' ? '/approver/dashboard' : '/projects'
    } replace />
  }

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={
        user
          ? <Navigate to={
              user.role === 'approver' ? '/approver/dashboard' : '/projects'
            } replace />
          : <Login />
      } />

      {/* CRM Routes */}
      <Route path="/projects" element={
        <ProtectedRoute requiredRole="crm">
          <ProjectList />
        </ProtectedRoute>
      } />
      <Route path="/projects/new" element={
        <ProtectedRoute requiredRole="crm">
          <ProjectCreate />
        </ProtectedRoute>
      } />
      <Route path="/projects/:projectId" element={
        <ProtectedRoute>
          <ProjectDetail />
        </ProtectedRoute>
      } />

      {/* Approver Routes */}
      <Route path="/approver/dashboard" element={
        <ProtectedRoute requiredRole="approver">
          <ApproverDashboard />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}