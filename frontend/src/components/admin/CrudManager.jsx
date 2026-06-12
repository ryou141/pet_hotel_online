/**
 * Generic CRUD manager — used by all admin sections.
 * Props:
 *   title       — page title
 *   icon        — emoji icon
 *   columns     — [{key, label, render?}]
 *   fetchFn     — async () => data[]
 *   createFn    — async (data) => item
 *   updateFn    — async (id, data) => item
 *   deleteFn    — async (id) => void
 *   formFields  — [{name, label, type?, options?}]
 *   searchable  — bool
 */
import { useState, useEffect } from 'react'
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2'
import api from '../../api/client'
import './CrudManager.css'

async function uploadFile(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/api/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  return data.url
}

export default function CrudManager({
  title, icon, columns, fetchFn, createFn, updateFn, deleteFn, formFields = [], searchable = true,
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data } = await fetchFn(search || undefined)
      setItems(data)
    } catch {}
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    const defaults = {}
    formFields.forEach(f => { defaults[f.name] = f.default ?? '' })
    setForm(defaults)
    setError('')
    setModalOpen(true)
  }

  function openEdit(item) {
    setEditing(item)
    const vals = {}
    formFields.forEach(f => { vals[f.name] = item[f.name] ?? f.default ?? '' })
    setForm(vals)
    setError('')
    setModalOpen(true)
  }

  async function handleDelete(id) {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return
    try {
      await deleteFn(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка при удалении')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([k]) => !k.startsWith('__')))
      // Convert array fields from comma-separated string
      formFields.forEach(f => {
        if (f.type === 'tags' && typeof payload[f.name] === 'string') {
          payload[f.name] = payload[f.name].split(',').map(s => s.trim()).filter(Boolean)
        }
        if (f.type === 'number' || f.numeric) {
          const raw = payload[f.name]
          // Empty or whitespace-only → null (avoids FK violation on optional IDs)
          payload[f.name] = (raw !== '' && raw !== null && raw !== undefined && String(raw).trim() !== '')
            ? Number(raw)
            : null
        }
        if (f.type === 'checkbox') payload[f.name] = payload[f.name] === true || payload[f.name] === 'true'
      })

      if (editing) {
        const { data } = await updateFn(editing.id, payload)
        setItems(prev => prev.map(i => i.id === editing.id ? data : i))
      } else {
        const { data } = await createFn(payload)
        setItems(prev => [data, ...prev])
      }
      setModalOpen(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const filtered = search
    ? items.filter(item =>
        Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
      )
    : items

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">{icon} {title}</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {searchable && (
            <div className="admin-search">
              <HiOutlineMagnifyingGlass size={16} />
              <input
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && load()}
              />
            </div>
          )}
          {createFn && (
            <button className="btn btn-primary btn-sm" onClick={openCreate}>
              <HiOutlinePlus size={15} /> Добавить
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="admin-loading">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="admin-loading">Нет данных</div>
          ) : (
            <table>
              <thead>
                <tr>
                  {columns.map(c => <th key={c.key}>{c.label}</th>)}
                  {(updateFn || deleteFn) && <th>Действия</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    {columns.map(c => (
                      <td key={c.key}>
                        {c.render ? c.render(item[c.key], item) : String(item[c.key] ?? '—')}
                      </td>
                    ))}
                    {(updateFn || deleteFn) && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {updateFn && (
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}><HiOutlinePencil size={15} /></button>
                          )}
                          {deleteFn && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}><HiOutlineTrash size={15} /></button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? `Редактировать` : `Добавить`} — {title}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              {formFields.map(field => (
                <div className="form-group" key={field.name}>
                  <label>{field.label}{field.required && ' *'}</label>

                  {field.type === 'select' ? (
                    <select
                      className="form-control"
                      value={form[field.name] ?? ''}
                      onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                      required={field.required}
                    >
                      <option value="">— выберите —</option>
                      {field.options?.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      className="form-control"
                      value={form[field.name] ?? ''}
                      onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                      rows={3}
                      placeholder={field.placeholder}
                    />
                  ) : field.type === 'checkbox' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400 }}>
                      <input
                        type="checkbox"
                        checked={!!form[field.name]}
                        onChange={e => setForm({ ...form, [field.name]: e.target.checked })}
                      />
                      {field.checkLabel || 'Да'}
                    </label>
                  ) : field.type === 'upload' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {form[field.name] && (
                        <img src={form[field.name]} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                      )}
                      <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                        {form[`__uploading_${field.name}`] ? 'Загрузка...' : form[field.name] ? 'Заменить фото' : 'Загрузить фото'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          disabled={!!form[`__uploading_${field.name}`]}
                          onChange={async e => {
                            const file = e.target.files[0]
                            if (!file) return
                            setForm(f => ({ ...f, [`__uploading_${field.name}`]: true }))
                            try {
                              const url = await uploadFile(file)
                              setForm(f => ({ ...f, [field.name]: url, [`__uploading_${field.name}`]: false }))
                            } catch {
                              setForm(f => ({ ...f, [`__uploading_${field.name}`]: false }))
                            }
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <input
                      className="form-control"
                      type={field.type || 'text'}
                      value={form[field.name] ?? ''}
                      onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}

                  {field.hint && <small style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{field.hint}</small>}
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModalOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={saving}>
                  {saving ? 'Сохранение...' : editing ? 'Сохранить изменения' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
