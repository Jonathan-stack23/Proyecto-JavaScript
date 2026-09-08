import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserMenuDropdown from '../../components/UserMenuDropdown';

function EmpleadoLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-white text-blue-600 shadow-md border border-blue-100'
        : 'text-gray-600 hover:bg-white/60 hover:text-text-heading'
    }`;

  return (
    <div className="min-h-screen bg-surface-alt flex">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-gradient-to-b from-blue-500 to-cyan-600 text-white flex flex-col shadow-custom-lg hidden lg:flex">
        <div className="px-6 py-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 01-8 0"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">MiTienda</h1>
              <p className="text-[11px] text-white/70 mt-0.5">Panel Empleado</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          <p className="px-4 text-[10px] uppercase font-bold text-white/50 tracking-wider mb-2">Principal</p>
          <NavLink to="/empleado/dashboard" end className={navLinkClass}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Dashboard
          </NavLink>

          <p className="px-4 pt-4 text-[10px] uppercase font-bold text-white/50 tracking-wider mb-2">Atención & Pedidos</p>
          <NavLink to="/empleado/pedidos" className={navLinkClass}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Pedidos
          </NavLink>
          <NavLink to="/empleado/citas" className={navLinkClass}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Citas de Servicios
          </NavLink>

          <p className="px-4 pt-4 text-[10px] uppercase font-bold text-white/50 tracking-wider mb-2">Mi gestión</p>
          <NavLink to="/empleado/productos" className={navLinkClass}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            Productos
          </NavLink>
          <NavLink to="/empleado/servicios" className={navLinkClass}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
            Servicios
          </NavLink>

          <p className="px-4 pt-4 text-[10px] uppercase font-bold text-white/50 tracking-wider mb-2">Mi cuenta</p>
          <NavLink to="/empleado/perfil" className={navLinkClass}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Mi perfil
          </NavLink>
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <Link to="/" className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            Ir al sitio
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-custom-sm sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="lg:hidden w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                </svg>
              </Link>
              <div>
                <h2 className="text-lg font-bold text-text-heading leading-none">Panel de Empleado</h2>
                <p className="text-xs text-gray-500 mt-0.5">Gestión de pedidos, citas, productos y servicios</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserMenuDropdown showStoreLink={true} />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default EmpleadoLayout;
