import { useNavigate } from 'react-router-dom'
import { HiOutlineMapPin, HiOutlinePhone, HiOutlineEnvelope, HiOutlineClock, HiOutlineDocumentText } from 'react-icons/hi2'
import './Footer.css'

export default function Footer() {
  const navigate = useNavigate()

  const scrollTo = (href) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="footer-paw-bg">🐾</div>

      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <span>🐾</span>
              <span>PawHotel</span>
            </div>
            <p className="footer-tagline">«Уютные лапки»<br />Забота, комфорт и любовь<br />для ваших питомцев</p>
            <div className="footer-socials">
              <a href="#" className="social-btn" title="Telegram">TG</a>
              <a href="#" className="social-btn" title="VK">VK</a>
              <a href="#" className="social-btn" title="WhatsApp">WA</a>
            </div>
          </div>

          {/* Navigation */}
          <div className="footer-col">
            <h5 className="footer-col-title">Навигация</h5>
            <ul>
              <li><button onClick={() => scrollTo('#advantages')}>Преимущества</button></li>
              <li><button onClick={() => scrollTo('#gallery')}>Галерея</button></li>
              <li><button onClick={() => scrollTo('#staff')}>Персонал</button></li>
              <li><button onClick={() => scrollTo('#tariffs')}>Тарифы</button></li>
              <li><button onClick={() => scrollTo('#contacts')}>Контакты</button></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-col">
            <h5 className="footer-col-title">Документы</h5>
            <ul>
              <li><button onClick={() => navigate('/docs')}>Пользовательское соглашение</button></li>
              <li><button onClick={() => navigate('/docs#privacy')}>Политика конфиденциальности</button></li>
              <li><button onClick={() => navigate('/docs#rules')}>Правила проживания</button></li>
              <li><button onClick={() => navigate('/docs#contract')}>Договор оказания услуг</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h5 className="footer-col-title">Контакты</h5>
            <ul className="footer-contacts">
              <li><HiOutlineMapPin size={14} /> г. Москва, ул. Зверская, 12</li>
              <li><HiOutlinePhone size={14} /> +7 (495) 123-45-67</li>
              <li><HiOutlineEnvelope size={14} /> hello@pawhotel.ru</li>
              <li><HiOutlineClock size={14} /> Пн–Вс: 08:00 – 22:00</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} PawHotel «Уютные лапки». Все права защищены.</p>
          <button onClick={() => navigate('/docs')} className="docs-link">
            <HiOutlineDocumentText size={14} /> Юридическая документация
          </button>
        </div>
      </div>
    </footer>
  )
}
