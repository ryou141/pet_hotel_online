import { useEffect, useState } from 'react'
import { staffApi } from '../../api/client'
import { HiOutlineUser } from 'react-icons/hi2'
import './StaffSection.css'

export default function StaffSection() {
  const [staff, setStaff] = useState([])

  useEffect(() => {
    staffApi.list()
      .then(({ data }) => setStaff(data.filter(s => s.is_active !== false)))
      .catch(() => {})
  }, [])

  if (staff.length === 0) return null

  return (
    <section className="staff-section section" id="staff">
      <div className="container">
        <div className="section-tag">Наш персонал</div>
        <h2 className="section-title">Команда, которой<br />можно доверять</h2>
        <div className="divider" />
        <p className="section-subtitle">
          Каждый сотрудник — сертифицированный специалист с большой любовью к животным.
        </p>

        <div className="staff-grid">
          {staff.map((member) => (
            <div key={member.id} className="staff-card">
              <div className="staff-photo-wrap">
                {member.photo_url ? (
                  <img src={member.photo_url} alt={`${member.first_name} ${member.last_name}`} />
                ) : (
                  <div className="staff-photo-placeholder">
                    <HiOutlineUser size={52} />
                  </div>
                )}
                <div className="staff-position-badge">{member.position}</div>
              </div>
              <div className="staff-info">
                <h4 className="staff-name">{member.first_name} {member.last_name}</h4>
                {member.description && <p className="staff-desc">{member.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="paw-decor" style={{ bottom: '5%', right: '3%', fontSize: '10rem' }}>
      </span>
    </section>
  )
}
