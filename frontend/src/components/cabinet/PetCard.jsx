import { useState } from 'react'
import { petsApi, notesApi } from '../../api/client'
import BookingModal from './BookingModal'
import PetStream from './PetStream'
import CvTestPanel from './CvTestPanel'
import { MdOutlinePets } from 'react-icons/md'
import {
  HiOutlineCalendarDays, HiOutlinePencil, HiOutlineDocumentText,
  HiOutlineTrash, HiOutlineHome, HiOutlineClock, HiOutlineCpuChip,
} from 'react-icons/hi2'
import './PetCard.css'
import './BookingModal.css'

const SPECIES_LABELS = { dog: 'Собака', cat: 'Кошка', rabbit: 'Кролик', bird: 'Птица', other: 'Другое' }
const GENDER_LABELS  = { male: 'Мальчик', female: 'Девочка' }

export default function PetCard({ pet, bookings, onRefresh }) {
  const [editing, setEditing]         = useState(false)
  const [form, setForm]               = useState({ ...pet })
  const [bookingOpen, setBookingOpen] = useState(false)
  const [notes, setNotes]             = useState(null)
  const [notesOpen, setNotesOpen]     = useState(false)
  const [loading, setLoading]         = useState(false)
  const [cvTestOpen, setCvTestOpen]   = useState(false)

  const activeBooking  = bookings?.find(b => b.pet_id === pet.id && b.status === 'active')
  const pendingBooking = bookings?.find(b => b.pet_id === pet.id && b.status === 'pending')

  async function saveEdit(e) {
    e.preventDefault()
    setLoading(true)
    try { await petsApi.update(pet.id, form); setEditing(false); onRefresh() } catch {}
    setLoading(false)
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
        </div>
      )}
      {pendingBooking && !activeBooking && (
        <div className="pet-card-status-bar pet-card-status-pending">
          <HiOutlineClock size={14} /> Ожидает подтверждения · Заселение {pendingBooking.check_in_date}
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
                <button className="btn btn-outline btn-sm" onClick={() => setBookingOpen(true)}>
                  <HiOutlineCalendarDays size={14} /> Заселить
                </button>
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
    </div>
  )
}
