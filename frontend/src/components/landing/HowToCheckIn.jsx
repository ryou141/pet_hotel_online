import { useState } from 'react'
import { HiOutlineCalendarDays, HiOutlineShoppingBag, HiChevronDown } from 'react-icons/hi2'
import { MdOutlinePets } from 'react-icons/md'
import './HowToCheckIn.css'

const STEPS = [
  {
    Icon: MdOutlinePets,
    title: 'Кого мы принимаем',
    short: 'Собаки, кошки, кролики, птицы и другие домашние питомцы.',
    full: `Мы принимаем собак всех пород и размеров.\n\nТребования: актуальные прививки (предоставить ветеринарный паспорт), отсутствие инфекционных заболеваний. Животные, проявляющие агрессию, принимаются по предварительному согласованию.\n\nВакцины: бешенство, чумка, парвовирус для собак; панлейкопения, ринотрахеит для кошек.`,
  },
  {
    Icon: HiOutlineCalendarDays,
    title: 'Как забронировать номер',
    short: 'Зарегистрируйтесь, добавьте питомца и выберите даты в личном кабинете.',
    full: `1. Создайте аккаунт на сайте или войдите в личный кабинет.\n2. Добавьте карточку питомца с основными данными.\n3. Перейдите в раздел «Бронирование», выберите подходящую комнату и тип тарифа.\n4. Укажите даты заселения и выезда в календаре.\n5. Отправьте заявку — менеджер подтвердит в течение 30 минут.\n6. Оплата производится при заселении или онлайн.`,
  },
  {
    Icon: HiOutlineShoppingBag,
    title: 'Что взять с собой',
    short: 'Ветеринарный паспорт, привычный корм, любимые игрушки и лежанку.',
    full: `Обязательно:\n• Ветеринарный паспорт с отметками о прививках\n• Привычный корм на весь срок (или мы используем наш)\n• Поводок/переноска для транспортировки\n\nРекомендуем взять:\n• Любимую игрушку или лежанку — запах дома успокаивает питомца\n• Лекарства, если питомец их принимает\n• Справку об отсутствии паразитов\n\nМы всё остальное обеспечим сами!`,
  },
]

export default function HowToCheckIn() {
  const [openIndex, setOpenIndex] = useState(null)

  function toggle(i) {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section className="checkin-section section" id="checkin">
      <div className="container">
        <div className="section-tag">Как заселиться</div>
        <h2 className="section-title">Всё просто и понятно</h2>
        <div className="divider" />
        <p className="section-subtitle">
          Наведите на карточку, чтобы узнать подробности.
        </p>

        {/* Desktop: flip cards */}
        <div className="checkin-grid checkin-desktop">
          {STEPS.map((step, i) => (
            <div key={i} className="checkin-card">
              <div className="checkin-front">
                <div className="checkin-icon"><step.Icon size={32} /></div>
                <h3 className="checkin-title">{step.title}</h3>
                <p className="checkin-short">{step.short}</p>
                <div className="checkin-hover-hint">Наведите, чтобы узнать больше →</div>
              </div>
              <div className="checkin-back">
                <div className="checkin-back-icon"><step.Icon size={28} /></div>
                <h3 className="checkin-back-title">{step.title}</h3>
                <p className="checkin-full">{step.full}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: accordion */}
        <div className="checkin-accordion">
          {STEPS.map((step, i) => (
            <div key={i} className="checkin-item">
              <button className="checkin-item-header" onClick={() => toggle(i)}>
                <div className="checkin-item-left">
                  <step.Icon size={22} />
                  <span>{step.title}</span>
                </div>
                <HiChevronDown
                  size={20}
                  className={`checkin-chevron ${openIndex === i ? 'open' : ''}`}
                />
              </button>
              <div className={`checkin-item-body ${openIndex === i ? 'open' : ''}`}>
                <p className="checkin-full">{step.full}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
