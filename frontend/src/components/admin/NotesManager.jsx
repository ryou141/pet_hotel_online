import { useState, useEffect, useMemo } from 'react'
import { adminApi, notesApi, bookingsApi } from '../../api/client'
import { MdOutlinePets } from 'react-icons/md'
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2'

export default function NotesManager() {
  const [notes, setNotes]             = useState([])
  const [pets, setPets]               = useState([])          // currently checked-in pets
  const [allPets, setAllPets]         = useState([])          // all pets for "all" filter
  const [filter, setFilter]           = useState('checkedin') // 'checkedin' | 'all'
  const [search, setSearch]           = useState('')
  const [selectedPet, setSelectedPet] = useState('')          // filter notes by pet
  const [loading, setLoading]         = useState(true)
  const [addOpen, setAddOpen]         = useState(false)
  const [form, setForm]               = useState({ pet_id: '', content: '', is_public: true })
  const [error, setError]             = useState('')

  async function load() {
    setLoading(true)
    try {
      // Active bookings → checked-in pets
      const [bookingsRes, allPetsRes] = await Promise.all([
        bookingsApi.list ? Promise.resolve({ data: [] }) : Promise.resolve({ data: [] }),
        adminApi.allPets(),
      ])
      setAllPets(allPetsRes.data)

      // Get active bookings (admin view)
      const bRes = await adminApi.allBookings('active')
      const checkedInPetIds = new Set(bRes.data.map(b => b.pet_id))
      setPets(allPetsRes.data.filter(p => checkedInPetIds.has(p.id)))

      const notesRes = await adminApi.allNotes()
      setNotes(notesRes.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addNote(e) {
    e.preventDefault(); setError('')
    try {
      await notesApi.create({ pet_id: Number(form.pet_id), content: form.content, is_public: form.is_public })
      setAddOpen(false)
      setForm({ pet_id: '', content: '', is_public: true })
      load()
    } catch (err) { setError(err.response?.data?.detail || 'Ошибка') }
  }

  async function deleteNote(id) {
    await notesApi.delete(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  // Pet options for the dropdown in "add note"
  const petOptions = filter === 'checkedin' ? pets : allPets

  // Filter displayed notes
  const displayPets = filter === 'checkedin' ? pets : allPets
  const petIdByName = useMemo(() => {
    const map = {}
    ;(filter === 'checkedin' ? pets : allPets).forEach(p => { map[p.id] = p })
    return map
  }, [pets, allPets, filter])

  const filteredNotes = useMemo(() => {
    let res = notes
    if (selectedPet) res = res.filter(n => n.pet_id === Number(selectedPet))
    if (search.trim()) {
      const q = search.toLowerCase()
      res = res.filter(n => {
        const pet = petIdByName[n.pet_id]
        return pet?.name?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
      })
    }
    if (filter === 'checkedin') {
      const ids = new Set(pets.map(p => p.id))
      res = res.filter(n => ids.has(n.pet_id))
    }
    return res
  }, [notes, selectedPet, search, filter, pets, petIdByName])

  const petName = (id) => allPets.find(p => p.id === id)?.name || `#${id}`

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title"><HiOutlineTrash size={22} style={{display:'none'}} />Заметки персонала</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
          <HiOutlinePlus size={16} /> Добавить заметку
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Tab: all / checked-in */}
        <div className="filter-tabs">
          <button className={`filter-tab ${filter === 'checkedin' ? 'active' : ''}`} onClick={() => { setFilter('checkedin'); setSelectedPet('') }}>
            Сейчас заселены
          </button>
          <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => { setFilter('all'); setSelectedPet('') }}>
            Все питомцы
          </button>
        </div>

        {/* Pet select */}
        <select
          className="form-control"
          style={{ width: 220 }}
          value={selectedPet}
          onChange={e => setSelectedPet(e.target.value)}
        >
          <option value="">— все питомцы —</option>
          {displayPets.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
          ))}
        </select>

        {/* Search */}
        <div className="admin-search">
          <HiOutlineMagnifyingGlass size={16} />
          <input
            placeholder="Поиск по кличке или тексту..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="admin-loading">Загрузка...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="admin-loading">Заметок не найдено</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Питомец</th>
                  <th>Автор</th>
                  <th>Заметка</th>
                  <th>Публичная</th>
                  <th>Дата</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredNotes.map(n => (
                  <tr key={n.id}>
                    <td>{n.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MdOutlinePets size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600 }}>{petName(n.pet_id)}</span>
                      </div>
                    </td>
                    <td>{n.staff_member ? `${n.staff_member.first_name} ${n.staff_member.last_name}` : '—'}</td>
                    <td style={{ maxWidth: 300 }}>{n.content}</td>
                    <td><span className={`badge ${n.is_public ? 'badge-active' : 'badge-pending'}`}>{n.is_public ? 'Публичная' : 'Приватная'}</span></td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                      <div>{new Date(n.created_at).toLocaleDateString('ru')}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{new Date(n.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => deleteNote(n.id)}
                        style={{ color: 'var(--error)' }}>
                        <HiOutlineTrash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add note modal */}
      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Добавить заметку</h3>
              <button className="modal-close" onClick={() => setAddOpen(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={addNote}>
              <div className="form-group">
                <label>Питомец *</label>
                <select
                  className="form-control"
                  value={form.pet_id}
                  onChange={e => setForm({ ...form, pet_id: e.target.value })}
                  required
                >
                  <option value="">— выберите питомца —</option>
                  {(filter === 'checkedin' ? pets : allPets).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.species}{p.breed ? `, ${p.breed}` : ''})
                    </option>
                  ))}
                </select>
                {filter === 'checkedin' && pets.length === 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Нет заселённых питомцев. <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.8rem' }} onClick={() => setFilter('all')}>Показать всех</button>
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>Заметка *</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  required
                  placeholder="Опишите состояние, поведение, особые наблюдения..."
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} />
                  Видна владельцу питомца
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setAddOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
