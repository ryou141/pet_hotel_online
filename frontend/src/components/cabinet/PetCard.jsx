import { useState } from 'react'
import { petsApi, notesApi, bookingsApi } from '../../api/client'
import BookingModal from './BookingModal'
import PetStream from './PetStream'
import CvTestPanel from './CvTestPanel'
import { MdOutlinePets } from 'react-icons/md'
import {
  HiOutlineCalendarDays, HiOutlinePencil, HiOutlineDocumentText,
  HiOutlineTrash, HiOutlineHome, HiOutlineClock, HiOutlineCpuChip,
  HiOutlineXMark, HiOutlinePencilSquare,
} from 'react-icons/hi2'
import './PetCard.css'
import './BookingModal.css'

const SPECIES_LABELS = { dog: 'Собака', cat: 'Кошка', rabbit: 'Кролик', bird: 'Птица', other: 'Другое' }
const GENDER_LABELS  = { male: 'Мальчик', female: 'Девочка' }
const EXT_STATUS_RU  = { pending: 'На рассмотрении', approved: 'Одобрено', rejected: 'Отклонено' }

export default function PetCard({ pet, bookings, onRefresh }) {
  const [editing, setEditing]               = useState(false)
  const [form, setForm]                     = useState({ ...pet })
  const [bookingOpen, setBookingOpen]       = useState(false)
  const [notes, setNotes]                   = useState(null)
  const [notesOpen, setNotesOpen]           = useState(false)
  const [loading, setLoading]               = useState(false)
  const [cvTestOpen, setCvTestOpen]         = useState(false)
  const [editBookingOpen, setEditBookingOpen] = useState(false)
  const [editForm, setEditForm]             = useState({})
  const [editLoading, setEditLoading]       = useState(false)
  const [editError, setEditError]           = useState('')
  const [extendOpen, setExtendOpen]         = useState(false)
  const [extendDate, setExtendDate]         = useState('')
  const [extendLoading, setExtendLoading]   = useState(false)
  const [extendError, setExtendError]       = useState('')

  const activeBooking    = bookings?.find(b => b.pet_id === pet.id && b.status === 'active')
  const pendingBooking   = bookings?.find(b => b.pet_id === pet.id && b.status === 'pending')
  const confirmedBooking = bookings?.find(b => b.pet_id === pet.id && b.status === 'confirmed')
  const hasActiveBooking = !!(activeBooking || pendingBooking || confirmedBooking)

  async function saveEdit(e) {
    e.preventDefault()
    setLoading(true)
    try { await petsApi.update(pet.id, form); setEditing(false); onRefresh() } catch {}
    setLoading(false)
  }

  function openEditBooking(b) {
    setEditForm({ check_in_date: b.check_in_date, check_out_date: b.check_out_date, notes: b.notes || '' })
    setEditError('')
    setEditBookingOpen(true)
  }

  async function saveEditBooking(e) {
    e.preventDefault()
    setEditLoading(true)
    setEditError('')
    try {
      await bookingsApi.update(pendingBooking.id, editForm)
      setEditBookingOpen(false)
      onRefresh()
    } catch (err) {
      setEditError(err.response?.data?.detail || 'Ошибка сохранения')
    }
    setEditLoading(false)
  }

  async function submitExtend(e) {
    e.preventDefault()
    setExtendLoading(true)
    setExtendError('')
    try {
      await bookingsApi.extend(activeBooking.id, extendDate)
      setExtendOpen(false)
      onRefresh()
    } catch (err) {
      setExtendError(err.response?.data?.detail || 'Ошибка')
    }
    setExtendLoading(false)
  }

  async function deletePet() {
    if (!confirm(`Удалить питомца ${pet.name}? Это действие нельзя отменить.`)) return
    await petsApi.delete(pet.id)
    onRefresh()
  }

  async function loadNotes() {
    if (!notesOpen) {
      const { data } = await notesApi.petNotes(pet.id)
      setNotes(data)
    }
    setNotesOpen(!notesOpen)
  }

  return (
    <div className={`pet-card ${activeBooking ? 'pet-card-active' : ''}`}>
      {activeBooking && (
        <div className="pet-card-status-bar">
          <HiOutlineHome size={14} /> Сейчас в отеле · Комната {activeBooking.room?.number}
          {activeBooking.extension_status === 'pending' && (
            <span className="badge badge-pending" style={{ marginLeft: 8, fontSize: '0.7rem' }}>
              Продление до {activeBooking.extension_date} · {EXT_STATUS_RU.pending}
            </span>
          )}
          {activeBooking.extension_status === 'approved' && (
            <span className="badge badge-confirmed" style={{ marginLeft: 8, fontSize: '0.7rem' }}>
              Продлено до {activeBooking.extension_date}
            </span>
          )}
          {activeBooking.extension_status === 'rejected' && (
            <span className="badge badge-cancelled" style={{ marginLeft: 8, fontSize: '0.7rem' }}>
              Продление отклонено
            </span>
          )}
        </div>
      )}
      {confirmedBooking && !activeBooking && (
        <div className="pet-card-status-bar pet-card-status-confirmed" style={{ background: 'rgba(52,168,83,0.1)', color: '#34a853' }}>
          <HiOutlineHome size={14} /> Подтверждено · Заселение {confirmedBooking.check_in_date}
        </div>
      )}
      {pendingBooking && !activeBooking && !confirmedBooking && (
        <div className="pet-card-status-bar pet-card-status-pending">
          <HiOutlineClock size={14} /> Ожидает подтверждения · Заселение {pendingBooking.check_in_date}
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '0.75rem' }}
            onClick={() => openEditBooking(pendingBooking)}
          >
            <HiOutlinePencilSquare size={13} /> Изменить
          </button>
        </div>
      )}

      <div className="pet-card-top">
        {/* Avatar */}
        <div className="pet-avatar">
          <MdOutlinePets size={28} />
        </div>

        <div className="pet-main-info">
          {editing ? (
            <form onSubmit={saveEdit} className="pet-edit-form">
              <div className="grid-2" style={{ gap: 8 }}>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Кличка" required />
                <select className="form-control" value={form.species} onChange={e => setForm({ ...form, species: e.target.value })}>
                  {Object.entries(SPECIES_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <input className="form-control" value={form.breed || ''} onChange={e => setForm({ ...form, breed: e.target.value })} placeholder="Порода" />
                <input className="form-control" type="number" value={form.age || ''} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="Возраст (лет)" />
                <select className="form-control" style={{ gridColumn: 'span 2' }} value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Пол не указан</option>
                  <option value="male">Мальчик</option>
                  <option value="female">Девочка</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>Сохранить</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setForm({ ...pet }) }}>Отмена</button>
              </div>
            </form>
          ) : (
            <>
              <h3 className="pet-name">{pet.name}</h3>
              <div className="pet-details">
                {pet.species && <span className="pet-tag">{SPECIES_LABELS[pet.species] || pet.species}</span>}
                {pet.breed   && <span className="pet-tag">{pet.breed}</span>}
                {pet.age     && <span className="pet-tag">{pet.age} лет</span>}
                {pet.gender  && <span className="pet-tag">{GENDER_LABELS[pet.gender] || pet.gender}</span>}
              </div>
              <div className="pet-actions">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setBookingOpen(true)}
                  disabled={hasActiveBooking}
                  title={hasActiveBooking ? 'У питомца уже есть активное бронирование' : undefined}
                >
                  <HiOutlineCalendarDays size={14} /> Заселить
                </button>
                {activeBooking && activeBooking.extension_status !== 'pending' && (
                  <button className="btn btn-outline btn-sm" onClick={() => { setExtendDate(''); setExtendError(''); setExtendOpen(true) }}>
                    <HiOutlineClock size={14} /> Продлить
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                  <HiOutlinePencil size={14} /> Изменить
                </button>
                <button className="btn btn-ghost btn-sm" onClick={loadNotes}>
                  <HiOutlineDocumentText size={14} /> Заметки
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setCvTestOpen(v => !v)}>
                  <HiOutlineCpuChip size={14} /> Тест CV
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={deletePet}>
                  <HiOutlineTrash size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live stream */}
      {activeBooking && (
        <div className="pet-card-stream">
          <h5 className="pet-card-section-title">Камера в комнате</h5>
          <PetStream petId={pet.id} />
        </div>
      )}

      {/* Staff notes */}
      {notesOpen && notes !== null && (
        <div className="pet-card-notes">
          <h5 className="pet-card-section-title">Заметки персонала</h5>
          {notes.length === 0 ? (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Заметок пока нет</p>
          ) : (
            <div className="notes-list">
              {notes.map(note => (
                <div key={note.id} className="note-item">
                  <div className="note-header">
                    <span className="note-author">
                      {note.staff_member ? `${note.staff_member.first_name} ${note.staff_member.last_name}` : 'Персонал'}
                    </span>
                    <span className="note-date">{new Date(note.created_at).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="note-content">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {cvTestOpen && (
        <CvTestPanel petId={pet.id} />
      )}

      {bookingOpen && (
        <BookingModal pet={pet} onClose={() => setBookingOpen(false)} onSuccess={onRefresh} />
      )}

      {/* Edit pending booking modal */}
      {editBookingOpen && pendingBooking && (
        <div className="modal-overlay" onClick={() => setEditBookingOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Изменить бронирование</h3>
              <button className="modal-close" onClick={() => setEditBookingOpen(false)}>
                <HiOutlineXMark size={20} />
              </button>
            </div>
            <form onSubmit={saveEditBooking}>
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
                {editError && <p style={{ color: 'var(--error)', marginTop: 8, fontSize: '0.88rem' }}>{editError}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditBookingOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend booking modal */}
      {extendOpen && activeBooking && (
        <div className="modal-overlay" onClick={() => setExtendOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Продлить проживание</h3>
              <button className="modal-close" onClick={() => setExtendOpen(false)}>
                <HiOutlineXMark size={20} />
              </button>
            </div>
            <form onSubmit={submitExtend}>
              <div className="modal-body">
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Текущая дата выезда: <strong>{activeBooking.check_out_date}</strong>.<br />
                  Укажите новую дату — администратор рассмотрит заявку.
                </p>
                <div>
                  <label className="form-label">Новая дата выезда</label>
                  <input
                    type="date"
                    className="form-control"
                    value={extendDate}
                    min={activeBooking.check_out_date}
                    onChange={e => setExtendDate(e.target.value)}
                    required
                  />
                </div>
                {extendError && <p style={{ color: 'var(--error)', marginTop: 8, fontSize: '0.88rem' }}>{extendError}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setExtendOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={extendLoading}>
                  {extendLoading ? 'Отправка...' : 'Отправить заявку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
