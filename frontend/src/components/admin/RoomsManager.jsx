import { useState, useEffect } from 'react'
import { roomsApi, tariffsApi } from '../../api/client'
import { HiOutlineHome, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2'

const TYPE_LABELS = { standard: 'Стандарт', comfort: 'Комфорт', vip: 'VIP' }

const EMPTY = { number: '', type: 'standard', capacity: 1, tariff_id: '', description: '', features: '', is_available: true }

export default function RoomsManager() {
  const [rooms, setRooms]     = useState([])
  const [tariffs, setTariffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [error, setError]     = useState('')

  async function load() {
    setLoading(true)
    const [r, t] = await Promise.all([roomsApi.list(), tariffsApi.list()])
    setRooms(r.data)
    setTariffs(t.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setOpen(true)
  }

  function openEdit(room) {
    setEditing(room.id)
    setForm({
      number: room.number,
      type: room.type,
      capacity: room.capacity,
      tariff_id: room.tariff_id || '',
      description: room.description || '',
      features: Array.isArray(room.features) ? room.features.join(', ') : '',
      is_available: room.is_available,
    })
    setError('')
    setOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    const payload = {
      ...form,
      capacity: Number(form.capacity),
      tariff_id: form.tariff_id ? Number(form.tariff_id) : null,
      features: form.features ? form.features.split(',').map(s => s.trim()).filter(Boolean) : [],
    }
    try {
      if (editing) await roomsApi.update(editing, payload)
      else await roomsApi.create(payload)
      setOpen(false)
      load()
    } catch (err) { setError(err.response?.data?.detail || 'Ошибка') }
  }

  async function handleDelete(id) {
    if (!confirm('Удалить комнату?')) return
    await roomsApi.delete(id)
    setRooms(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title"><HiOutlineHome size={22} /> Комнаты</h1>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <HiOutlinePlus size={16} /> Добавить
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="admin-loading">Загрузка...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Номер</th><th>Тип</th><th>Тариф</th><th>Цена/ночь</th><th>Вмест.</th><th>Статус</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td style={{ fontWeight: 600 }}>{r.number}</td>
                    <td>{TYPE_LABELS[r.type] || r.type}</td>
                    <td>{r.tariff?.name || '—'}</td>
                    <td>{r.tariff ? `${Number(r.tariff.price_per_day).toLocaleString('ru')} ₽` : '—'}</td>
                    <td>{r.capacity}</td>
                    <td><span className={`badge ${r.is_available ? 'badge-active' : 'badge-cancelled'}`}>{r.is_available ? 'Доступна' : 'Занята'}</span></td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}><HiOutlinePencil size={15} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(r.id)}><HiOutlineTrash size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Редактировать комнату' : 'Новая комната'}</h3>
              <button className="modal-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Номер *</label>
                <input className="form-control" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} required placeholder="101" />
              </div>
              <div className="form-group">
                <label>Тип *</label>
                <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
                  <option value="standard">Стандарт</option>
                  <option value="comfort">Комфорт</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div className="form-group">
                <label>Тариф</label>
                <select className="form-control" value={form.tariff_id} onChange={e => setForm({ ...form, tariff_id: e.target.value })}>
                  <option value="">— без тарифа —</option>
                  {tariffs.map(t => (
                    <option key={t.id} value={t.id}>{t.name} — {Number(t.price_per_day).toLocaleString('ru')} ₽/ночь</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Вместимость</label>
                <input className="form-control" type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Особенности (через запятую)</label>
                <input className="form-control" value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} placeholder="Тв, Игрушки, Лежанка" />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })} />
                  Комната доступна
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
