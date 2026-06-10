import { useState, useEffect } from 'react'
import { adminApi } from '../../api/client'
import { HiOutlineHeart, HiOutlinePencilSquare, HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2'

const ACTIVITY_LEVELS = [
  { value: 0, label: 'Малоактивная', desc: 'Лежит большую часть времени — норма' },
  { value: 1, label: 'Средняя',      desc: 'Стандартный уровень активности' },
  { value: 2, label: 'Активная',     desc: 'Много двигается — норма' },
]

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

const EXT_STATUS_RU = { pending: 'Ожидает одобрения', approved: 'Одобрено', rejected: 'Отклонено' }
const EXT_STATUS_COLOR = { pending: 'warning', approved: 'confirmed', rejected: 'cancelled' }

const NEXT_STATUS = { pending: 'confirmed', confirmed: 'active', active: 'completed' }
const NEXT_LABELS = { pending: 'Подтвердить', confirmed: 'Заселить', active: 'Завершить' }

export default function BookingsManager() {
  const [bookings, setBookings] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [editBooking, setEditBooking] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [checkInBooking, setCheckInBooking] = useState(null)
  const [checkInLevel, setCheckInLevel] = useState(1)

  async function load() {
    setLoading(true)
    const { data } = await adminApi.allBookings(status || undefined)
    setBookings(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  async function updateStatus(id, newStatus, activityLevel) {
    await adminApi.updateBookingStatus(id, newStatus, activityLevel)
    setBookings(prev => prev.map(b =>
      b.id === id ? { ...b, status: newStatus, ...(activityLevel !== undefined && { activity_level: activityLevel }) } : b
    ))
  }

  async function confirmCheckIn() {
    await updateStatus(checkInBooking.id, 'active', checkInLevel)
    setCheckInBooking(null)
  }

  function openEdit(b) {
    setEditBooking(b)
    setEditForm({
      check_in_date: b.check_in_date,
      check_out_date: b.check_out_date,
      notes: b.notes || '',
    })
    setEditError('')
  }

  async function saveEdit(e) {
    e.preventDefault()
    setEditLoading(true)
    setEditError('')
    try {
      const { data } = await adminApi.editBooking(editBooking.id, editForm)
      setBookings(prev => prev.map(b => b.id === data.id ? data : b))
      setEditBooking(null)
    } catch (err) {
      setEditError(err.response?.data?.detail || 'Ошибка сохранения')
    }
    setEditLoading(false)
  }

  async function handleExtension(id, action) {
    await adminApi.handleExtension(id, action)
    setBookings(prev => prev.map(b => {
      if (b.id !== id) return b
      if (action === 'approve') {
        return { ...b, check_out_date: b.extension_date, extension_status: 'approved' }
      }
      return { ...b, extension_status: 'rejected' }
    }))
  }

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
                  <th>Питомец / Владелец</th>
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
                      {b.owner && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {b.owner.first_name} {b.owner.last_name}
                        </div>
                      )}
                      {b.notes && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 4, fontSize: '0.76rem', color: 'var(--primary)', background: 'var(--primary-ultra)', padding: '4px 7px', borderRadius: 6, maxWidth: 200 }}>
                          <HiOutlineHeart size={11} style={{ marginTop: 1, flexShrink: 0 }} />
                          <span style={{ lineHeight: 1.4 }}>{b.notes}</span>
                        </div>
                      )}
                    </td>
                    <td>{b.room ? `№${b.room.number}` : `#${b.room_id}`}</td>
                    <td>{b.check_in_date}</td>
                    <td>
                      {b.check_out_date}
                      {b.extension_date && b.extension_status === 'pending' && (
                        <div style={{ marginTop: 4 }}>
                          <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>
                            Продление → {b.extension_date}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>{b.total_price ? `${Number(b.total_price).toLocaleString('ru')} ₽` : '—'}</td>
                    <td>
                      <span className={`badge badge-${b.status}`}>{STATUS_RU[b.status] || b.status}</span>
                      {b.extension_status && b.extension_status !== 'approved' && (
                        <div style={{ marginTop: 4 }}>
                          <span className={`badge badge-${EXT_STATUS_COLOR[b.extension_status]}`} style={{ fontSize: '0.7rem' }}>
                            {EXT_STATUS_RU[b.extension_status]}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {/* Edit button */}
                        {b.status !== 'completed' && b.status !== 'cancelled' && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEdit(b)}
                            title="Редактировать"
                          >
                            <HiOutlinePencilSquare size={15} />
                          </button>
                        )}

                        {/* Extension approve/reject */}
                        {b.extension_status === 'pending' && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleExtension(b.id, 'approve')}
                              title="Одобрить продление"
                            >
                              <HiOutlineCheck size={14} /> Продлить
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--error)' }}
                              onClick={() => handleExtension(b.id, 'reject')}
                              title="Отклонить продление"
                            >
                              <HiOutlineXMark size={14} />
                            </button>
                          </>
                        )}

                        {/* Status progression — hidden while extension is awaiting approval */}
                        {NEXT_STATUS[b.status] && b.extension_status !== 'pending' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              if (b.status === 'confirmed') {
                                setCheckInLevel(1)
                                setCheckInBooking(b)
                              } else {
                                updateStatus(b.id, NEXT_STATUS[b.status])
                              }
                            }}
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

      {/* Check-in activity level modal */}
      {checkInBooking && (
        <div className="modal-overlay" onClick={() => setCheckInBooking(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Заселение — {checkInBooking.pet?.name}</h3>
              <button className="modal-close" onClick={() => setCheckInBooking(null)}>
                <HiOutlineXMark size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Укажите ожидаемый уровень активности собаки. Это влияет на чувствительность CV-алертов.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ACTIVITY_LEVELS.map(opt => (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${checkInLevel === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                      background: checkInLevel === opt.value ? 'var(--primary-ultra)' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="activity_level"
                      value={opt.value}
                      checked={checkInLevel === opt.value}
                      onChange={() => setCheckInLevel(opt.value)}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setCheckInBooking(null)}>Отмена</button>
              <button className="btn btn-primary" onClick={confirmCheckIn}>Заселить</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editBooking && (
        <div className="modal-overlay" onClick={() => setEditBooking(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Редактировать бронь #{editBooking.id}</h3>
              <button className="modal-close" onClick={() => setEditBooking(null)}>
                <HiOutlineXMark size={20} />
              </button>
            </div>
            <form onSubmit={saveEdit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Дата заселения</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editForm.check_in_date}
                      onChange={e => setEditForm({ ...editForm, check_in_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Дата выезда</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editForm.check_out_date}
                      onChange={e => setEditForm({ ...editForm, check_out_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label className="form-label">Примечания</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editForm.notes}
                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Пожелания, особенности питомца..."
                  />
                </div>
                {editError && <p className="form-error" style={{ marginTop: 8 }}>{editError}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditBooking(null)}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
