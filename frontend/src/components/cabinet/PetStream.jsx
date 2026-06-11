import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { camerasApi } from '../../api/client'
import { HiOutlineVideoCamera } from 'react-icons/hi2'
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

export default function PetStream({ petId }) {
  const [camera, setCamera] = useState(null)

  useEffect(() => {
    camerasApi.petCamera(petId).then(({ data }) => setCamera(data)).catch(() => {})
  }, [petId])

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
        <HlsPlayer src={camera.hls_url || camera.stream_url} />
      </div>
    </div>
  )
}
