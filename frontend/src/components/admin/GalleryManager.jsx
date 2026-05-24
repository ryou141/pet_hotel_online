import CrudManager from './CrudManager'
import { galleryApi, adminApi } from '../../api/client'
import { HiOutlinePhoto } from 'react-icons/hi2'

const COLUMNS = [
  { key: 'id', label: '#' },
  { key: 'photo_url', label: 'Превью', render: v => <img src={v} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }} /> },
  { key: 'caption', label: 'Подпись' },
  { key: 'is_active', label: 'Видимость', render: v => <span className={`badge ${v ? 'badge-active' : 'badge-cancelled'}`}>{v ? 'Видна' : 'Скрыта'}</span> },
]

const FIELDS = [
  { name: 'photo_url', label: 'Ссылка на фото', required: true, placeholder: 'https://images.unsplash.com/...' },
  { name: 'caption', label: 'Подпись', placeholder: 'Игровая зона летом' },
  { name: 'is_active', label: 'Отображать', type: 'checkbox', default: true, checkLabel: 'Видна в галерее' },
]

export default function GalleryManager() {
  return (
    <CrudManager
      title="Галерея"
      icon={<HiOutlinePhoto size={22} />}
      columns={COLUMNS}
      fetchFn={galleryApi.list}
      createFn={adminApi.addGallery}
      updateFn={galleryApi.update}
      deleteFn={galleryApi.delete}
      formFields={FIELDS}
    />
  )
}
