import { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import PerfilUsuario from '../../components/PerfilUsuario';
import AdminProductos from '../admin/AdminProductos';
import AdminServicios from '../admin/AdminServicios';
import { useAuth } from '../../context/AuthContext';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Buenos días', emoji: '🌅' };
  if (h < 19) return { text: 'Buenas tardes', emoji: '☀️' };
  return { text: 'Buenas noches', emoji: '🌙' };
};

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(val || 0));

function EmpleadoDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    productos: 0,
    servicios: 0,
    pedidos: 0,
    pedidosEnRevision: 0,
    citas: 0,
    citasPendientes: 0,
  });
  const [loading, setLoading] = useState(true);
  const greeting = getGreeting();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
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
          citasPendientes: citList.filter(
            (x) => x.estado === 'en revision' || x.estado === 'revisado'
          ).length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statsCards = useMemo(
    () => [
      {
        title: 'Pedidos',
        value: stats.pedidos,
        badge: stats.pedidosEnRevision > 0 ? `${stats.pedidosEnRevision} en revisión` : null,
        badgeType: stats.pedidosEnRevision > 0 ? 'warning' : 'success',
        link: '/empleado/pedidos',
        gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
        icon: (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        ),
      },
      {
        title: 'Citas Técnicas',
        value: stats.citas,
        badge: stats.citasPendientes > 0 ? `${stats.citasPendientes} por atender` : 'Todo al día',
        badgeType: stats.citasPendientes > 0 ? 'warning' : 'success',
        link: '/empleado/citas',
        gradient: 'from-teal-500 via-emerald-500 to-green-600',
        icon: (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <path d="M8 14h.01"></path>
            <path d="M12 14h.01"></path>
            <path d="M16 14h.01"></path>
            <path d="M8 18h.01"></path>
            <path d="M12 18h.01"></path>
          </svg>
        ),
      },
      {
        title: 'Productos',
        value: stats.productos,
        badge: 'Inventario activo',
        badgeType: 'info',
        link: '/empleado/productos',
        gradient: 'from-blue-500 via-cyan-500 to-sky-600',
        icon: (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            <path d="M7 13h3"></path>
            <path d="M14 13h3"></path>
            <path d="M7 17h2"></path>
            <path d="M15 17h2"></path>
          </svg>
        ),
      },
      {
        title: 'Servicios',
        value: stats.servicios,
        badge: 'Catálogo técnico',
        badgeType: 'info',
        link: '/empleado/servicios',
        gradient: 'from-amber-500 via-orange-500 to-red-500',
        icon: (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.121 2.121 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
        ),
      },
    ],
    [stats]
  );

  const quickActions = useMemo(
    () => [
      {
        to: '/empleado/pedidos',
        label: 'Gestionar Pedidos',
        desc: 'Revisar y actualizar estados',
        icon: '📦',
        gradient: 'from-purple-500 to-indigo-600',
        bgLight: 'bg-purple-50',
        borderLight: 'border-purple-100',
        textColor: 'text-purple-900',
      },
      {
        to: '/empleado/citas',
        label: 'Atender Citas',
        desc: 'Servicios técnicos programados',
        icon: '🔧',
        gradient: 'from-teal-500 to-emerald-600',
        bgLight: 'bg-teal-50',
        borderLight: 'border-teal-100',
        textColor: 'text-teal-900',
      },
      {
        to: '/empleado/productos',
        label: 'Gestionar Productos',
        desc: 'Inventario y catálogo',
        icon: '💻',
        gradient: 'from-cyan-500 to-blue-600',
        bgLight: 'bg-cyan-50',
        borderLight: 'border-cyan-100',
        textColor: 'text-cyan-900',
      },
      {
        to: '/empleado/servicios',
        label: 'Gestionar Servicios',
        desc: 'Oferta técnica disponible',
        icon: '⚙️',
        gradient: 'from-amber-500 to-orange-600',
        bgLight: 'bg-amber-50',
        borderLight: 'border-amber-100',
        textColor: 'text-amber-900',
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-teal-200 rounded-full" />
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-text-heading font-bold text-lg">Cargando panel de empleado...</p>
          <p className="text-gray-400 text-sm">Sincronizando datos del sistema</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* ===== BANNER PRINCIPAL ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 md:p-10 text-white shadow-2xl">
        {/* Elementos decorativos */}
        <div className="absolute -top-32 -right-16 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full bg-emerald-400/5 blur-3xl pointer-events-none" />

        {/* Grid de patrón sutil */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-teal-400/30 to-emerald-500/30 backdrop-blur-md flex items-center justify-center text-4xl md:text-5xl shadow-2xl shrink-0 border-2 border-white/20">
                {greeting.emoji}
              </div>
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-black flex items-center justify-center shadow-xl border-2 border-slate-800">
                {(user?.nombre || 'E').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[11px] font-black uppercase tracking-wider border border-white/15 mb-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Panel de Empleado · Sesión activa
              </span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black leading-tight">
                {greeting.text}, {user?.nombre?.split(' ')[0] || 'Colaborador'}
              </h1>
              <p className="text-sm md:text-base text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Gestiona <strong className="text-white">pedidos</strong>,{' '}
                <strong className="text-white">citas técnicas</strong>,{' '}
                <strong className="text-white">productos</strong> y{' '}
                <strong className="text-white">servicios</strong> para ofrecer la mejor experiencia a nuestros clientes.
              </p>
            </div>
          </div>

          {/* Badge de prioridades */}
          <div className="flex flex-col gap-2 shrink-0">
            {(stats.pedidosEnRevision > 0 || stats.citasPendientes > 0) && (
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-4 border border-amber-400/30 min-w-[240px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚠️</span>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                    Atención prioritaria
                  </span>
                </div>
                <div className="space-y-1">
                  {stats.pedidosEnRevision > 0 && (
                    <p className="text-sm font-semibold text-white">
                      📦 <strong className="text-amber-300">{stats.pedidosEnRevision}</strong> pedido
                      {stats.pedidosEnRevision !== 1 && 's'} en revisión
                    </p>
                  )}
                  {stats.citasPendientes > 0 && (
                    <p className="text-sm font-semibold text-white">
                      🔧 <strong className="text-amber-300">{stats.citasPendientes}</strong> cita
                      {stats.citasPendientes !== 1 && 's'} pendiente
                      {stats.citasPendientes !== 1 && 's'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== TARJETAS KPI ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="group relative overflow-hidden bg-white rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-400 ease-out"
          >
            {/* Barra superior de gradiente */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
            {/* Glow decorativo */}
            <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${card.gradient} opacity-[0.07] blur-3xl group-hover:opacity-[0.12] transition-opacity duration-500`} />

            <div className="relative flex items-start justify-between mb-5">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-400`}
              >
                {card.icon}
              </div>
              {card.badge && (
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    card.badgeType === 'warning'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : card.badgeType === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {card.badge}
                </span>
              )}
            </div>

            <div className="relative space-y-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                Total {card.title}
              </p>
              <p className="text-4xl md:text-5xl font-black text-text-heading tracking-tight">
                {card.value}
              </p>
            </div>

            {/* Acceso sutil */}
            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 group-hover:text-accent transition-colors">
                Ir al módulo
              </span>
              <span
                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center shadow-sm group-hover:translate-x-1 transition-all duration-300 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ===== ACCIONES RÁPIDAS ===== */}
      <div className="bg-white rounded-3xl p-6 md:p-7 shadow-lg border border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-400" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="font-black text-text-heading text-xl flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline>
              </svg>
            </span>
            Acciones Rápidas
          </h3>
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
            Acceso directo a módulos de trabajo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={`group relative flex items-start gap-4 p-5 rounded-2xl ${action.bgLight} border ${action.borderLight} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
            >
              <div className={`shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} text-white flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-400`}>
                {action.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className={`font-black ${action.textColor} leading-tight`}>
                  {action.label}
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {action.desc}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black text-slate-600 group-hover:text-slate-900 group-hover:translate-x-1 transition-transform">
                  Ingresar
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ===== TIPS / RECORDATORIOS PARA EMPLEADOS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-purple-500/5 via-white to-indigo-500/5 rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
              ⏱️
            </span>
            <h4 className="font-black text-text-heading">Pedidos pendientes</h4>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Recuerda revisar constantemente los pedidos en estado{' '}
            <strong className="text-amber-600">"En revisión"</strong> para garantizar tiempos de entrega óptimos a los clientes.
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/5 via-white to-teal-500/5 rounded-3xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">
              📅
            </span>
            <h4 className="font-black text-text-heading">Citas programadas</h4>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Confirma las citas del día con antelación y actualiza su estado según avance el servicio técnico prestado.
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/5 via-white to-orange-500/5 rounded-3xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl">
              📦
            </span>
            <h4 className="font-black text-text-heading">Control de stock</h4>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Mantén actualizado el inventario. Si un producto tiene stock ≤ 5 unidades, notifica al área de compras inmediatamente.
          </p>
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
