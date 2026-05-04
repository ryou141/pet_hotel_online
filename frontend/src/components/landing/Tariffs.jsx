import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { tariffsApi } from '../../api/client'
import AuthModal from '../AuthModal'
import { HiOutlineCheck } from 'react-icons/hi2'
import './Tariffs.css'

const DEMO_TARIFFS = [
  {
    id: 1, name: 'Стандарт', price_per_day: 1200,
    description: 'Уютная комната с ежедневным кормлением и базовым уходом.',
    features: ['Индивидуальная комната', 'Трёхразовое питание', 'Ежедневные прогулки', 'Базовый мониторинг', 'Онлайн-камера'],
    color: '#9E7C56', is_featured: false,
  },
  {
    id: 2, name: 'Комфорт', price_per_day: 2200,
    description: 'Расширенный уход с игровыми сессиями и ежедневными отчётами.',
    features: ['Просторная комната', 'Меню на выбор', 'Игровые сессии 2×/день', 'Заметки от персонала', 'Онлайн-камера', 'ИИ-мониторинг'],
    color: '#7A5230', is_featured: true,
  },
  {
    id: 3, name: 'VIP', price_per_day: 3800,
    description: 'Максимальный комфорт с индивидуальным куратором и люкс-номером.',
    features: ['Люкс-номер', 'Индивидуальный рацион', 'Личный куратор', 'Груминг по запросу', 'Онлайн-камера', 'ИИ-мониторинг', 'Ежедневный звонок'],
    color: '#2C3E50', is_featured: false,
  },
]

export default function Tariffs() {
  const [tariffs, setTariffs] = useState([])
  const [authOpen, setAuthOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    tariffsApi.list()
      .then(({ data }) => setTariffs(data.length ? data : DEMO_TARIFFS))
      .catch(() => setTariffs(DEMO_TARIFFS))
  }, [])

  function handleSelect() {
    if (user) navigate('/cabinet')
    else setAuthOpen(true)
  }

  const display = tariffs.length ? tariffs : DEMO_TARIFFS

  return (
    <section className="tariffs-section section" id="tariffs">
      <div className="container">
        <div className="section-tag">Тарифы</div>
        <h2 className="section-title">Выберите подходящий<br />план проживания</h2>
        <div className="divider" />
        <p className="section-subtitle">
          Прозрачные цены без скрытых комиссий. Оплата за фактические дни проживания.
        </p>

        <div className="tariffs-grid">
          {display.map((tariff) => (
            <div key={tariff.id} className={`tariff-card ${tariff.is_featured ? 'tariff-featured' : ''}`} style={{ '--t-color': tariff.color }}>
              {tariff.is_featured && <div className="tariff-badge">Популярный выбор</div>}

              <div className="tariff-header">
                <h3 className="tariff-name">{tariff.name}</h3>
                <div className="tariff-price">
                  <span className="tariff-price-num">{Number(tariff.price_per_day).toLocaleString('ru')}</span>
                  <span className="tariff-price-per"> ₽ / ночь</span>
                </div>
              </div>

              {tariff.description && <p className="tariff-desc">{tariff.description}</p>}

              <ul className="tariff-features">
                {(tariff.features || []).map((f, i) => (
                  <li key={i}>
                    <span className="tariff-check"><HiOutlineCheck size={11} /></span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`btn tariff-btn ${tariff.is_featured ? 'btn-primary' : 'btn-outline'}`}
                onClick={handleSelect}
              >
                Выбрать тариф
              </button>
            </div>
          ))}
        </div>

        <p className="tariffs-note">
          * Цены указаны за одного питомца в сутки. Скидки для двух и более питомцев от одного владельца — 10%.
        </p>
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </section>
  )
}
