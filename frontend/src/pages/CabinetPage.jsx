import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { petsApi, bookingsApi, usersApi } from '../api/client'
import Header from '../components/Header'
import PawIcon from '../components/PawIcon'
import Footer from '../components/Footer'
import PetCard from '../components/cabinet/PetCard'
import { HiOutlineEnvelope, HiOutlinePhone, HiOutlineCalendarDays, HiOutlineUser } from 'react-icons/hi2'
import { MdOutlinePets } from 'react-icons/md'
import './CabinetPage.css'

export default function CabinetPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [pets, setPets] = useState([])
  const [bookings, setBookings] = useState([])
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({})
  const [addingPet, setAddingPet] = useState(false)
  const [petForm, setPetForm] = useState({ name: '', species: 'dog', breed: '', age: '', gender: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  async function loadData() {
    const [petsRes, bookingsRes] = await Promise.all([petsApi.list(), bookingsApi.list()])
    setPets(petsRes.data)
    setBookings(bookingsRes.data)
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (user) setProfileForm({ first_name: user.first_name, last_name: user.last_name, middle_name: user.middle_name || '', phone: user.phone || '', date_of_birth: user.date_of_birth || '' }) }, [user])

  async function saveProfile(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...profileForm }
      if (!payload.date_of_birth) payload.date_of_birth = null
      if (!payload.middle_name) payload.middle_name = null
      if (!payload.phone) payload.phone = null
      await usersApi.update(payload)
      await refreshUser()
      setEditingProfile(false)
    } catch {}
    setLoading(false)
  }

  async function savePassword(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')
    if (pwForm.new_password !== pwForm.confirm) { setPwError('Пароли не совпадают'); return }
    if (pwForm.new_password.length < 6) { setPwError('Пароль должен содержать не менее 6 символов'); return }
    setPwLoading(true)
    try {
      await usersApi.changePassword(pwForm.old_password, pwForm.new_password)
      setPwSuccess('Пароль успешно изменён')
      setPwForm({ old_password: '', new_password: '', confirm: '' })
      setTimeout(() => { setChangingPassword(false); setPwSuccess('') }, 1500)
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Ошибка смены пароля')
    } finally {
      setPwLoading(false)
    }
  }

  async function addPet(e) {
    e.preventDefault()
    setError('')
    try {
      await petsApi.create({ ...petForm, age: petForm.age ? Number(petForm.age) : null })
      setAddingPet(false)
      setPetForm({ name: '', species: 'dog', breed: '', age: '', gender: '' })
      loadData()
      refreshUser()
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка')
    }
  }

  return (
    <>
      <Header />
      <div className="cabinet-page">
        <div className="container">
          <div className="cabinet-grid">
            {/* Profile card */}
            <aside className="cabinet-sidebar">
              <div className="profile-card card">
                <div className="profile-avatar">
                  <HiOutlineUser size={32} />
                </div>

                {editingProfile ? (
                  <form onSubmit={saveProfile} style={{ marginTop: 16 }}>
                    <div className="form-group">
                      <label>Имя</label>
                      <input className="form-control" value={profileForm.first_name} onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Фамилия</label>
                      <input className="form-control" value={profileForm.last_name} onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Отчество</label>
                      <input className="form-control" value={profileForm.middle_name} onChange={e => setProfileForm({ ...profileForm, middle_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Телефон</label>
                      <input className="form-control" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Дата рождения</label>
                      <input className="form-control" type="date" value={profileForm.date_of_birth} onChange={e => setProfileForm({ ...profileForm, date_of_birth: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>Сохранить</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingProfile(false)}>Отмена</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3 className="profile-name">{user?.last_name} {user?.first_name}</h3>
                    {user?.middle_name && <p className="profile-middle">{user.middle_name}</p>}

                    <div className="profile-details">
                      <div className="profile-detail">
                        <HiOutlineEnvelope size={15} /><span>{user?.email}</span>
                      </div>
                      {user?.phone && (
                        <div className="profile-detail">
                          <HiOutlinePhone size={15} /><span>{user.phone}</span>
                        </div>
                      )}
                      {user?.date_of_birth && (
                        <div className="profile-detail">
                          <HiOutlineCalendarDays size={15} /><span>{new Date(user.date_of_birth).toLocaleDateString('ru')}</span>
                        </div>
                      )}
                      <div className="profile-detail">
                        <MdOutlinePets size={15} /><span>{user?.pets_count || pets.length} питомцев</span>
                      </div>
                    </div>

                    <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={() => setEditingProfile(true)}>
                      Редактировать профиль
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => { setChangingPassword(true); setPwError(''); setPwSuccess('') }}>
                      Сменить пароль
                    </button>
                  </>
                )}
              </div>

              {/* Bookings summary */}
              {bookings.length > 0 && (
                <div className="card" style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 14, fontSize: '0.95rem' }}>Мои бронирования</h4>
                  <div className="bookings-mini">
                    {bookings.slice(0, 5).map(b => (
                      <div key={b.id} className="booking-mini-item">
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{b.pet?.name || `Питомец #${b.pet_id}`}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {b.check_in_date} → {b.check_out_date}
                        </div>
                        <span className={`badge badge-${b.status}`} style={{ marginTop: 4 }}>{{ pending: 'Ожидает', confirmed: 'Подтверждено', active: 'Активно', completed: 'Завершено', cancelled: 'Отменено' }[b.status] || b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* Pets */}
            <main className="cabinet-main">
              <div className="cabinet-pets-header">
                <h2><MdOutlinePets size={22} style={{ verticalAlign: 'middle' }} /> Мои питомцы</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setAddingPet(true)}>+ Добавить питомца</button>
              </div>

              {pets.length === 0 && !addingPet ? (
                <div className="empty-pets">
                  <PawIcon size={64} style={{ color: 'var(--primary-light)', display: 'block', margin: '0 auto' }} />
                  <h3>Питомцев пока нет</h3>
                  <p>Добавьте вашего питомца, чтобы забронировать для него место в отеле</p>
                  <button className="btn btn-primary" onClick={() => setAddingPet(true)}>Добавить питомца</button>
                </div>
              ) : (
                <div className="pets-list">
                  {pets.map(pet => (
                    <PetCard key={pet.id} pet={pet} bookings={bookings} onRefresh={loadData} />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      <Footer />

      {/* Change password modal */}
      {changingPassword && (
        <div className="modal-overlay" onClick={() => setChangingPassword(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Смена пароля</h3>
              <button className="modal-close" onClick={() => setChangingPassword(false)}>✕</button>
            </div>
            {pwError && <div className="alert alert-error">{pwError}</div>}
            {pwSuccess && <div className="alert alert-success">{pwSuccess}</div>}
            <form onSubmit={savePassword}>
              <div className="form-group">
                <label>Текущий пароль</label>
                <input className="form-control" type="password" placeholder="••••••••" value={pwForm.old_password} onChange={e => { setPwForm({ ...pwForm, old_password: e.target.value }); setPwError('') }} required />
              </div>
              <div className="form-group">
                <label>Новый пароль</label>
                <input className="form-control" type="password" placeholder="••••••••" value={pwForm.new_password} onChange={e => { setPwForm({ ...pwForm, new_password: e.target.value }); setPwError('') }} required minLength={6} />
              </div>
              <div className="form-group">
                <label>Повторите новый пароль</label>
                <input className="form-control" type="password" placeholder="••••••••" value={pwForm.confirm} onChange={e => { setPwForm({ ...pwForm, confirm: e.target.value }); setPwError('') }} required minLength={6} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setChangingPassword(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={pwLoading}>
                  {pwLoading ? 'Сохранение...' : 'Сохранить пароль'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add pet modal */}
      {addingPet && (
        <div className="modal-overlay" onClick={() => setAddingPet(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Добавить питомца</h3>
              <button className="modal-close" onClick={() => setAddingPet(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={addPet}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Кличка *</label>
                  <input className="form-control" value={petForm.name} onChange={e => setPetForm({ ...petForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Вид *</label>
                  <select className="form-control" value={petForm.species} onChange={e => setPetForm({ ...petForm, species: e.target.value })}>
                    <option value="dog">Собака</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Порода</label>
                  <input className="form-control" value={petForm.breed} onChange={e => setPetForm({ ...petForm, breed: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Возраст (лет)</label>
                  <input className="form-control" type="number" min="0" max="50" value={petForm.age} onChange={e => setPetForm({ ...petForm, age: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Пол</label>
                  <select className="form-control" value={petForm.gender} onChange={e => setPetForm({ ...petForm, gender: e.target.value })}>
                    <option value="">Не указан</option>
                    <option value="male">Мальчик</option>
                    <option value="female">Девочка</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setAddingPet(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>Добавить питомца</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
