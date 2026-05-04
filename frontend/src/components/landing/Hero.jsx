import { useState } from 'react'
import AuthModal from '../AuthModal'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { HiOutlineTrophy } from 'react-icons/hi2'
import { MdOutlinePets } from 'react-icons/md'
import './Hero.css'

export default function Hero() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <>
      <section className="hero" id="hero">
        {/* Background image with overlay */}
        <div className="hero-bg">
          <img
            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1600&auto=format&fit=crop"
            alt="Счастливые питомцы в отеле"
          />
          <div className="hero-overlay" />
        </div>

        {/* Decorative paws */}
        <span className="hero-paw hero-paw-1">🐾</span>
        <span className="hero-paw hero-paw-2">🐾</span>

        <div className="container hero-content">

          <h1 className="hero-title">
            Уютные лапки —<br />
            <span className="hero-accent">дом вдали от дома</span>
          </h1>

          <p className="hero-subtitle">
            Профессиональная забота, 24/7 видеонаблюдение и индивидуальный подход
            к каждому питомцу. Ваши любимцы будут счастливы, а вы — спокойны.
          </p>

          <div className="hero-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => user ? navigate('/cabinet') : setAuthOpen(true)}
            >
              <MdOutlinePets size={20} /> Забронировать место
            </button>
            <button
              className="btn btn-outline hero-btn-outline btn-lg"
              onClick={() => document.querySelector('#tariffs')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Посмотреть тарифы
            </button>
          </div>

          
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll" onClick={() => document.querySelector('#advantages')?.scrollIntoView({ behavior: 'smooth' })}>
          <div className="scroll-dot" />
          <span>Листайте вниз</span>
        </div>
      </section>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  )
}
