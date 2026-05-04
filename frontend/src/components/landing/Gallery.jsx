import { useEffect, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { galleryApi } from '../../api/client'
import { HiOutlineMagnifyingGlassPlus } from 'react-icons/hi2'
import './Gallery.css'

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    galleryApi.list()
      .then(({ data }) => setPhotos(data.filter(p => p.is_active !== false)))
      .catch(() => {})
  }, [])

  function openPhoto(i) {
    setLightboxIndex(i)
    setLightboxOpen(true)
  }

  // First 6 in grid, all in lightbox
  const gridPhotos = photos.slice(0, 6)
  const slides = photos.map(p => ({ src: p.photo_url, title: p.caption }))

  if (photos.length === 0) return null

  return (
    <section className="gallery-section section" id="gallery">
      <div className="container">
        <div className="section-tag">Фотогалерея</div>
        <h2 className="section-title">Жизнь в нашем отеле</h2>
        <div className="divider" />
        <p className="section-subtitle">
          Моменты счастья, уюта и игривости — всё это ждёт вашего питомца у нас.
        </p>

        <div className="gallery-grid">
          {gridPhotos.map((photo, i) => (
            <div
              key={photo.id}
              className={`gallery-item ${i === 0 ? 'gallery-item-large' : ''}`}
              onClick={() => openPhoto(i)}
            >
              <img src={photo.photo_url} alt={photo.caption || 'Фото из галереи'} loading="lazy" />
              <div className="gallery-overlay">
                <span className="gallery-zoom"><HiOutlineMagnifyingGlassPlus size={24} /></span>
                {photo.caption && <span className="gallery-caption">{photo.caption}</span>}
              </div>
            </div>
          ))}
        </div>

        {photos.length > 6 && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button
              className="btn btn-outline"
              onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}
            >
              Смотреть все {photos.length} фото
            </button>
          </div>
        )}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={lightboxIndex}
        styles={{ container: { backgroundColor: 'rgba(0,0,0,0.92)' } }}
      />
    </section>
  )
}
