import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  const [stats, setStats] = useState({
    usuarios: { total: 0, activos: 0 },
    productos: { total: 0, activos: 0 },
    servicios: { total: 0, activos: 0 },
    pedidos: { total: 0, enRevision: 0 },
    citas: { total: 0, enRevision: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [uRes, pRes, sRes, pedRes, citRes] = await Promise.allSettled([
          api.get('/usuarios'),
          api.get('/productos'),
          api.get('/servicios'),
          api.get('/pedidos'),
          api.get('/citas'),
        ]);

        const uData = uRes.status === 'fulfilled' ? uRes.value.data.usuarios || [] : [];
        const pData = pRes.status === 'fulfilled' ? pRes.value.data.productos || [] : [];
        const sData = sRes.status === 'fulfilled' ? sRes.value.data.servicios || [] : [];
        const pedData = pedRes.status === 'fulfilled' ? pedRes.value.data.pedidos || [] : [];
        const citData = citRes.status === 'fulfilled' ? citRes.value.data.citas || [] : [];

        setStats({
          usuarios: {
            total: uData.length,
            activos: uData.filter((u) => u.estado === 'activo').length,
          },
          productos: {
            total: pData.length,
            activos: pData.filter((p) => p.estado === 'activo').length,
          },
          servicios: {
            total: sData.length,
            activos: sData.filter((s) => s.estado === 'activo').length,
          },
          pedidos: {
            total: pedData.length,
            enRevision: pedData.filter((p) => p.estado === 'en revision').length,
          },
          citas: {
            total: citData.length,
            enRevision: citData.filter((c) => c.estado === 'en revision').length,
          },
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const cards = [
    {
      title: 'Pedidos',
      total: stats.pedidos.total,
      sublabel: 'En revisión',
      subval: stats.pedidos.enRevision,
      link: '/admin/pedidos',
      color: 'from-purple-500 to-indigo-600',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      ),
    },
    {
      title: 'Citas Técnicas',
      total: stats.citas.total,
      sublabel: 'Pendientes',
      subval: stats.citas.enRevision,
      link: '/admin/citas',
      color: 'from-teal-500 to-emerald-600',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
    },
    {
      title: 'Usuarios',
      total: stats.usuarios.total,
      sublabel: 'Activos',
      subval: stats.usuarios.activos,
      link: '/admin/usuarios',
      color: 'from-blue-500 to-indigo-600',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        </svg>
      ),
    },
    {
      title: 'Productos',
      total: stats.productos.total,
      sublabel: 'Activos',
      subval: stats.productos.activos,
      link: '/admin/productos',
      color: 'from-emerald-500 to-teal-600',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      ),
    },
    {
      title: 'Servicios',
      total: stats.servicios.total,
      sublabel: 'Activos',
      subval: stats.servicios.activos,
      link: '/admin/servicios',
      color: 'from-amber-500 to-orange-600',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-heading">Bienvenido al Panel de Administración</h1>
        <p className="text-gray-500 mt-1">Supervisa y gestiona pedidos, citas, usuarios, productos y servicios.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c) => (
          <Link
            key={c.title}
            to={c.link}
            className="group bg-white rounded-2xl p-6 shadow-custom-md border border-gray-100 hover:shadow-custom-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                {c.icon}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{c.sublabel}</p>
                <p className="text-2xl font-bold text-text-heading">{c.subval}</p>
              </div>
            </div>
            <div className="mt-5">
              <p className="text-sm text-gray-500">Total {c.title.toLowerCase()}</p>
              <p className="text-3xl font-bold text-text-heading mt-0.5">{c.total}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-custom-md border border-gray-100">
        <h3 className="font-bold text-text-heading mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          </svg>
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/admin/pedidos" className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-50 hover:bg-purple-100/70 border border-purple-100 transition-colors">
            <span className="text-lg">📦</span>
            <div className="text-sm font-bold text-purple-900">Revisar Pedidos</div>
          </Link>
          <Link to="/admin/citas" className="flex items-center gap-3 p-3.5 rounded-xl bg-teal-50 hover:bg-teal-100/70 border border-teal-100 transition-colors">
            <span className="text-lg">🔧</span>
            <div className="text-sm font-bold text-teal-900">Citas de Servicios</div>
          </Link>
          <Link to="/admin/productos" className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 transition-colors">
            <span className="text-lg">💻</span>
            <div className="text-sm font-bold text-emerald-900">Catálogo Productos</div>
          </Link>
          <Link to="/admin/usuarios" className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100/70 border border-blue-100 transition-colors">
            <span className="text-lg">👥</span>
            <div className="text-sm font-bold text-blue-900">Control de Usuarios</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
