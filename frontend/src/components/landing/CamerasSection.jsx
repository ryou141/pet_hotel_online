import { useEffect, useState, useRef } from 'react'
import Hls from 'hls.js'
import { camerasApi } from '../../api/client'
import { HiOutlineVideoCamera, HiOutlineLockClosed } from 'react-icons/hi2'
import './CamerasSection.css'

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
      video.src = src // Safari
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

export default function CamerasSection() {
  const [cameras, setCameras] = useState([])
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    camerasApi.public()
      .then(({ data }) => {
        setCameras(data)
        if (data.length) setActive(data[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="cameras-section section" id="cameras">
      <div className="container">
        <div className="section-tag"><HiOutlineVideoCamera size={14} /> Прямые трансляции</div>
        <h2 className="section-title">Смотрите за питомцами<br />в реальном времени</h2>
        <div className="divider" />
        <p className="section-subtitle">
          Камеры установлены во всех общих зонах. Ваш питомец всегда под наблюдением.
        </p>

        {loading ? (
          <div className="cameras-empty">
            <div className="cameras-empty-icon"><HiOutlineVideoCamera size={40} /></div>
            <p>Загрузка трансляций...</p>
          </div>
        ) : cameras.length === 0 ? (
          <div className="cameras-empty">
            <div className="cameras-empty-icon"><HiOutlineVideoCamera size={40} /></div>
            <p>Трансляции временно недоступны</p>
          </div>
        ) : (
          <div className="cameras-layout">
            <div className="camera-main">
              <div className="camera-label">
                <span className="camera-live-dot" />
                LIVE · {active?.name}
              </div>
              <div className="camera-frame">
                <HlsPlayer key={active?.id} src={active?.stream_url} />
              </div>
            </div>

            <div className="camera-list">
              {cameras.map((cam) => (
                <button
                  key={cam.id}
                  className={`camera-thumb ${active?.id === cam.id ? 'active' : ''}`}
                  onClick={() => setActive(cam)}
                >
                  <div className="camera-thumb-preview">
                    <HiOutlineVideoCamera size={22} />
                  </div>
                  <div className="camera-thumb-info">
                    <span className="camera-thumb-name">{cam.name}</span>
                    <span className="camera-thumb-status">
                      <span className="camera-live-dot" /> Онлайн
                    </span>
                  </div>
                </button>
              ))}

              <div className="camera-note">
                <HiOutlineLockClosed size={18} style={{ flexShrink: 0, opacity: 0.7 }} />
                <p>Трансляции из комнат ваших питомцев доступны только в личном кабинете</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}