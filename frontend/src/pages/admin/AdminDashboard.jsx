import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(val || 0));

const formatShortCurrency = (val) => {
  const num = Number(val || 0);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num}`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Buenos días', emoji: '🌅' };
  if (h < 19) return { text: 'Buenas tardes', emoji: '☀️' };
  return { text: 'Buenas noches', emoji: '🌙' };
};

function AdminDashboard() {
  const [stats, setStats] = useState({
    total_usuarios: 0,
    total_productos: 0,
    total_servicios: 0,
    total_ventas: 0,
    facturacion_total: 0,
    pqr_totales: 0,
    pqr_pendientes: 0,
    ventas_hoy: 0,
    facturacion_hoy: 0,
  });
  const [charts, setCharts] = useState({ ventas_por_periodo: [], ingresos_por_periodo: [], ingresos_acumulados: [] });
  const [loading, setLoading] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [periodoDias, setPeriodoDias] = useState(7);
  const [modoIngreso, setModoIngreso] = useState('diarios');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('7dias');
  const greeting = getGreeting();

  const cargarGraficos = async (params = { dias: 7 }) => {
    try {
      setLoadingCharts(true);
      const chartsRes = await api.get('/dashboard/charts', { params });
      const chartsData = chartsRes.data || {};
      setCharts({
        ventas_por_periodo: chartsData.ventas_por_periodo || [],
        ingresos_por_periodo: chartsData.ingresos_por_periodo || [],
        ingresos_acumulados: chartsData.ingresos_acumulados || [],
      });
    } catch (e) {
      console.error('Error actualizando gráficos:', e);
    } finally {
      setLoadingCharts(false);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [statsRes, chartsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/charts?dias=7'),
        ]);

        const statsData = statsRes.data?.stats || {};
        const chartsData = chartsRes.data || {};

        setStats({
          total_usuarios: statsData.total_usuarios || 0,
          total_productos: statsData.total_productos || 0,
          total_servicios: statsData.total_servicios || 0,
          total_ventas: statsData.total_ventas || 0,
          facturacion_total: statsData.facturacion_total || 0,
          pqr_totales: statsData.pqr_totales || 0,
          pqr_pendientes: statsData.pqr_pendientes || 0,
          ventas_hoy: statsData.ventas_hoy || 0,
          facturacion_hoy: statsData.facturacion_hoy || 0,
        });

        setCharts({
          ventas_por_periodo: chartsData.ventas_por_periodo || [],
          ingresos_por_periodo: chartsData.ingresos_por_periodo || [],
          ingresos_acumulados: chartsData.ingresos_acumulados || [],
        });
      } catch (e) {
        console.error('Error cargando dashboard', e);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const aplicarFiltroPreset = (dias, tag) => {
    setPeriodoDias(dias);
    setFiltroActivo(tag);
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
    cargarGraficos({ dias });
  };

  const aplicarFiltroRangoFechas = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!filtroFechaInicio || !filtroFechaFin) return;
    setFiltroActivo('personalizado');
    cargarGraficos({
      fecha_inicio: filtroFechaInicio,
      fecha_fin: filtroFechaFin,
    });
  };

  const ventasSlice = useMemo(() => {
    return charts.ventas_por_periodo || [];
  }, [charts.ventas_por_periodo]);

  const ingresosSlice = useMemo(() => {
    const source = modoIngreso === 'diarios' ? charts.ingresos_por_periodo : charts.ingresos_acumulados;
    return source || [];
  }, [charts.ingresos_por_periodo, charts.ingresos_acumulados, modoIngreso]);

  const maxVentas = useMemo(() => {
    const values = ventasSlice.map((i) => Number(i.valor || 0));
    return values.length ? Math.max(...values, 1) : 1;
  }, [ventasSlice]);

  const maxIngresos = useMemo(() => {
    const values = ingresosSlice.map((i) => Number(i.valor || 0));
    return values.length ? Math.max(...values, 1) : 1;
  }, [ingresosSlice]);

  const totalPeriodoIngresos = useMemo(() => {
    const source = charts.ingresos_por_periodo || [];
    return source.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  }, [charts.ingresos_por_periodo]);

  const totalVentasPeriodo = useMemo(
    () => ventasSlice.reduce((a, b) => a + Number(b.valor || 0), 0),
    [ventasSlice]
  );

  const avgVentasPorDia = useMemo(
    () => Math.round(totalVentasPeriodo / Math.max(ventasSlice.length, 1)),
    [totalVentasPeriodo, ventasSlice.length]
  );

  const cards = [
    {
      title: 'Ventas',
      total: stats.total_ventas,
      sublabel: 'Hoy',
      subval: stats.ventas_hoy,
      subextra: `Promedio/día: ${avgVentasPorDia}`,
      link: '/admin/ventas',
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      glow: 'shadow-purple-500/25',
      iconBg: 'bg-white/25',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      ),
    },
    {
      title: 'Facturación',
      total: formatCurrency(stats.facturacion_total),
      sublabel: 'Hoy',
      subval: formatCurrency(stats.facturacion_hoy),
      subextra: `Período: ${formatShortCurrency(totalPeriodoIngresos)}`,
      link: '/admin/facturas',
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      glow: 'shadow-emerald-500/25',
      iconBg: 'bg-white/25',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v6h6"></path>
          <path d="M9 15h6"></path>
          <path d="M9 19h6"></path>
          <path d="M9 11h3"></path>
        </svg>
      ),
    },
    {
      title: 'Usuarios',
      total: stats.total_usuarios,
      sublabel: 'Registrados',
      subval: stats.total_usuarios,
      subextra: 'Base de clientes activa',
      link: '/admin/usuarios',
      gradient: 'from-blue-500 via-indigo-500 to-violet-600',
      glow: 'shadow-blue-500/25',
      iconBg: 'bg-white/25',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
    {
      title: 'Productos',
      total: stats.total_productos,
      sublabel: 'En catálogo',
      subval: stats.total_productos,
      subextra: 'Inventario disponible',
      link: '/admin/productos',
      gradient: 'from-green-500 via-emerald-500 to-teal-600',
      glow: 'shadow-green-500/25',
      iconBg: 'bg-white/25',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          <path d="M7 13h3"></path>
          <path d="M14 17h3"></path>
        </svg>
      ),
    },
    {
      title: 'Servicios',
      total: stats.total_servicios,
      sublabel: 'Ofertados',
      subval: stats.total_servicios,
      subextra: 'Servicios técnicos activos',
      link: '/admin/servicios',
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      glow: 'shadow-amber-500/25',
      iconBg: 'bg-white/25',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
    },
    {
      title: 'PQR',
      total: stats.pqr_totales,
      sublabel: 'Pendientes',
      subval: stats.pqr_pendientes,
      subextra: stats.pqr_pendientes > 0 ? '⚠️ Requiere atención' : 'Todo al día ✓',
      link: '/admin/pqr',
      gradient: 'from-rose-500 via-pink-500 to-fuchsia-600',
      glow: 'shadow-rose-500/25',
      iconBg: 'bg-white/25',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <path d="M8 9h8"></path>
          <path d="M8 13h5"></path>
        </svg>
      ),
    },
  ];

  const colorClassMap = {
    amber:   { cardBg: 'bg-amber-50/70', cardBgHover: 'hover:bg-amber-100', cardBorder: 'border-amber-100', cardBorderHover: 'hover:border-amber-200', label: 'text-amber-900' },
    purple:  { cardBg: 'bg-purple-50/70', cardBgHover: 'hover:bg-purple-100', cardBorder: 'border-purple-100', cardBorderHover: 'hover:border-purple-200', label: 'text-purple-900' },
    teal:    { cardBg: 'bg-teal-50/70', cardBgHover: 'hover:bg-teal-100', cardBorder: 'border-teal-100', cardBorderHover: 'hover:border-teal-200', label: 'text-teal-900' },
    blue:    { cardBg: 'bg-blue-50/70', cardBgHover: 'hover:bg-blue-100', cardBorder: 'border-blue-100', cardBorderHover: 'hover:border-blue-200', label: 'text-blue-900' },
    emerald: { cardBg: 'bg-emerald-50/70', cardBgHover: 'hover:bg-emerald-100', cardBorder: 'border-emerald-100', cardBorderHover: 'hover:border-emerald-200', label: 'text-emerald-900' },
    red:     { cardBg: 'bg-red-50/70', cardBgHover: 'hover:bg-red-100', cardBorder: 'border-red-100', cardBorderHover: 'hover:border-red-200', label: 'text-red-900' },
    cyan:    { cardBg: 'bg-cyan-50/70', cardBgHover: 'hover:bg-cyan-100', cardBorder: 'border-cyan-100', cardBorderHover: 'hover:border-cyan-200', label: 'text-cyan-900' },
    violet:  { cardBg: 'bg-violet-50/70', cardBgHover: 'hover:bg-violet-100', cardBorder: 'border-violet-100', cardBorderHover: 'hover:border-violet-200', label: 'text-violet-900' },
    yellow:  { cardBg: 'bg-yellow-50/70', cardBgHover: 'hover:bg-yellow-100', cardBorder: 'border-yellow-100', cardBorderHover: 'hover:border-yellow-200', label: 'text-yellow-900' },
    pink:    { cardBg: 'bg-pink-50/70', cardBgHover: 'hover:bg-pink-100', cardBorder: 'border-pink-100', cardBorderHover: 'hover:border-pink-200', label: 'text-pink-900' },
  };

  const quickLinks = [
    { to: '/admin/pedidos', label: 'Pedidos', icon: '📦', bg: 'from-amber-400 to-orange-500', color: 'amber' },
    { to: '/admin/ventas', label: 'Ventas', icon: '💰', bg: 'from-purple-500 to-indigo-600', color: 'purple' },
    { to: '/admin/facturas', label: 'Facturas', icon: '🧾', bg: 'from-teal-400 to-emerald-600', color: 'teal' },
    { to: '/admin/citas', label: 'Citas', icon: '📅', bg: 'from-blue-400 to-cyan-600', color: 'blue' },
    { to: '/admin/reportes', label: 'Reportes', icon: '📊', bg: 'from-green-400 to-emerald-600', color: 'emerald' },
    { to: '/admin/pqr', label: 'PQR', icon: '📬', bg: 'from-red-400 to-rose-600', color: 'red' },
    { to: '/admin/productos', label: 'Productos', icon: '💻', bg: 'from-cyan-400 to-blue-600', color: 'cyan' },
    { to: '/admin/usuarios', label: 'Usuarios', icon: '👥', bg: 'from-violet-400 to-purple-600', color: 'violet' },
    { to: '/admin/servicios', label: 'Servicios', icon: '🔧', bg: 'from-yellow-400 to-amber-600', color: 'yellow' },
    { to: '/admin/reportes', label: 'Estadísticas', icon: '📈', bg: 'from-pink-400 to-rose-600', color: 'pink' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 rounded-full" />
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-text-heading font-bold text-lg">Cargando dashboard analítico...</p>
          <p className="text-gray-400 text-sm">Preparando estadísticas y gráficas en tiempo real</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* ===== HERO / WELCOME BANNER ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-6 md:p-10 text-white shadow-2xl">
        {/* Elementos decorativos */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-fuchsia-400/20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-300/5 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl md:text-5xl shadow-xl shrink-0 border border-white/20">
              {greeting.emoji}
            </div>
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-bold uppercase tracking-wider border border-white/20 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Panel Administrativo · Sistema Activo
              </span>
              <h1 className="text-2xl md:text-4xl font-black leading-tight">
                {greeting.text}, Administrador
              </h1>
              <p className="text-sm md:text-base text-white/85 mt-2 max-w-xl leading-relaxed">
                Aquí tienes el pulso de tu negocio. Monitorea <strong>ventas</strong>, <strong>facturación</strong>,{' '}
                <strong>inventario</strong> y la satisfacción de tus clientes en tiempo real.
              </p>
            </div>
          </div>

          {/* Selector de período */}
          <div className="shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1.5 flex items-center gap-1 border border-white/15 shadow-lg">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 px-3">
                Período
              </span>
              <button
                type="button"
                onClick={() => setPeriodoDias(7)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodoDias === 7
                    ? 'bg-white text-indigo-700 shadow-md scale-[1.02]'
                    : 'text-white/85 hover:bg-white/10'
                }`}
              >
                7 Días
              </button>
              <button
                type="button"
                onClick={() => setPeriodoDias(14)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodoDias === 14
                    ? 'bg-white text-indigo-700 shadow-md scale-[1.02]'
                    : 'text-white/85 hover:bg-white/10'
                }`}
              >
                14 Días
              </button>
            </div>
          </div>
        </div>

        {/* Mini stats en el banner */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/15">
          {[
            { label: 'Ventas hoy', value: stats.ventas_hoy, icon: '🛒', suffix: ' op.' },
            { label: 'Facturación hoy', value: formatShortCurrency(stats.facturacion_hoy), icon: '💵', suffix: '' },
            { label: 'PQR pendientes', value: stats.pqr_pendientes, icon: '📨', suffix: '' },
            { label: 'Catálogo activo', value: stats.total_productos, icon: '📦', suffix: ' prod.' },
          ].map((m) => (
            <div key={m.label} className="bg-white/8 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70">{m.label}</span>
                <span className="text-lg md:text-xl">{m.icon}</span>
              </div>
              <p className="text-xl md:text-2xl font-black tracking-tight">
                {m.value}
                <span className="text-xs font-semibold text-white/60 ml-1">{m.suffix}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== TARJETAS KPI ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {cards.map((c) => (
          <Link
            key={c.title}
            to={c.link}
            className={`group relative overflow-hidden bg-white rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-400 ease-out`}
          >
            {/* Barra superior de color */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.gradient}`} />
            {/* Glow sutil */}
            <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${c.gradient} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity duration-500`} />

            <div className="relative flex items-start justify-between">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.gradient} text-white flex items-center justify-center shadow-lg shadow-${c.glow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-400`}>
                {c.icon}
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{c.sublabel}</p>
                <p className="text-xl md:text-2xl font-black text-text-heading">{c.subval}</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total {c.title}</p>
              <p className="text-3xl md:text-4xl font-black text-text-heading mt-1 tracking-tight">{c.total}</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${c.gradient} rounded-full animate-[grow_1.5s_ease-out]`}
                    style={{ width: `${Math.min(100, (Number(c.total) / 100) * 10 || 70)}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-2">{c.subextra}</p>
            </div>

            {/* Botón de acceso sutil */}
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 group-hover:text-accent transition-colors">
                Ir al módulo
              </span>
              <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${c.gradient} text-white flex items-center justify-center shadow-sm group-hover:translate-x-1 transition-transform opacity-0 group-hover:opacity-100`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ===== CONTROLES DE FILTRADO PARA GRÁFICOS (Requerimiento 13) ===== */}
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-lg border border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h2 className="text-base md:text-lg font-black text-text-heading">Analítica y Comportamiento Comercial</h2>
            {loadingCharts && (
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-bold ml-2">
                <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Actualizando gráficos...
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Filtra el comportamiento de ventas e ingresos por períodos predefinidos o rango de fechas exacto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Presets rápidos */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl text-xs font-black">
            <button
              type="button"
              onClick={() => aplicarFiltroPreset(7, '7dias')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filtroActivo === '7dias' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              7 días
            </button>
            <button
              type="button"
              onClick={() => aplicarFiltroPreset(14, '14dias')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filtroActivo === '14dias' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              14 días
            </button>
            <button
              type="button"
              onClick={() => aplicarFiltroPreset(30, '30dias')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filtroActivo === '30dias' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              30 días
            </button>
          </div>

          {/* Selector de Rango Personalizado */}
          <form onSubmit={aplicarFiltroRangoFechas} className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-2xl px-2.5 py-1">
              <span className="text-[10px] uppercase font-bold text-gray-400">Desde:</span>
              <input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                className="bg-transparent text-xs text-gray-700 font-semibold focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-2xl px-2.5 py-1">
              <span className="text-[10px] uppercase font-bold text-gray-400">Hasta:</span>
              <input
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
                className="bg-transparent text-xs text-gray-700 font-semibold focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!filtroFechaInicio || !filtroFechaFin || loadingCharts}
              className="px-4 py-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Filtrar
            </button>
          </form>
        </div>
      </div>

      {/* ===== GRÁFICOS ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* GRÁFICO 1: VENTAS POR DÍA */}
        <div className="bg-white rounded-3xl p-6 md:p-7 shadow-lg border border-gray-100 flex flex-col justify-between overflow-hidden relative group hover:shadow-xl transition-all duration-300">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-indigo-100/50 blur-3xl pointer-events-none group-hover:bg-indigo-100/70 transition-colors duration-500" />

          <div className="relative flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
              <div>
                <h3 className="font-black text-text-heading text-lg">Ventas por día</h3>
                <p className="text-xs text-gray-400 mt-0.5">Cantidad de operaciones registradas</p>
              </div>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 text-xs font-black border border-indigo-100 shadow-sm">
              {totalVentasPeriodo} ventas · {avgVentasPorDia} avg/día
            </span>
          </div>

          <div className="relative flex items-end gap-2.5 h-60 pt-6 pb-3 px-1">
            {ventasSlice.map((item, index) => {
              const val = Number(item.valor || 0);
              const heightPct = Math.max((val / maxVentas) * 100, 4);
              return (
                <div key={`${item.fecha}-${index}`} className="flex-1 flex flex-col items-center justify-end h-full group/item relative">
                  {/* Badge con el valor sobre la barra */}
                  <span
                    className={`text-[11px] font-black mb-1.5 transition-all duration-300 ${
                      val > 0 ? 'text-indigo-700 scale-105' : 'text-gray-300'
                    } group-hover/item:-translate-y-1`}
                  >
                    {val}
                  </span>
                  {/* Barra */}
                  <div
                    className={`w-full rounded-t-2xl transition-all duration-700 ease-out relative overflow-hidden ${
                      val > 0
                        ? 'bg-gradient-to-t from-indigo-600 via-violet-500 to-fuchsia-400 shadow-md shadow-indigo-500/30 group-hover/item:brightness-110 group-hover/item:shadow-lg group-hover/item:shadow-indigo-500/40'
                        : 'bg-gray-100'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${item.label} (${item.fecha}): ${val} ventas`}
                  >
                    {val > 0 && (
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/0 to-white/30" />
                    )}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute -top-12 hidden group-hover/item:flex flex-col items-center bg-gray-900 text-white text-[11px] rounded-xl px-3 py-1.5 shadow-xl pointer-events-none z-20 whitespace-nowrap">
                    <span className="font-bold">{item.label}</span>
                    <span className="text-gray-300 text-[10px]">{item.fecha}</span>
                    <div className="absolute -bottom-1 w-2 h-2 bg-gray-900 rotate-45" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-3 px-1 border-t border-gray-50 mt-2">
            {ventasSlice.map((item, idx) => (
              <span
                key={idx}
                className="flex-1 text-center text-[11px] font-bold text-gray-500 hover:text-accent transition-colors"
                title={item.fecha}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* GRÁFICO 2: TENDENCIA DE INGRESOS */}
        <div className="bg-white rounded-3xl p-6 md:p-7 shadow-lg border border-gray-100 flex flex-col justify-between overflow-hidden relative group hover:shadow-xl transition-all duration-300">
          <div className="absolute -bottom-24 -left-20 w-64 h-64 rounded-full bg-emerald-100/50 blur-3xl pointer-events-none group-hover:bg-emerald-100/70 transition-colors duration-500" />

          <div className="relative flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-black text-text-heading text-lg">Tendencia de ingresos</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {modoIngreso === 'diarios' ? 'Facturación recaudada por día' : 'Recaudación financiera acumulada'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-2xl text-xs font-black shadow-inner">
              <button
                type="button"
                onClick={() => setModoIngreso('diarios')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  modoIngreso === 'diarios'
                    ? 'bg-white text-emerald-700 shadow-md scale-[1.03]'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                Por día
              </button>
              <button
                type="button"
                onClick={() => setModoIngreso('acumulados')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  modoIngreso === 'acumulados'
                    ? 'bg-white text-emerald-700 shadow-md scale-[1.03]'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                Acumulado
              </button>
            </div>
          </div>

          {/* Gráfico SVG con curva */}
          <div className="relative h-60 pt-3 pb-3 px-1">
            <svg viewBox="0 0 320 180" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="ingresosGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineaGradiente" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <filter id="glowPuntos" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid de fondo */}
              <line x1="10" y1="160" x2="310" y2="160" stroke="#f1f5f9" strokeWidth="1.5" />
              <line x1="10" y1="120" x2="310" y2="120" stroke="#f8fafc" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="10" y1="80" x2="310" y2="80" stroke="#f8fafc" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="10" y1="40" x2="310" y2="40" stroke="#f8fafc" strokeWidth="1" strokeDasharray="3 3" />

              {ingresosSlice.length > 0 && (() => {
                const count = ingresosSlice.length;
                const points = ingresosSlice.map((item, index) => {
                  const x = (index / Math.max(count - 1, 1)) * 300 + 10;
                  const val = Number(item.valor || 0);
                  const y = 160 - (val / maxIngresos) * 135;
                  return { x, y, val, label: item.label, fecha: item.fecha };
                });

                const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
                const polygonPoints = `10,160 ${polylinePoints} ${points[points.length - 1].x},160`;

                return (
                  <>
                    {/* Área sombreada */}
                    <polygon points={polygonPoints} fill="url(#ingresosGrad)" />

                    {/* Curva principal */}
                    <polyline
                      fill="none"
                      stroke="url(#lineaGradiente)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={polylinePoints}
                      className="drop-shadow-md"
                    />

                    {/* Puntos interactivos */}
                    {points.map((p, idx) => (
                      <g key={idx} className="cursor-pointer">
                        {p.val > 0 && (
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="10"
                            fill="#10b981"
                            opacity="0.12"
                            className="transition-all hover:opacity-25"
                          />
                        )}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={p.val > 0 ? '5.5' : '3.5'}
                          fill={p.val > 0 ? '#059669' : '#cbd5e1'}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          filter={p.val > 0 ? 'url(#glowPuntos)' : undefined}
                          className="transition-all hover:r-[8]"
                        />
                        {p.val > 0 && (
                          <text
                            x={p.x}
                            y={Math.max(p.y - 10, 14)}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="bold"
                            fill="#065f46"
                          >
                            {formatShortCurrency(p.val)}
                          </text>
                        )}
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>

          <div className="flex justify-between pt-3 px-1 border-t border-gray-50 mt-2">
            {ingresosSlice.map((item, idx) => (
              <span
                key={idx}
                className="flex-1 text-center text-[11px] font-bold text-gray-500 hover:text-emerald-600 transition-colors"
                title={item.fecha}
              >
                {item.label}
              </span>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
            <span className="text-gray-400 font-medium">
              Total período: <strong className="text-emerald-600 font-black text-sm">{formatCurrency(totalPeriodoIngresos)}</strong>
            </span>
            <span className="text-gray-400 font-medium">
              Pico máximo: <strong className="text-slate-800 font-black text-sm">{formatCurrency(maxIngresos)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ===== MÓDULOS COMERCIALES ===== */}
      <div className="bg-white rounded-3xl p-6 md:p-7 shadow-lg border border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="font-black text-text-heading text-xl flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center shadow-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1"></rect>
              </svg>
            </span>
            Módulos Comerciales y Gestión
          </h3>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Accesos directos · {quickLinks.length} módulos
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
          {quickLinks.map((item) => {
            const cls = colorClassMap[item.color];
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl ${cls.cardBg} ${cls.cardBgHover} border ${cls.cardBorder} ${cls.cardBorderHover} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.bg} text-white flex items-center justify-center text-2xl shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  {item.icon}
                </div>
                <span className={`text-xs font-black ${cls.label} text-center leading-tight`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
