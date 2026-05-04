import CrudManager from './CrudManager'
import { roomsApi } from '../../api/client'
import { HiOutlineHome } from 'react-icons/hi2'

const COLUMNS = [
  { key: 'id', label: '#' },
  { key: 'number', label: 'Номер' },
  { key: 'type', label: 'Тип', render: v => ({ standard: 'Стандарт', comfort: 'Комфорт', vip: 'VIP' }[v] || v) },
  { key: 'capacity', label: 'Вместимость' },
  { key: 'price_per_day', label: 'Цена/ночь', render: v => `${Number(v).toLocaleString('ru')} ₽` },
  { key: 'is_available', label: 'Доступность', render: v => <span className={`badge ${v ? 'badge-active' : 'badge-cancelled'}`}>{v ? 'Доступна' : 'Занята'}</span> },
]

const FIELDS = [
  { name: 'number', label: 'Номер комнаты', required: true, placeholder: '101' },
  { name: 'type', label: 'Тип', type: 'select', required: true, options: [{ value: 'standard', label: 'Стандарт' }, { value: 'comfort', label: 'Комфорт' }, { value: 'vip', label: 'VIP' }] },
  { name: 'capacity', label: 'Вместимость (питомцев)', type: 'number', default: 1 },
  { name: 'price_per_day', label: 'Цена за ночь (₽)', type: 'number', required: true },
  { name: 'description', label: 'Описание', type: 'textarea' },
  { name: 'features', label: 'Особенности (через запятую)', type: 'tags', placeholder: 'Тв, Игрушки, Лежанка', hint: 'Через запятую: Тв, Игрушки, Лежанка' },
  { name: 'is_available', label: 'Доступна', type: 'checkbox', default: true, checkLabel: 'Комната свободна' },
]

export default function RoomsManager() {
  return (
    <CrudManager
      title="Комнаты"
      icon={<HiOutlineHome size={22} />}
      columns={COLUMNS}
      fetchFn={roomsApi.list}
      createFn={roomsApi.create}
      updateFn={roomsApi.update}
      deleteFn={roomsApi.delete}
      formFields={FIELDS}
    />
  )
}
