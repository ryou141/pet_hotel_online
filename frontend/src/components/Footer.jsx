import { useNavigate } from 'react-router-dom'
import { HiOutlineDocumentText } from 'react-icons/hi2'
import PawIcon from './PawIcon'
import './Footer.css'

export default function Footer() {
  const navigate = useNavigate()

  return (
    <footer className="footer">
      <PawIcon className="footer-paw-bg" />

      <div className="container">
        <div className="footer-inner">
          <div className="footer-logo">
            <PawIcon size={22} />
            <span>PawHotel</span>
          </div>

          <p className="footer-copyright">
            © {new Date().getFullYear()} PawHotel «Уютные лапки». Все права защищены.
          </p>

          <div className="footer-actions">
            <div className="footer-socials">
              <a href="#" className="social-btn" title="Telegram">TG</a>
              <a href="#" className="social-btn" title="VK">VK</a>
              <a href="#" className="social-btn" title="WhatsApp">WA</a>
            </div>
            <button onClick={() => navigate('/docs')} className="docs-link">
              <HiOutlineDocumentText size={14} /> Юридическая документация
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
