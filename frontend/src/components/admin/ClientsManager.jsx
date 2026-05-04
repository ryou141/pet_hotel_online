import { useState, useEffect } from 'react'
import { adminApi } from '../../api/client'
import { HiOutlineMagnifyingGlass, HiOutlineLockClosed, HiOutlineLockOpen } from 'react-icons/hi2'

const ROLE_TABS = [
  { value: '',        label: 'Все' },
  { value: 'client',  label: 'Клиенты' },
  { value: 'staff',   label: 'Персонал' },
  { value: 'admin',   label: 'Администраторы' },
]


const ROLE_COLORS = { client: 'var(--text-secondary)', admin: 'var(--error)', staff: 'var(--secondary)' }
const ROLE_LABELS = { client: 'Клиент', admin: 'Администратор', staff: 'Персонал' }

export default function ClientsManager() {
  const [users, setUsers]   = useState([])
  const [search, setSearch] = useState('')
  const [roleTab, setRoleTab] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await adminApi.users(search || undefined)
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleUser(id) {
    await adminApi.toggleUser(id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u))
  }

  async function changeRole(id, role) {
    await adminApi.changeRole(id, role)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  const displayed = users.filter(u => roleTab === '' || u.role === roleTab)

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Пользователи</h1>
        <div className="admin-search">
          <HiOutlineMagnifyingGlass size={16} />
          <input
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
          />
          <button className="btn btn-primary btn-sm" onClick={load}>Найти</button>
        </div>
      </div>

      {/* Role tabs */}
      <div className="filter-tabs" style={{ marginBottom: 20 }}>
        {ROLE_TABS.map(t => (
          <button
            key={t.value}
            className={`filter-tab ${roleTab === t.value ? 'active' : ''}`}
            onClick={() => setRoleTab(t.value)}
          >
            {t.label}
            <span className="filter-tab-count">
              {t.value === '' ? users.length : users.filter(u => u.role === t.value).length}
            </span>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="admin-loading">Загрузка...</div>
          ) : displayed.length === 0 ? (
            <div className="admin-loading">Пользователей не найдено</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>ФИО</th>
                  <th>Email</th>
                  <th>Телефон</th>
                  <th>Питомцев</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>{u.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.last_name} {u.first_name}</div>
                      {u.middle_name && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{u.middle_name}</div>}
                    </td>
                    <td style={{ fontSize: '0.88rem' }}>{u.email}</td>
                    <td style={{ fontSize: '0.88rem' }}>{u.phone || '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{u.pets_count || 0}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={e => changeRole(u.id, e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontWeight: 700, color: ROLE_COLORS[u.role], cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.85rem' }}
                      >
                        <option value="client">Клиент</option>
                        <option value="staff">Персонал</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-active' : 'badge-cancelled'}`}>
                        {u.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleUser(u.id)}
                        style={{ color: u.is_active ? 'var(--error)' : 'var(--success)', gap: 4 }}
                      >
                        {u.is_active
                          ? <><HiOutlineLockClosed size={14} /> Блок</>
                          : <><HiOutlineLockOpen size={14} /> Разблок</>}
                      </button>
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
