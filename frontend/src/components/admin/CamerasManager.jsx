import { useState, useEffect } from 'react'
import CrudManager from './CrudManager'
import { camerasApi, roomsApi } from '../../api/client'
import { HiOutlineVideoCamera } from 'react-icons/hi2'

const COLUMNS = [
  { key: 'id', label: '#' },
  { key: 'name', label: 'Название' },
  { key: 'zone_type', label: 'Зона', render: v => v === 'public' ? 'Общая' : 'Комната' },
  { key: 'room_id', label: 'Комната', render: v => v ?? '—' },
  { key: 'stream_url', label: 'Ссылка на стрим', render: v => <span style={{ maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span> },
  { key: 'is_active', label: 'Статус', render: v => <span className={`badge ${v ? 'badge-active' : 'badge-cancelled'}`}>{v ? 'Онлайн' : 'Офлайн'}</span> },
]

export default function CamerasManager() {
  const [roomOptions, setRoomOptions] = useState([])

  useEffect(() => {
    roomsApi.list().then(({ data }) => {
      setRoomOptions(data.map(r => ({ value: String(r.id), label: `№${r.number} (${r.type})` })))
    }).catch(() => {})
  }, [])

  const FIELDS = [
    { name: 'name', label: 'Название камеры', required: true, placeholder: 'Игровая зона' },
    { name: 'stream_url', label: 'URL для CV-модуля (RTMP/HLS)', required: true, placeholder: 'rtmp://...' },
    { name: 'hls_url', label: 'URL для браузера (HLS)', placeholder: 'http://paw-hotel.ru:8080/hls/room1.m3u8' },
    { name: 'zone_type', label: 'Тип зоны', type: 'select', default: 'room', options: [{ value: 'public', label: 'Общая зона' }, { value: 'room', label: 'Комната' }] },
    { name: 'room_id', label: 'Комната', type: 'select', numeric: true, options: [{ value: '', label: '— не привязана —' }, ...roomOptions] },
    { name: 'is_active', label: 'Активна', type: 'checkbox', default: true, checkLabel: 'Камера активна' },
  ]

  return (
    <CrudManager
      title="Камеры"
      icon={<HiOutlineVideoCamera size={22} />}
      columns={COLUMNS}
      fetchFn={camerasApi.list}
      createFn={camerasApi.create}
      updateFn={camerasApi.update}
      deleteFn={camerasApi.delete}
      formFields={FIELDS}
    />
  )
}
