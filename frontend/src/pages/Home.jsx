import Carrusel from '../components/Carrusel'
import './Home.css'

function Home({ cambiarPagina }) {
  return (
    <div className="home">
      <section className="hero-seccion">
        <div className="hero-contenido">
          <span className="etiqueta">🎉 Bienvenido a MiTienda</span>
          <h2>
            Tecnología de <span className="texto-destacado">primera categoría</span>
          </h2>
          <p className="hero-subtitulo">
            Los mejores productos tecnológicos al mejor precio. Envío rápido y garantía total en cada compra.
          </p>
          <div className="hero-botones">
            <button className="btn btn-primario" onClick={() => cambiarPagina('products')}>
              Ver Productos
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <button className="btn btn-secundario" onClick={() => cambiarPagina('about')}>
              Conocer más
            </button>
          </div>
          <div className="hero-estadisticas">
            <div className="estadistica">
              <strong>+5.000</strong>
              <span>Clientes felices</span>
            </div>
            <div className="estadistica-divisor"></div>
            <div className="estadistica">
              <strong>+500</strong>
              <span>Productos disponibles</span>
            </div>
            <div className="estadistica-divisor"></div>
            <div className="estadistica">
              <strong>98%</strong>
              <span>Envíos exitosos</span>
            </div>
          </div>
        </div>
        <div className="hero-imagen">
          <img
            src="https://picsum.photos/id/3/700/550"
            alt="Productos destacados"
            loading="eager"
          />
          <div className="hero-badge">
            <div className="badge-icono">⚡</div>
            <div>
              <strong>Oferta Flash</strong>
              <span>Descuentos hasta 50%</span>
            </div>
          </div>
        </div>
      </section>

      <Carrusel />

      <section className="tarjetas-seccion">
        <div className="seccion-titulo">
          <span className="etiqueta">Por qué elegirnos</span>
          <h2>Nuestros Servicios Destacados</h2>
        </div>
        <div className="tarjetas-contenedor">
          <div className="tarjeta">
            <div className="tarjeta-icono" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            </div>
            <h3>Envío Rápido</h3>
            <p>Entrega en 24 horas en toda la ciudad. Recibe tus productos sin esperas.</p>
          </div>
          <div className="tarjeta">
            <div className="tarjeta-icono" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3>Garantía Total</h3>
            <p>Todos nuestros productos cuentan con 1 año de garantía oficial incluida.</p>
          </div>
          <div className="tarjeta">
            <div className="tarjeta-icono" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"></path>
              </svg>
            </div>
            <h3>Atención 24/7</h3>
            <p>Equipo de soporte disponible todos los días para resolver tus dudas.</p>
          </div>
          <div className="tarjeta">
            <div className="tarjeta-icono" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"></path>
              </svg>
            </div>
            <h3>Precios Increíbles</h3>
            <p>Las mejores ofertas y promociones todos los días del año.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
