import { useState, useEffect } from 'react'
import imagenesCarrusel from '../assets/images/imagenesCarrusel'

function Carousel() {
  const [indiceActual, setIndiceActual] = useState(0)
  const [imagenesCargadas, setImagenesCargadas] = useState({})

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActual((previo) => (previo + 1) % imagenesCarrusel.length)
    }, 5000)
    return () => clearInterval(intervalo)
  }, [])

  const irAnterior = () => {
    setIndiceActual((previo) => (previo - 1 + imagenesCarrusel.length) % imagenesCarrusel.length)
  }

  const irSiguiente = () => {
    setIndiceActual((previo) => (previo + 1) % imagenesCarrusel.length)
  }

  const irA = (indice) => {
    setIndiceActual(indice)
  }

  const manejarCarga = (indice) => {
    setImagenesCargadas((prev) => ({ ...prev, [indice]: true }))
  }

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-10 md:py-16">
      <div className="text-center mb-8">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-accent-light text-accent mb-3">
          Destacados
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-text-heading">
          Explora Nuestras Categorías
        </h2>
      </div>

      <div className="relative">
        <div className="overflow-hidden rounded-3xl shadow-custom-xl ring-1 ring-gray-100">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${indiceActual * 100}%)` }}
          >
            {imagenesCarrusel.map((imagen, indice) => (
              <div
                key={imagen.id}
                className="w-full flex-shrink-0 relative aspect-[21/9] md:aspect-[12/5] bg-gray-100"
              >
                {!imagenesCargadas[indice] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <svg className="w-12 h-12 text-gray-300 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                      </path>
                    </svg>
                  </div>
                )}
                <img
                  src={imagen.url}
                  alt={imagen.titulo}
                  loading={indice === 0 ? 'eager' : 'lazy'}
                  onLoad={() => manejarCarga(indice)}
                  onError={() => manejarCarga(indice)}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    imagenesCargadas[indice] ? 'opacity-100' : 'opacity-90'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12 text-white">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                      {String(indice + 1).padStart(2, '0')} / {String(imagenesCarrusel.length).padStart(2, '0')}
                    </div>
                    <h3 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 drop-shadow-lg">
                      {imagen.titulo}
                    </h3>
                    <p className="text-sm md:text-base text-white/85 max-w-xl drop-shadow">
                      {imagen.descripcion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={irAnterior}
          aria-label="Anterior"
          className="absolute left-2 md:-left-5 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white shadow-custom-lg flex items-center justify-center text-gray-700 hover:bg-accent hover:text-white transition-all duration-200 z-10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <button
          onClick={irSiguiente}
          aria-label="Siguiente"
          className="absolute right-2 md:-right-5 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white shadow-custom-lg flex items-center justify-center text-gray-700 hover:bg-accent hover:text-white transition-all duration-200 z-10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <div className="flex justify-center items-center gap-2 mt-6">
          {imagenesCarrusel.map((imagen, indice) => (
            <button
              key={imagen.id}
              onClick={() => irA(indice)}
              aria-label={`Ir a imagen ${indice + 1}`}
              className={`transition-all duration-300 rounded-full ${
                indice === indiceActual
                  ? 'w-8 h-2.5 bg-accent shadow-md'
                  : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
              }`}
            ></button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Carousel
