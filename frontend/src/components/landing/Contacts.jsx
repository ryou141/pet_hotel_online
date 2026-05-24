import { HiOutlineMapPin, HiOutlinePhone, HiOutlineEnvelope, HiOutlineClock } from 'react-icons/hi2'
import { MdOutlinePets } from 'react-icons/md'
import './Contacts.css'

export default function Contacts() {
  return (
    <section className="contacts-section" id="contacts">
      {/* Full-width map */}
      <div className="contacts-map">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2245.372!2d37.6172999!3d55.7557860!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46b54a50b315e573%3A0xa886bf5a3d9b2e68!2z0JzQvtGB0LrQstCw!5e0!3m2!1sru!2sru!4v1234567890"
          title="Карта"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          frameBorder="0"
        />
        <div className="map-overlay" />

        {/* Contact card over the map */}
        <div className="contacts-card">
          <div className="contacts-card-header">
            <MdOutlinePets size={24} />
            <div>
              <h3>PawHotel</h3>
              <span>«Уютные лапки»</span>
            </div>
          </div>

          <div className="contacts-list">
            <div className="contact-item">
              <span className="contact-icon"><HiOutlineMapPin size={18} /></span>
              <div>
                <span className="contact-label">Адрес</span>
                <span className="contact-value">г. Москва, ул. Зверская, д. 12</span>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon"><HiOutlinePhone size={18} /></span>
              <div>
                <span className="contact-label">Телефон</span>
                <a href="tel:+74951234567" className="contact-value contact-link">+7 (495) 123-45-67</a>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon"><HiOutlineEnvelope size={18} /></span>
              <div>
                <span className="contact-label">Email</span>
                <a href="mailto:hello@pawhotel.ru" className="contact-value contact-link">hello@pawhotel.ru</a>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon"><HiOutlineClock size={18} /></span>
              <div>
                <span className="contact-label">Режим работы</span>
                <span className="contact-value">Пн – Вс: 08:00 – 22:00</span>
              </div>
            </div>
          </div>

          {/* <div className="contacts-socials">
            <a href="#" className="contact-social">Telegram</a>
            <a href="#" className="contact-social">ВКонтакте</a>
            <a href="#" className="contact-social">WhatsApp</a>
          </div> */}
        </div>
      </div>
    </section>
  )
}
