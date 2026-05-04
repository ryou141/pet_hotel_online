import { useEffect, useState } from 'react'
import { adminApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import {
  HiOutlineHome, HiOutlineClock, HiOutlineCalendarDays,
  HiOutlineDocumentText, HiOutlineHeart,
} from 'react-icons/hi2'
import { MdOutlinePets } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import './StaffDashboard.css'

const SPECIES_MAP = { dog: 'Собака', cat: 'Кошка', rabbit: 'Кролик', bird: 'Птица', other: 'Другое' }
const STATUS_RU   = { active: 'Активно', confirmed: 'Подтверждено', pending: 'Ожидает' }

export default function StaffDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [active, setActive]   = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.allBookings('active'),
      adminApi.allBookings('confirmed'),
    ]).then(([a, c]) => {
      setActive(a.data)
      setPending(c.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString('ru', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Добро пожаловать, {user?.first_name}</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>{today}</p>
        </div>
      </div>

      <div className="staff-stat-row">
        <div className="staff-stat-card" style={{ '--c': '#6BCB77' }}>
          <HiOutlineHome size={22} />
          <span className="staff-stat-value">{active.length}</span>
          <span className="staff-stat-label">В отеле сейчас</span>
        </div>
        <div className="staff-stat-card" style={{ '--c': '#FFD166' }}>
          <HiOutlineClock size={22} />
          <span className="staff-stat-value">{pending.length}</span>
          <span className="staff-stat-label">Ожидают заселения</span>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Загрузка...</div>
      ) : (
        <>
          {/* Active pets */}
          {active.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 className="staff-section-title">
                <HiOutlineHome size={18} style={{ color: '#6BCB77' }} /> Питомцы в отеле
              </h3>
              <div className="staff-pet-grid">
                {active.map(b => (
                  <div key={b.id} className="staff-pet-card">
                    <div className="staff-pet-avatar"><MdOutlinePets size={24} /></div>
                    <div className="staff-pet-info">
                      <span className="staff-pet-name">{b.pet?.name || '—'}</span>
                      <span className="staff-pet-species">{SPECIES_MAP[b.pet?.species] || b.pet?.species || '—'}</span>
                      {b.pet?.breed && <span className="staff-pet-breed">{b.pet.breed}</span>}
                    </div>
                    <div className="staff-pet-meta">
                      <span className="staff-pet-room">Комната {b.room?.number || b.room_id}</span>
                      <span className="staff-pet-dates">
                        <HiOutlineCalendarDays size={12} />
                        {b.check_in_date} — {b.check_out_date}
                      </span>
                      <span className="staff-pet-owner">Владелец: {b.owner ? `${b.owner.last_name} ${b.owner.first_name}` : '—'}</span>
                    </div>
                    {b.notes && (
                      <div className="staff-pet-wishes">
                        <HiOutlineHeart size={13} />
                        <span>{b.notes}</span>
                      </div>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginLeft: 'auto', alignSelf: 'center' }}
                      onClick={() => navigate('/admin/notes')}
                    >
                      <HiOutlineDocumentText size={14} /> Заметки
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <div className="card">
              <h3 className="staff-section-title">
                <HiOutlineClock size={18} style={{ color: '#FFD166' }} /> Ожидают заселения
              </h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Питомец</th>
                      <th>Вид</th>
                      <th>Владелец</th>
                      <th>Комната</th>
                      <th>Заселение</th>
                      <th>Выселение</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600 }}>{b.pet?.name || '—'}</td>
                        <td>{SPECIES_MAP[b.pet?.species] || b.pet?.species || '—'}</td>
                        <td style={{ fontSize: '0.88rem' }}>
                          {b.owner ? `${b.owner.last_name} ${b.owner.first_name}` : '—'}
                        </td>
                        <td>{b.room?.number || b.room_id}</td>
                        <td>{b.check_in_date}</td>
                        <td>{b.check_out_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active.length === 0 && pending.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <MdOutlinePets size={40} style={{ color: 'var(--border)', marginBottom: 12 }} />
              <p style={{ color: 'var(--text-secondary)' }}>Сегодня питомцев нет</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
