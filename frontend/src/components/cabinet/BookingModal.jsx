import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './datepicker.css'
import { roomsApi, bookingsApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { registerLocale } from 'react-datepicker'
import { ru } from 'date-fns/locale'
import { HiOutlineHome, HiOutlineCalendarDays, HiOutlineUser, HiOutlineHeart } from 'react-icons/hi2'
import { MdOutlinePets } from 'react-icons/md'

registerLocale('ru', ru)

const SPECIES_LABELS = { dog: 'Собака', cat: 'Кошка', rabbit: 'Кролик', bird: 'Птица', other: 'Другое' }
const GENDER_LABELS  = { male: 'Мальчик', female: 'Девочка' }

export default function BookingModal({ pet, onClose, onSuccess }) {
  const { user } = useAuth()
  const [rooms, setRooms]       = useState([])
  const [roomId, setRoomId]     = useState('')
  const [checkIn, setCheckIn]   = useState(null)
  const [checkOut, setCheckOut] = useState(null)
  const [notes, setNotes]       = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    roomsApi.list().then(({ data }) => setRooms(data.filter(r => r.is_available)))
  }, [])

  const selectedRoom = rooms.find(r => r.id === Number(roomId))
  const nights = (checkIn && checkOut && checkOut > checkIn)
    ? Math.ceil((checkOut - checkIn) / 86400000)
    : null
  const price = nights && selectedRoom ? nights * Number(selectedRoom.price_per_day) : null

  async function submit(e) {
    e.preventDefault()
    if (!roomId || !checkIn || !checkOut)   { setError('Заполните все поля'); return }
    if (checkOut <= checkIn)                { setError('Дата выезда должна быть позже заезда'); return }
    setLoading(true); setError('')
    try {
      await bookingsApi.create({
        pet_id: pet.id,
        room_id: Number(roomId),
        check_in_date:  checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        notes,
      })
      onSuccess(); onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при бронировании')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal booking-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Бронирование места</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Owner + pet summary */}
        <div className="booking-summary">
          <div className="booking-summary-block">
            <div className="booking-summary-icon"><HiOutlineUser size={18} /></div>
            <div>
              <span className="booking-summary-label">Владелец</span>
              <span className="booking-summary-value">
                {user?.last_name} {user?.first_name} {user?.middle_name}
              </span>
              {user?.phone && <span className="booking-summary-sub">{user.phone}</span>}
            </div>
          </div>
          <div className="booking-summary-block">
            <div className="booking-summary-icon"><MdOutlinePets size={18} /></div>
            <div>
              <span className="booking-summary-label">Питомец</span>
              <span className="booking-summary-value">{pet.name}</span>
              <span className="booking-summary-sub">
                {SPECIES_LABELS[pet.species] || pet.species}
                {pet.breed ? ` · ${pet.breed}` : ''}
                {pet.age ? ` · ${pet.age} лет` : ''}
                {pet.gender ? ` · ${GENDER_LABELS[pet.gender] || pet.gender}` : ''}
              </span>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label><HiOutlineHome size={14} /> Комната</label>
            <select className="form-control" value={roomId} onChange={e => setRoomId(e.target.value)} required>
              <option value="">— выберите комнату —</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  №{r.number} · {r.type} · {Number(r.price_per_day).toLocaleString('ru')} ₽/ночь
                </option>
              ))}
            </select>
          </div>

          {selectedRoom && (
            <div className="room-info-chip">
              {selectedRoom.description || `Комната типа «${selectedRoom.type}»`}
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label><HiOutlineCalendarDays size={14} /> Дата заезда</label>
              <DatePicker
                selected={checkIn}
                onChange={d => { setCheckIn(d); if (checkOut && d >= checkOut) setCheckOut(null) }}
                minDate={new Date()}
                dateFormat="dd.MM.yyyy"
                locale="ru"
                className="form-control"
                placeholderText="Выберите дату"
              />
            </div>
            <div className="form-group">
              <label><HiOutlineCalendarDays size={14} /> Дата выезда</label>
              <DatePicker
                selected={checkOut}
                onChange={setCheckOut}
                minDate={checkIn ? new Date(checkIn.getTime() + 86400000) : new Date()}
                dateFormat="dd.MM.yyyy"
                locale="ru"
                className="form-control"
                placeholderText="Выберите дату"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Особые пожелания</label>
            <textarea className="form-control" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Диета, привычки, особенности ухода..." />
          </div>

          {price !== null && (
            <div className="booking-total">
              <span>{nights} {nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей'}</span>
              <span className="booking-total-price">{price.toLocaleString('ru')} ₽</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Отправка...' : 'Забронировать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
