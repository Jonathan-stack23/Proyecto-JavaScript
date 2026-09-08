import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import PerfilUsuario from '../../components/PerfilUsuario';
import AdminProductos from '../admin/AdminProductos';
import AdminServicios from '../admin/AdminServicios';

function EmpleadoDashboard() {
  const [stats, setStats] = useState({
    productos: 0,
    servicios: 0,
    pedidos: 0,
    pedidosEnRevision: 0,
    citas: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s, ped, cit] = await Promise.allSettled([
          api.get('/productos'),
          api.get('/servicios'),
          api.get('/pedidos'),
          api.get('/citas'),
        ]);
        const pList = p.status === 'fulfilled' ? p.value.data.productos || [] : [];
        const sList = s.status === 'fulfilled' ? s.value.data.servicios || [] : [];
        const pedList = ped.status === 'fulfilled' ? ped.value.data.pedidos || [] : [];
        const citList = cit.status === 'fulfilled' ? cit.value.data.citas || [] : [];

        setStats({
          productos: pList.length,
          servicios: sList.length,
          pedidos: pedList.length,
          pedidosEnRevision: pedList.filter((x) => x.estado === 'en revision').length,
          citas: citList.length,
        });
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-heading">Bienvenido al Panel de Empleado</h1>
        <p className="text-gray-500 mt-1">Gestiona pedidos de clientes, citas técnicas, productos y servicios.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          to="/empleado/pedidos"
          className="group bg-white rounded-2xl p-6 shadow-custom-md border border-gray-100 hover:shadow-custom-lg hover:-translate-y-1 transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {stats.pedidosEnRevision} en rev.
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pedidos</p>
            <p className="text-3xl font-extrabold text-text-heading mt-0.5">{stats.pedidos}</p>
          </div>
        </Link>

        <Link
          to="/empleado/citas"
          className="group bg-white rounded-2xl p-6 shadow-custom-md border border-gray-100 hover:shadow-custom-lg hover:-translate-y-1 transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Citas de Servicios</p>
            <p className="text-3xl font-extrabold text-text-heading mt-0.5">{stats.citas}</p>
          </div>
        </Link>

        <Link
          to="/empleado/productos"
          className="group bg-white rounded-2xl p-6 shadow-custom-md border border-gray-100 hover:shadow-custom-lg hover:-translate-y-1 transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Productos</p>
            <p className="text-3xl font-extrabold text-text-heading mt-0.5">{stats.productos}</p>
          </div>
        </Link>

        <Link
          to="/empleado/servicios"
          className="group bg-white rounded-2xl p-6 shadow-custom-md border border-gray-100 hover:shadow-custom-lg hover:-translate-y-1 transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Servicios</p>
            <p className="text-3xl font-extrabold text-text-heading mt-0.5">{stats.servicios}</p>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-custom-md border border-gray-100">
        <h3 className="font-bold text-text-heading mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/empleado/pedidos"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-50 hover:bg-purple-100/70 border border-purple-100 transition-colors"
          >
            <span className="text-lg">📦</span>
            <div className="text-sm font-bold text-purple-900">Ver & Cambiar Pedidos</div>
          </Link>
          <Link
            to="/empleado/citas"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-teal-50 hover:bg-teal-100/70 border border-teal-100 transition-colors"
          >
            <span className="text-lg">🔧</span>
            <div className="text-sm font-bold text-teal-900">Atender Citas</div>
          </Link>
          <Link
            to="/empleado/productos"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 transition-colors"
          >
            <span className="text-lg">💻</span>
            <div className="text-sm font-bold text-emerald-900">Gestionar Productos</div>
          </Link>
          <Link
            to="/empleado/servicios"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100/70 border border-amber-100 transition-colors"
          >
            <span className="text-lg">⚙️</span>
            <div className="text-sm font-bold text-amber-900">Gestionar Servicios</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmpleadoPerfil() {
  return <PerfilUsuario backLink="/empleado/dashboard" backLabel="← Volver al dashboard" />;
}

export { EmpleadoDashboard, AdminProductos as EmpleadoProductos, AdminServicios as EmpleadoServicios, EmpleadoPerfil };
export default EmpleadoDashboard;
