import CrudManager from './CrudManager'
import { staffApi } from '../../api/client'
import { HiOutlineUserGroup } from 'react-icons/hi2'

const COLUMNS = [
  { key: 'id', label: '#' },
  { key: 'photo_url', label: 'Фото', render: v => v ? <img src={v} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : '—' },
  { key: 'last_name', label: 'Фамилия' },
  { key: 'first_name', label: 'Имя' },
  { key: 'position', label: 'Должность' },
  { key: 'is_active', label: 'Статус', render: v => <span className={`badge ${v ? 'badge-active' : 'badge-cancelled'}`}>{v ? 'Активен' : 'Неактивен'}</span> },
]

const FIELDS = [
  { name: 'first_name', label: 'Имя', required: true },
  { name: 'last_name', label: 'Фамилия', required: true },
  { name: 'position', label: 'Должность', required: true, placeholder: 'Ветеринар' },
  { name: 'photo_url', label: 'Фото (ссылка на изображение)', placeholder: 'https://...' },
  { name: 'description', label: 'Описание', type: 'textarea', placeholder: 'Краткая биография...' },
  { name: 'is_active', label: 'Активен', type: 'checkbox', default: true, checkLabel: 'Отображать на сайте' },
]

export default function StaffManager() {
  return (
    <CrudManager
      title="Персонал"
      icon={<HiOutlineUserGroup size={22} />}
      columns={COLUMNS}
      fetchFn={staffApi.list}
      createFn={staffApi.create}
      updateFn={staffApi.update}
      deleteFn={staffApi.delete}
      formFields={FIELDS}
    />
  )
}
