import { useState, useEffect } from 'react'
import { adminApi } from '../../api/client'
import { HiOutlineHeart } from 'react-icons/hi2'

const STATUS_OPTIONS = [
  { value: '', label: 'Все' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'confirmed', label: 'Подтверждено' },
  { value: 'active', label: 'Активно' },
  { value: 'completed', label: 'Завершено' },
  { value: 'cancelled', label: 'Отменено' },
]

const STATUS_RU = {
  pending: 'Ожидает',
  confirmed: 'Подтверждено',
  active: 'Активно',
  completed: 'Завершено',
  cancelled: 'Отменено',
}

export default function BookingsManager() {
  const [bookings, setBookings] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await adminApi.allBookings(status || undefined)
    setBookings(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  async function updateStatus(id, newStatus) {
    await adminApi.updateBookingStatus(id, newStatus)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
  }

  const NEXT_STATUS = { pending: 'confirmed', confirmed: 'active', active: 'completed' }
  const NEXT_LABELS = { pending: 'Подтвердить', confirmed: 'Заселить', active: 'Завершить' }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Бронирования</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`btn btn-sm ${status === opt.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatus(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="admin-loading">Загрузка...</div>
          ) : bookings.length === 0 ? (
            <div className="admin-loading">Нет бронирований</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Питомец</th>
                  <th>Комната</th>
                  <th>Заселение</th>
                  <th>Выезд</th>
                  <th>Стоимость</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.pet?.name || `Питомец #${b.pet_id}`}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{b.pet?.species}</div>
                      {b.notes && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 4, fontSize: '0.76rem', color: 'var(--primary)', background: 'var(--primary-ultra)', padding: '4px 7px', borderRadius: 6, maxWidth: 200 }}>
                          <HiOutlineHeart size={11} style={{ marginTop: 1, flexShrink: 0 }} />
                          <span style={{ lineHeight: 1.4 }}>{b.notes}</span>
                        </div>
                      )}
                    </td>
                    <td>{b.room ? `№${b.room.number}` : `#${b.room_id}`}</td>
                    <td>{b.check_in_date}</td>
                    <td>{b.check_out_date}</td>
                    <td>{b.total_price ? `${Number(b.total_price).toLocaleString('ru')} ₽` : '—'}</td>
                    <td><span className={`badge badge-${b.status}`}>{STATUS_RU[b.status] || b.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {NEXT_STATUS[b.status] && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => updateStatus(b.id, NEXT_STATUS[b.status])}
                          >
                            {NEXT_LABELS[b.status]}
                          </button>
                        )}
                        {b.status !== 'cancelled' && b.status !== 'completed' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => updateStatus(b.id, 'cancelled')}
                          >
                            Отменить
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
