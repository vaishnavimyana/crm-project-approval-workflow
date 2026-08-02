// pages/Login.jsx
// Simple login form. Two test accounts shown below the form
// to make it easy for evaluators to test both roles.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
import { authService } from '../services/auth.service'
import { useAuth } from '../context/AuthContext'
import Button from '../components/common/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await authService.login(email, password)

      login(data.access_token, {
        id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role,
        business_unit: data.business_unit,
      })

      // Redirect based on role
      if (data.role === 'approver') {
        navigate('/approver/dashboard')
      } else {
        navigate('/projects')
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Login failed. Check your credentials.'
      )
    } finally {
      setLoading(false)
    }
  }

  function quickLogin(testEmail, testPassword) {
    setEmail(testEmail)
    setPassword(testPassword)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <FolderKanban size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            CRM Project Portal
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Project Setup & Approval Workflow
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-sm border 
                        border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium 
                                text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full border border-gray-300 rounded-lg 
                           px-3 py-2.5 text-sm focus:outline-none 
                           focus:ring-2 focus:ring-blue-500 
                           focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium 
                                text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg 
                           px-3 py-2.5 text-sm focus:outline-none 
                           focus:ring-2 focus:ring-blue-500 
                           focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 
                              text-red-700 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full justify-center"
              size="lg"
            >
              Sign In
            </Button>
          </form>

          {/* Test credentials helper */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
              Test Accounts
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => quickLogin('crm@test.com', 'password123')}
                className="w-full text-left px-3 py-2.5 rounded-lg 
                           bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <p className="text-xs font-medium text-blue-700">
                  CRM User (Project Creator)
                </p>
                <p className="text-xs text-blue-500">
                  crm@test.com / password123
                </p>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('approver@test.com', 'password123')}
                className="w-full text-left px-3 py-2.5 rounded-lg 
                           bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <p className="text-xs font-medium text-purple-700">
                  Project Approver
                </p>
                <p className="text-xs text-purple-500">
                  approver@test.com / password123
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}