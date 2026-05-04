import { useState, useEffect } from 'react'
import { adminApi } from '../../api/client'
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import { MdOutlinePets } from 'react-icons/md'

const SPECIES_MAP = { dog: 'Собака', cat: 'Кошка', rabbit: 'Кролик', bird: 'Птица', other: 'Другое' }

export default function PetsManager() {
  const [pets, setPets]     = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await adminApi.allPets(search || undefined)
    setPets(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title"><MdOutlinePets size={22} /> Питомцы</h1>
        <div className="admin-search">
          <HiOutlineMagnifyingGlass size={16} />
          <input
            placeholder="Поиск по кличке, виду..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
          />
          <button className="btn btn-primary btn-sm" onClick={load}>Найти</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="admin-loading">Загрузка...</div>
          ) : pets.length === 0 ? (
            <div className="admin-loading">Питомцев не найдено</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Кличка</th>
                  <th>Вид</th>
                  <th>Порода</th>
                  <th>Возраст</th>
                  <th>Пол</th>
                  <th>Владелец</th>
                </tr>
              </thead>
              <tbody>
                {pets.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{SPECIES_MAP[p.species] || p.species}</td>
                    <td>{p.breed || '—'}</td>
                    <td>{p.age ? `${p.age} лет` : '—'}</td>
                    <td>{p.gender === 'male' ? 'Мальчик' : p.gender === 'female' ? 'Девочка' : '—'}</td>
                    <td style={{ fontSize: '0.88rem' }}>{p.owner_name || `ID ${p.owner_id}`}</td>
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
