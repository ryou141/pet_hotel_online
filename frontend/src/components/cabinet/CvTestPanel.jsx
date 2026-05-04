import { useEffect, useRef, useState } from 'react'
import {
  HiOutlineCpuChip, HiOutlineVideoCamera, HiOutlineArrowUpTray,
  HiOutlinePause, HiOutlineUser, HiOutlineArrowUp,
  HiOutlineBolt, HiOutlineQuestionMarkCircle,
} from 'react-icons/hi2'
import { MdOutlineRestaurant } from 'react-icons/md'
import './CvTestPanel.css'

const STATE_LABELS = {
  lying:    { label: 'Лежит',           Icon: HiOutlinePause,              color: '#4A7C40' },
  sitting:  { label: 'Сидит',           Icon: HiOutlineUser,               color: '#9E7C56' },
  standing: { label: 'Стоит',           Icon: HiOutlineArrowUp,            color: '#C08020' },
  moving:   { label: 'Активен',         Icon: HiOutlineBolt,               color: '#7A5230' },
  eating:   { label: 'Кушает',          Icon: MdOutlineRestaurant,         color: '#9E7C56' },
  unknown:  { label: 'Определяется...', Icon: HiOutlineQuestionMarkCircle, color: '#9AAABB' },
}

export default function CvTestPanel({ petId }) {
  const videoRef    = useRef(null)
  const wsRef       = useRef(null)
  const intervalRef = useRef(null)
  const fileRef     = useRef(null)

  const [videoUrl, setVideoUrl]     = useState(null)
  const [state, setState]           = useState('unknown')
  const [confidence, setConfidence] = useState(0)
  const [wsStatus, setWsStatus]     = useState('idle') // idle | connecting | ready | error
  const [label, setLabel]           = useState('')

  // Connect WebSocket once panel mounts
  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/detect`)
    setWsStatus('connecting')

    ws.onopen  = () => setWsStatus('ready')
    ws.onerror = () => setWsStatus('error')
    ws.onclose = () => setWsStatus('idle')
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.state) {
          setState(data.state)
          setConfidence(data.confidence || 0)
          setLabel(data.label || '')
        }
      } catch {}
    }
    wsRef.current = ws
    return () => {
      clearInterval(intervalRef.current)
      ws.close()
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    }
  }, [])

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoUrl(URL.createObjectURL(file))
    setState('unknown')
    setConfidence(0)
  }

  function handleVideoPlay() {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const video = videoRef.current
      const ws    = wsRef.current
      if (!video || video.paused || video.ended) return
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      const canvas = document.createElement('canvas')
      canvas.width  = Math.min(video.videoWidth,  640)
      canvas.height = Math.min(video.videoHeight, 360)
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      ws.send(JSON.stringify({ frame: canvas.toDataURL('image/jpeg', 0.8), pet_id: petId }))
    }, 1500)
  }

  function handleVideoPause() {
    clearInterval(intervalRef.current)
  }

  const stateInfo = STATE_LABELS[state] || STATE_LABELS.unknown
  const StateIcon = stateInfo.Icon

  return (
    <div className="cv-test-panel">
      <div className="cv-test-header">
        <HiOutlineCpuChip size={16} />
        <span>Тест распознавания поз</span>
        <span className={`cv-ws-badge cv-ws-${wsStatus}`}>
          {wsStatus === 'ready' ? 'Сервер готов' : wsStatus === 'connecting' ? 'Подключение...' : wsStatus === 'error' ? 'Нет связи' : ''}
        </span>
      </div>

      {!videoUrl ? (
        <button className="cv-upload-btn" onClick={() => fileRef.current?.click()}>
          <HiOutlineArrowUpTray size={22} />
          <span>Загрузить видео с питомцем</span>
          <span className="cv-upload-hint">MP4, MOV, AVI — до 500 МБ</span>
        </button>
      ) : (
        <div className="cv-video-wrap">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onEnded={handleVideoPause}
            className="cv-video"
          />
          <button className="cv-change-btn" onClick={() => fileRef.current?.click()}>
            <HiOutlineVideoCamera size={14} /> Другое видео
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {videoUrl && (
        <div className="cv-result" style={{ '--state-color': stateInfo.color }}>
          <span className="cv-result-icon"><StateIcon size={24} /></span>
          <div className="cv-result-info">
            <span className="cv-result-title">Состояние питомца</span>
            <span className="cv-result-value">{label || stateInfo.label}</span>
          </div>
          {confidence > 0 && (
            <div className="cv-confidence">
              <div className="cv-confidence-bar">
                <div style={{ width: `${Math.round(confidence * 100)}%`, background: stateInfo.color }} />
              </div>
              <span>{Math.round(confidence * 100)}%</span>
            </div>
          )}
        </div>
      )}

      <p className="cv-note">
        Запустите видео — модель будет анализировать кадры каждые 1.5 сек
      </p>
    </div>
  )
}
