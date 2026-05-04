import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { camerasApi } from '../../api/client'
import {
  HiOutlinePause, HiOutlineUser, HiOutlineArrowUp,
  HiOutlineBolt, HiOutlineQuestionMarkCircle, HiOutlineVideoCamera, HiOutlineCpuChip,
} from 'react-icons/hi2'
import { MdOutlineRestaurant } from 'react-icons/md'
import './PetStream.css'

function HlsPlayer({ src }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(src)
      hls.attachMedia(video)
      return () => hls.destroy()
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      controls
      playsInline
      style={{ objectFit: 'cover' }}
    />
  )
}

const STATE_LABELS = {
  lying:   { label: 'Лежит',          Icon: HiOutlinePause,             color: '#4A7C40' },
  sitting: { label: 'Сидит',          Icon: HiOutlineUser,              color: '#9E7C56' },
  standing:{ label: 'Стоит',          Icon: HiOutlineArrowUp,           color: '#C08020' },
  moving:  { label: 'Активен',        Icon: HiOutlineBolt,              color: '#7A5230' },
  eating:  { label: 'Кушает',         Icon: MdOutlineRestaurant,        color: '#9E7C56' },
  unknown: { label: 'Определяется...', Icon: HiOutlineQuestionMarkCircle, color: '#9AAABB' },
}

export default function PetStream({ petId }) {
  const [camera, setCamera] = useState(null)
  const [state, setState] = useState('unknown')
  const [confidence, setConfidence] = useState(0)
  const wsRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    camerasApi.petCamera(petId).then(({ data }) => setCamera(data)).catch(() => {})
  }, [petId])

  useEffect(() => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/detect`
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.state) { setState(data.state); setConfidence(data.confidence || 0) }
      } catch {}
    }

    ws.onopen = () => {
      intervalRef.current = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) return
        // Capture a frame from the <video> element playing the HLS stream
        const video = document.querySelector('.pet-stream video')
        if (video && video.readyState >= 2 && video.videoWidth > 0) {
          const canvas = document.createElement('canvas')
          canvas.width  = Math.min(video.videoWidth,  640)
          canvas.height = Math.min(video.videoHeight, 360)
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
          ws.send(JSON.stringify({ frame: canvas.toDataURL('image/jpeg', 0.7), pet_id: petId }))
        }
      }, 5000)
    }

    ws.onerror = () => {}
    wsRef.current = ws
    return () => { clearInterval(intervalRef.current); ws.close() }
  }, [petId])

  const stateInfo = STATE_LABELS[state] || STATE_LABELS.unknown
  const StateIcon = stateInfo.Icon

  if (!camera) {
    return (
      <div className="pet-stream pet-stream-empty">
        <HiOutlineVideoCamera size={32} style={{ color: 'var(--text-light)' }} />
        <p>Питомец пока не заселён.<br />Камера появится после заселения.</p>
      </div>
    )
  }

  return (
    <div className="pet-stream">
      <div className="pet-stream-video">
        <div className="stream-live-badge">
          <span className="camera-live-dot" />
          LIVE
        </div>
        <HlsPlayer src={camera.stream_url} />
      </div>

      <div className="pet-stream-status">
        <div className="stream-state" style={{ '--state-color': stateInfo.color }}>
          <span className="stream-state-icon"><StateIcon size={22} /></span>
          <div>
            <span className="stream-state-label">Состояние питомца</span>
            <span className="stream-state-value">{stateInfo.label}</span>
          </div>
          {confidence > 0 && (
            <div className="stream-confidence">
              <div className="confidence-bar">
                <div style={{ width: `${Math.round(confidence * 100)}%`, background: stateInfo.color }} />
              </div>
              <span>{Math.round(confidence * 100)}%</span>
            </div>
          )}
        </div>
        <p className="stream-ai-note">
          <HiOutlineCpuChip size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Состояние определяется системой компьютерного зрения в реальном времени
        </p>
      </div>
    </div>
  )
}
