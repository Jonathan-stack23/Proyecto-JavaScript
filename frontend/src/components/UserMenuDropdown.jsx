import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function UserMenuDropdown({ showStoreLink = false }) {
  const [abierto, setAbierto] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const { user, logout, hasRole } = useAuth()

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickAfuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setAbierto(false)
      }
    }
    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera)
    }
  }, [abierto])

  if (!user) return null

  const getPanelLink = () => {
    if (hasRole('Administrador')) return '/admin/dashboard'
    if (hasRole('Empleado')) return '/empleado/dashboard'
    if (hasRole('Cliente')) return '/cliente/dashboard'
    return '/cliente/dashboard'
  }

  const getPerfilLink = () => {
    if (hasRole('Administrador')) return '/admin/perfil'
    if (hasRole('Empleado')) return '/empleado/perfil'
    if (hasRole('Cliente')) return '/cliente/perfil'
    return '/cliente/perfil'
  }

  const handleLogout = () => {
    setAbierto(false)
    logout()
    navigate('/')
  }

  const panelLink = getPanelLink()
  const perfilLink = getPerfilLink()
  const rolNombre = user.rol || user.rol_nombre || 'Usuario'
  const inicial = (user.nombre || 'U').charAt(0).toUpperCase()

  // Color de degradado según rol
  const getGradient = () => {
    if (hasRole('Administrador')) return 'from-accent to-purple-600'
    if (hasRole('Empleado')) return 'from-blue-500 to-cyan-600'
    return 'from-emerald-500 to-green-600'
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón trigger: Avatar + Info del usuario */}
      <button
        type="button"
        id="user-profile-menu-button"
        onClick={() => setAbierto((prev) => !prev)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border transition-all duration-200 text-left outline-none ${
          abierto
            ? 'bg-white shadow-custom-md border-gray-200 ring-2 ring-accent/20'
            : 'bg-gray-50/90 hover:bg-white hover:shadow-custom-sm border-gray-100 hover:border-gray-200'
        }`}
        aria-expanded={abierto}
        aria-haspopup="true"
      >
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient()} flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0`}
        >
          {inicial}
        </div>
        <div className="hidden sm:flex flex-col leading-tight min-w-0 pr-1">
          <span className="text-[11px] text-gray-500 font-medium">Bienvenido,</span>
          <span className="text-sm font-semibold text-text-heading truncate max-w-[130px]">
            {user.nombre}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-gray-400 transition-transform duration-200 ml-0.5 ${
            abierto ? 'rotate-180 text-accent' : ''
          }`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {/* Menú Desplegable */}
      {abierto && (
        <div className="absolute right-0 top-full mt-2.5 w-72 bg-white rounded-2xl shadow-custom-xl border border-gray-100 p-2 z-50 animate-fade-in origin-top-right divide-y divide-gray-100">
          {/* Header del menú con datos del usuario */}
          <div className="p-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getGradient()} flex items-center justify-center text-white text-base font-bold shadow-md flex-shrink-0`}
              >
                {inicial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-heading truncate">
                  {user.nombre} {user.apellido || ''}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5" title={user.email}>
                  {user.email}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-light text-accent capitalize">
                  {rolNombre}
                </span>
              </div>
            </div>
          </div>

          {/* Opciones de navegación */}
          <div className="py-2 space-y-1">
            {/* Opción: Entrar al Panel */}
            <Link
              to={panelLink}
              id="menu-item-panel"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-accent group transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-accent-light text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="leading-tight font-semibold">Panel de control</span>
                <span className="text-[11px] text-gray-400 font-normal">Acceder a tu panel principal</span>
              </div>
            </Link>

            {/* Opción: Configuración / Mi Perfil */}
            <Link
              to={perfilLink}
              id="menu-item-configuracion"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-accent group transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="leading-tight font-semibold">Configuración</span>
                <span className="text-[11px] text-gray-400 font-normal">Editar datos y contraseña</span>
              </div>
            </Link>

            {/* Opción opcional: Ir a la tienda */}
            {showStoreLink && (
              <Link
                to="/"
                onClick={() => setAbierto(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-accent group transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="leading-tight font-semibold">Ir a la tienda</span>
                  <span className="text-[11px] text-gray-400 font-normal">Volver a la vista pública</span>
                </div>
              </Link>
            )}
          </div>

          {/* Opción: Cerrar Sesión */}
          <div className="pt-2">
            <button
              type="button"
              id="menu-item-logout"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 group transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="leading-tight font-semibold">Cerrar sesión</span>
                <span className="text-[11px] text-red-400 font-normal">Salir de tu cuenta</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenuDropdown
