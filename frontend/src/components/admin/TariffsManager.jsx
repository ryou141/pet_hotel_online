import CrudManager from './CrudManager'
import { tariffsApi } from '../../api/client'
import { HiOutlineTag, HiOutlineStar } from 'react-icons/hi2'

const COLUMNS = [
  { key: 'id', label: '#' },
  { key: 'name', label: 'Название' },
  { key: 'price_per_day', label: 'Цена/ночь', render: v => `${Number(v).toLocaleString('ru')} ₽` },
  { key: 'is_featured', label: 'Топ', render: v => v ? <HiOutlineStar size={16} style={{ color: 'var(--warning)' }} /> : '—' },
  { key: 'is_active', label: 'Статус', render: v => <span className={`badge ${v ? 'badge-active' : 'badge-cancelled'}`}>{v ? 'Активен' : 'Скрыт'}</span> },
  { key: 'sort_order', label: 'Порядок' },
]

const FIELDS = [
  { name: 'name', label: 'Название тарифа', required: true, placeholder: 'Комфорт' },
  { name: 'description', label: 'Описание', type: 'textarea' },
  { name: 'price_per_day', label: 'Цена за ночь (₽)', type: 'number', required: true },
  { name: 'features', label: 'Включённые услуги (через запятую)', type: 'tags', placeholder: 'Питание, Прогулки, Груминг' },
  { name: 'color', label: 'Цвет акцента (HEX)', placeholder: '#7A5230', default: '#7A5230' },
  { name: 'sort_order', label: 'Порядок', type: 'number', default: 0 },
  { name: 'is_featured', label: 'Популярный', type: 'checkbox', checkLabel: 'Выделить как популярный' },
  { name: 'is_active', label: 'Активен', type: 'checkbox', default: true, checkLabel: 'Отображать на сайте' },
]

export default function TariffsManager() {
  return (
    <CrudManager
      title="Тарифы"
      icon={<HiOutlineTag size={22} />}
      columns={COLUMNS}
      fetchFn={tariffsApi.list}
      createFn={tariffsApi.create}
      updateFn={tariffsApi.update}
      deleteFn={tariffsApi.delete}
      formFields={FIELDS}
    />
  )
}
