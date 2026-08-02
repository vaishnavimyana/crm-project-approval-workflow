// components/common/Navbar.jsx
import { useNavigate } from 'react-router-dom'
import { LogOut, FolderKanban } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <FolderKanban size={22} className="text-blue-600" />
          <span className="font-semibold text-gray-900">
            CRM Project Portal
          </span>
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role === 'crm' ? 'Project Creator' : 'Project Approver'}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm 
                       text-gray-500 hover:text-gray-900 
                       transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}