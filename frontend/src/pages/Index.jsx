import Carousel from '../components/Carousel'
import { Link } from 'react-router-dom'

function Index() {
  const servicios = [
    {
      icono: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
      ),
      color: 'from-pink-500 to-rose-500',
      titulo: 'Envío Rápido',
      desc: 'Entrega en 24 horas en toda la ciudad. Recibe tus productos sin esperas.',
    },
    {
      icono: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      color: 'from-sky-500 to-cyan-400',
      titulo: 'Garantía Total',
      desc: 'Todos nuestros productos cuentan con 1 año de garantía oficial incluida.',
    },
    {
      icono: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"></path>
        </svg>
      ),
      color: 'from-emerald-500 to-teal-400',
      titulo: 'Atención 24/7',
      desc: 'Equipo de soporte disponible todos los días para resolver tus dudas.',
    },
    {
      icono: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"></path>
        </svg>
      ),
      color: 'from-amber-500 to-orange-400',
      titulo: 'Precios Increíbles',
      desc: 'Las mejores ofertas y promociones todos los días del año.',
    },
  ]

  return (
    <div className="index-page">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-light via-white to-purple-50 -z-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-purple-200/40 blur-3xl -z-10"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 shadow-sm text-sm font-semibold text-accent mb-6">
                <span>🎉</span> Bienvenido a MiTienda
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-heading leading-[1.05] mb-6">
                Tecnología de{' '}
                <span className="bg-gradient-to-r from-accent via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  primera categoría
                </span>
              </h2>
              <p className="text-lg text-text max-w-xl mx-auto lg:mx-0 mb-8">
                Los mejores productos tecnológicos al mejor precio. Envío rápido y garantía total en cada compra.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <Link
                  to="/productos"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-accent text-white font-semibold rounded-xl shadow-lg shadow-accent/30 hover:bg-accent-dark hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-0.5 transition-all"
                >
                  Ver Productos
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
                <Link
                  to="/quienes-somos"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-text-heading font-semibold rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 hover:shadow-md transition-all"
                >
                  Conocer más
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 sm:gap-8">
                <div className="text-center sm:text-left">
                  <p className="text-3xl md:text-4xl font-extrabold text-text-heading">+5.000</p>
                  <p className="text-sm text-text">Clientes felices</p>
                </div>
                <div className="hidden sm:block w-px h-12 bg-gray-200"></div>
                <div className="text-center sm:text-left">
                  <p className="text-3xl md:text-4xl font-extrabold text-text-heading">+500</p>
                  <p className="text-sm text-text">Productos disponibles</p>
                </div>
                <div className="hidden sm:block w-px h-12 bg-gray-200"></div>
                <div className="text-center sm:text-left">
                  <p className="text-3xl md:text-4xl font-extrabold text-text-heading">98%</p>
                  <p className="text-sm text-text">Envíos exitosos</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-custom-xl ring-1 ring-gray-100 aspect-[5/4]">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&h=550&q=80"
                  alt="Productos destacados"
                  loading="eager"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&h=550&q=80'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
              </div>
              <div className="absolute -bottom-5 -left-5 sm:-bottom-6 sm:-left-8 bg-white rounded-2xl shadow-custom-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 ring-1 ring-gray-100 max-w-[220px]">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl sm:text-2xl shadow-md flex-shrink-0">
                  ⚡
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-text-heading text-sm sm:text-base leading-tight">Oferta Flash</p>
                  <p className="text-xs sm:text-sm text-text">Descuentos hasta 50%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Carousel />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-accent-light text-accent mb-3">
            Por qué elegirnos
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-heading">
            Nuestros Servicios Destacados
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {servicios.map((s, i) => (
            <div
              key={i}
              className="group bg-white rounded-2xl p-7 shadow-custom-sm ring-1 ring-gray-100 hover:shadow-custom-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}>
                {s.icono}
              </div>
              <h3 className="text-lg font-bold text-text-heading mb-2">{s.titulo}</h3>
              <p className="text-sm text-text leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Index
