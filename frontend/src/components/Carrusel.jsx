import { useState, useEffect } from 'react'
import './Carrusel.css'

const imagenes = [
  { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&h=500&q=80', alt: 'Tecnología moderna' },
  { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&h=500&q=80', alt: 'Laptop profesional' },
  { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&h=500&q=80', alt: 'Oficina moderna' },
  { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&h=500&q=80', alt: 'Dispositivos móviles' },
  { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&h=500&q=80', alt: 'Cámara digital' },
  { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=500&q=80', alt: 'Desarrollo web' },
  { url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&h=500&q=80', alt: 'Espacio creativo' },
  { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&h=500&q=80', alt: 'Tablet digital' },
  { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&h=500&q=80', alt: 'Gadgets modernos' },
  { url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&h=500&q=80', alt: 'Innovación tecnológica' }
]

function Carrusel() {
  const [indiceActual, setIndiceActual] = useState(0)
  const [imagenesCargadas, setImagenesCargadas] = useState({})

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActual((previo) => (previo + 1) % imagenes.length)
    }, 5000)
    return () => clearInterval(intervalo)
  }, [])

  const irAnterior = () => {
    setIndiceActual((previo) => (previo - 1 + imagenes.length) % imagenes.length)
  }

  const irSiguiente = () => {
    setIndiceActual((previo) => (previo + 1) % imagenes.length)
  }

  const irA = (indice) => {
    setIndiceActual(indice)
  }

  const manejarCarga = (indice) => {
    setImagenesCargadas((prev) => ({ ...prev, [indice]: true }))
  }

  return (
    <div className="carrusel">
      <button
        className="carrusel-btn anterior"
        onClick={irAnterior}
        aria-label="Anterior"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div className="carrusel-contenedor">
        {imagenes.map((imagen, indice) => (
          <div
            key={indice}
            className={indice === indiceActual ? 'carrusel-slide activo' : 'carrusel-slide'}
          >
            {!imagenesCargadas[indice] && (
              <div className="carrusel-placeholder">
                <svg className="loader-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                  </path>
                </svg>
              </div>
            )}
            <img
              src={imagen.url}
              alt={imagen.alt}
              loading={indice === 0 ? 'eager' : 'lazy'}
              onLoad={() => manejarCarga(indice)}
              className={imagenesCargadas[indice] ? 'cargada' : ''}
            />
            <div className="carrusel-overlay">
              <div className="carrusel-texto">
                <p className="carrusel-num">0{indice + 1} / 0{imagenes.length}</p>
                <h3>{imagen.alt}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="carrusel-btn siguiente"
        onClick={irSiguiente}
        aria-label="Siguiente"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <div className="carrusel-puntos">
        {imagenes.map((_, indice) => (
          <button
            key={indice}
            className={indice === indiceActual ? 'punto activo' : 'punto'}
            onClick={() => irA(indice)}
            aria-label={`Ir a imagen ${indice + 1}`}
          ></button>
        ))}
      </div>
    </div>
  )
}

export default Carrusel
