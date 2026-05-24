import { useState, useEffect } from 'react'
import { adminApi } from '../../api/client'
import { HiOutlineHeart, HiOutlinePencilSquare, HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2'

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
