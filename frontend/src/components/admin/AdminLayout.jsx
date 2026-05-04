import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  HiOutlineChartBar, HiOutlineCalendarDays, HiOutlineUsers,
  HiOutlineHome, HiOutlineVideoCamera, HiOutlinePhoto,
  HiOutlineDocumentText, HiOutlineArrowLeftOnRectangle,
  HiOutlineBars3, HiOutlineXMark, HiOutlineUserGroup,
} from 'react-icons/hi2'
import { MdOutlinePets } from 'react-icons/md'
import './AdminLayout.css'

const ADMIN_MENU = [
  { path: '/admin',          label: 'Дашборд',      icon: HiOutlineChartBar,        exact: true },
  { path: '/admin/bookings', label: 'Бронирования', icon: HiOutlineCalendarDays },
  { path: '/admin/clients',  label: 'Пользователи', icon: HiOutlineUsers },
  { path: '/admin/pets',     label: 'Питомцы',      icon: MdOutlinePets },
  { path: '/admin/rooms',    label: 'Комнаты',      icon: HiOutlineHome },
  { path: '/admin/cameras',  label: 'Камеры',       icon: HiOutlineVideoCamera },
  { path: '/admin/staff',    label: 'Персонал',     icon: HiOutlineUserGroup },
  { path: '/admin/gallery',  label: 'Галерея',      icon: HiOutlinePhoto },
  { path: '/admin/notes',    label: 'Заметки',      icon: HiOutlineDocumentText },
]

const STAFF_MENU = [
  { path: '/admin',          label: 'Главная',  icon: HiOutlineChartBar,  exact: true },
  { path: '/admin/pets',     label: 'Питомцы',  icon: MdOutlinePets },
  { path: '/admin/notes',    label: 'Заметки',  icon: HiOutlineDocumentText },
]

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (loading) return null

  const isStaff = user?.role === 'staff'
  const MENU = isStaff ? STAFF_MENU : ADMIN_MENU

  function isActive(item) {
    return item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
  }

  return (
    <div className="admin-layout">
      {/* Top pill nav */}
      <div className="admin-topbar-wrap">
        <header className="admin-topbar">
          <div className="admin-topbar-inner">
            {/* Logo */}
            <div className="admin-logo" onClick={() => navigate('/')}>
              <MdOutlinePets size={22} />
              <span>PawHotel</span>
              <span className="admin-badge">{isStaff ? 'Staff' : 'Admin'}</span>
            </div>

            {/* Nav links — desktop */}
            <nav className="admin-nav-links">
              {MENU.map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    className={`admin-nav-link ${isActive(item) ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="admin-topbar-right">
              <div className="admin-user-info">
                <span className="admin-user-name">{user?.first_name}</span>
                <span className="admin-user-role">{user?.role === 'admin' ? 'Администратор' : 'Персонал'}</span>
              </div>
              <button className="admin-logout-btn" onClick={() => { logout(); navigate('/') }} title="Выйти">
                <HiOutlineArrowLeftOnRectangle size={18} />
              </button>
              {/* Burger */}
              <button className="admin-burger" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <HiOutlineXMark size={22} /> : <HiOutlineBars3 size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <nav className="admin-mobile-menu">
              {MENU.map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    className={`admin-mobile-link ${isActive(item) ? 'active' : ''}`}
                    onClick={() => { navigate(item.path); setMobileOpen(false) }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          )}
        </header>
      </div>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  )
}
