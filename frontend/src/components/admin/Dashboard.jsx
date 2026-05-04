import { useEffect, useState } from 'react'
import { adminApi } from '../../api/client'
import {
  HiOutlineUsers, HiOutlineHome, HiOutlineCalendarDays,
  HiOutlineClock, HiOutlineVideoCamera, HiOutlineUserGroup, HiOutlineChartBar,
} from 'react-icons/hi2'
import { MdOutlinePets } from 'react-icons/md'
import './Dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    adminApi.dashboard().then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  if (!stats) return <div className="admin-loading">Загрузка...</div>

  const CARDS = [
    { label: 'Клиентов',               value: stats.total_users,                              Icon: HiOutlineUsers,        color: '#9E7C56' },
    { label: 'Питомцев',               value: stats.total_pets,                               Icon: MdOutlinePets,          color: '#7A5230' },
    { label: 'Активные бронирования',  value: stats.active_bookings,                          Icon: HiOutlineHome,          color: '#6BCB77' },
    { label: 'Ожидают подтверждения',  value: stats.pending_bookings,                         Icon: HiOutlineClock,         color: '#FFD166' },
    { label: 'Всего бронирований',     value: stats.total_bookings,                           Icon: HiOutlineCalendarDays,  color: '#9B59B6' },
    { label: 'Доступно комнат',        value: `${stats.available_rooms} / ${stats.total_rooms}`, Icon: HiOutlineHome,       color: '#3498DB' },
    { label: 'Сотрудников',            value: stats.total_staff,                              Icon: HiOutlineUserGroup,     color: '#E74C3C' },
  ]

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title"><HiOutlineChartBar size={22} /> Дашборд</h1>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {new Date().toLocaleDateString('ru', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="dashboard-grid">
        {CARDS.map((card, i) => (
          <div key={i} className="dash-card" style={{ '--card-color': card.color }}>
            <div className="dash-card-icon"><card.Icon size={24} color="#fff" /></div>
            <div className="dash-card-info">
              <span className="dash-card-value">{card.value}</span>
              <span className="dash-card-label">{card.label}</span>
            </div>
            <div className="dash-card-bg-icon"><card.Icon size={72} /></div>
          </div>
        ))}
      </div>

      <div className="dashboard-bottom">
        <div className="dash-welcome">
          <h2>Добро пожаловать в панель управления PawHotel!</h2>
          <p>Используйте меню слева для навигации по разделам. Здесь вы можете управлять клиентами, питомцами, комнатами, камерами и всем остальным.</p>
        </div>
      </div>
    </div>
  )
}
