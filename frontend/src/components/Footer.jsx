import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-text-heading text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md backdrop-blur-sm">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 01-8 0"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold leading-none text-white">MiTienda</h3>
                <p className="text-xs text-gray-400 mt-0.5">Tecnología & más</p>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Los mejores productos tecnológicos al mejor precio. Calidad, garantía y envío rápido en cada compra.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-accent flex items-center justify-center transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-pink-500 flex items-center justify-center transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-sky-500 flex items-center justify-center transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-5 text-white">Navegación</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">Inicio</Link>
              </li>
              <li>
                <Link to="/quienes-somos" className="text-sm text-gray-400 hover:text-white transition-colors">Quiénes Somos</Link>
              </li>
              <li>
                <Link to="/productos" className="text-sm text-gray-400 hover:text-white transition-colors">Productos</Link>
              </li>
              <li>
                <Link to="/contacto" className="text-sm text-gray-400 hover:text-white transition-colors">Contacto</Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Mi Cuenta</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-5 text-white">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">info@mitienda.com</p>
                  <p className="text-sm text-gray-400">soporte@mitienda.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">+57 123 456 7890</p>
                  <p className="text-sm text-gray-400">Lun - Sáb, 8am - 6pm</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Calle Principal #123</p>
                  <p className="text-sm text-gray-400">Ciudad, País</p>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-5 text-white">Newsletter</h4>
            <p className="text-sm text-gray-400 mb-4">
              Suscríbete para recibir ofertas y novedades.
            </p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="tu.correo@ejemplo.com"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
              />
              <button
                type="submit"
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
              >
                Suscribirme
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500 text-center md:text-left">
            © 2026 MiTienda. Todos los derechos reservados.
          </p>
          <p className="text-sm text-gray-500">
            Desarrollado por <span className="text-gray-300 font-medium">Jonathan Martinez</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
