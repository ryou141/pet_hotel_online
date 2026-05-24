import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import { HiOutlineUser, HiOutlineArrowRightOnRectangle, HiOutlineArrowLeftOnRectangle } from 'react-icons/hi2'
import PawIcon from './PawIcon'
import './Header.css'

const NAV_LINKS = [
  { label: 'Преимущества', href: '#advantages' },
  { label: 'Камеры', href: '#cameras' },
  { label: 'Галерея', href: '#gallery' },
  { label: 'Персонал', href: '#staff' },
  { label: 'Тарифы', href: '#tariffs' },
  { label: 'Заселение', href: '#checkin' },
  { label: 'Контакты', href: '#contacts' },
]

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isLanding = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(e, href) {
    e.preventDefault()
    setMenuOpen(false)
    if (!isLanding) {
      navigate('/')
      setTimeout(() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }), 300)
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  function handleUserBtn() {
    if (user) {
      user.role === 'admin' || user.role === 'staff' ? navigate('/admin') : navigate('/cabinet')
    } else {
      setAuthOpen(true)
    }
  }

  return (
    <>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-pill">
          {/* Logo */}
          <div className="header-logo" onClick={() => navigate('/')}>
            <PawIcon size={22} className="header-logo-icon" />
            <span className="header-logo-text">PawHotel</span>
          </div>

          {/* Nav — desktop */}
          <nav className="header-nav">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => scrollTo(e, l.href)} className="header-link">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="header-actions">
            <button className="btn btn-primary btn-sm header-user-btn" onClick={handleUserBtn}>
              {user ? (
                <><HiOutlineUser size={15} /> {user.first_name}</>
              ) : (
                <><HiOutlineArrowRightOnRectangle size={15} /> Войти</>
              )}
            </button>

            {user && (
              <button className="btn btn-ghost btn-sm" onClick={logout} title="Выйти">
                <HiOutlineArrowLeftOnRectangle size={17} />
              </button>
            )}

            {/* Burger */}
            <button className="burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Меню">
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mobile-menu">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => scrollTo(e, l.href)} className="mobile-link">
                {l.label}
              </a>
            ))}
            <button className="btn btn-primary" onClick={() => { setMenuOpen(false); handleUserBtn() }}>
              {user ? <><HiOutlineUser size={15} /> {user.first_name}</> : <><HiOutlineArrowRightOnRectangle size={15} /> Войти</>}
            </button>
          </div>
        )}
      </header>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  )
}
