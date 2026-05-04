import {
  HiOutlineVideoCamera, HiOutlineHeart, HiOutlineSparkles,
  HiOutlineBolt, HiOutlineClipboardDocumentList, HiOutlineShieldCheck, HiOutlineCpuChip,
} from 'react-icons/hi2'
import { MdOutlineRestaurant } from 'react-icons/md'
import './Advantages.css'

const ADVANTAGES = [
  {
    Icon: HiOutlineVideoCamera,
    title: 'Онлайн-наблюдение 24/7',
    text: 'Следите за своим питомцем в реальном времени через личный кабинет. Камеры в каждой комнате и зонах отдыха.',
  },
  {
    Icon: HiOutlineHeart,
    title: 'Ветеринарная поддержка',
    text: 'Штатный ветеринар на связи круглосуточно. Регулярные осмотры и моментальная помощь в случае необходимости.',
  },
  {
    Icon: MdOutlineRestaurant,
    title: 'Индивидуальный рацион',
    text: 'Меню составляется с учётом породы, возраста и особенностей здоровья каждого питомца.',
  },
  {
    Icon: HiOutlineSparkles,
    title: 'Груминг и уход',
    text: 'Профессиональный груминг, водные процедуры и расчёсывание — ваш питомец всегда будет выглядеть на все 100.',
  },
  {
    Icon: HiOutlineBolt,
    title: 'Активный досуг',
    text: 'Игровые зоны, прогулки и общение со специалистами. Ваш питомец не будет скучать ни минуты.',
  },
  {
    Icon: HiOutlineClipboardDocumentList,
    title: 'Заметки от персонала',
    text: 'Каждый день вы получаете актуальные заметки от сотрудников о настроении и состоянии вашего питомца.',
  },
  {
    Icon: HiOutlineShieldCheck,
    title: 'Безопасность',
    text: 'Закрытая территория, контроль доступа и индивидуальные боксы для каждого жильца.',
  },
  {
    Icon: HiOutlineCpuChip,
    title: 'ИИ-мониторинг состояния',
    text: 'Наша система компьютерного зрения анализирует поведение питомца в реальном времени и сообщает о любых изменениях.',
  },
]

export default function Advantages() {
  return (
    <section className="advantages section" id="advantages">
      <div className="container">
        <div className="section-tag">Почему мы</div>
        <h2 className="section-title">Всё для комфорта<br />вашего питомца</h2>
        <div className="divider" />
        <p className="section-subtitle">
          Мы создали место, где каждый питомец чувствует себя особенным гостем.
          Вот что делает нас лучшими.
        </p>

        <div className="advantages-grid">
          {ADVANTAGES.map((adv, i) => (
            <div key={i} className="adv-card">
              <div className="adv-icon"><adv.Icon size={28} /></div>
              <h4 className="adv-title">{adv.title}</h4>
              <p className="adv-text">{adv.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
