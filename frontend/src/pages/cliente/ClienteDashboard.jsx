import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../context/CartContext';
import { getProductImage } from '../../utils/productImages';
import PerfilUsuario from '../../components/PerfilUsuario';
import api from '../../services/api';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Buenos días', emoji: '🌅' };
  if (h < 19) return { text: 'Buenas tardes', emoji: '☀️' };
  return { text: 'Buenas noches', emoji: '🌙' };
};

const getBadgePedido = (estado) => {
  switch (estado) {
    case 'en revision':
      return {
        clase: 'bg-amber-100 text-amber-800 border-amber-200',
        texto: 'En revisión',
        icono: '⏳',
        desc: 'Tu orden está siendo validada por nuestro equipo.',
        progreso: 33,
        colorBarra: 'bg-amber-500',
        stepColors: ['text-amber-700', 'text-gray-400', 'text-gray-400'],
      };
    case 'revisado':
      return {
        clase: 'bg-blue-100 text-blue-800 border-blue-200',
        texto: 'Revisado',
        icono: '🔍',
        desc: 'Pedido verificado y preparado para despacho.',
        progreso: 66,
        colorBarra: 'bg-blue-600',
        stepColors: ['text-emerald-600', 'text-blue-700', 'text-gray-400'],
      };
    case 'hecho':
      return {
        clase: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        texto: 'Hecho',
        icono: '✅',
        desc: '¡Pedido completado y entregado exitosamente!',
        progreso: 100,
        colorBarra: 'bg-emerald-500',
        stepColors: ['text-emerald-600', 'text-emerald-600', 'text-emerald-700'],
      };
    case 'cancelado':
      return {
        clase: 'bg-red-100 text-red-800 border-red-200',
        texto: 'Cancelado',
        icono: '❌',
        desc: 'Orden cancelada.',
        progreso: 0,
        colorBarra: 'bg-red-500',
        stepColors: ['text-red-500', 'text-red-500', 'text-red-500'],
      };
    default:
      return {
        clase: 'bg-gray-100 text-gray-800 border-gray-200',
        texto: estado,
        icono: '📦',
        desc: '',
        progreso: 0,
        colorBarra: 'bg-gray-400',
        stepColors: ['text-gray-400', 'text-gray-400', 'text-gray-400'],
      };
  }
};

const getBadgeCita = (estado) => {
  switch (estado) {
    case 'en revision':
      return {
        clase: 'bg-amber-100 text-amber-800 border-amber-200',
        texto: 'En revisión',
        icono: '⏳',
      };
    case 'revisado':
      return {
        clase: 'bg-blue-100 text-blue-800 border-blue-200',
        texto: 'Programada',
        icono: '📅',
      };
    case 'hecho':
      return {
        clase: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        texto: 'Completada',
        icono: '✅',
      };
    case 'cancelado':
      return {
        clase: 'bg-red-100 text-red-800 border-red-200',
        texto: 'Cancelada',
        icono: '❌',
      };
    default:
      return {
        clase: 'bg-gray-100 text-gray-800 border-gray-200',
        texto: estado,
        icono: '🔧',
      };
  }
};

function ClienteDashboard() {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [pqrStats, setPqrStats] = useState({ total: 0, pendientes: 0 });
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState('pedidos');
  const [mensajeReciente, setMensajeReciente] = useState(null);
  const greeting = getGreeting();

  useEffect(() => {
    try {
      const reciente = sessionStorage.getItem('mitienda_pedido_reciente');
      if (reciente) {
        setMensajeReciente(JSON.parse(reciente));
        sessionStorage.removeItem('mitienda_pedido_reciente');
      }
    } catch {}

    const cargarDatos = async () => {
      try {
        setCargando(true);
        const [resPedidos, resCitas, resStats] = await Promise.allSettled([
          api.get('/pedidos/mis-pedidos'),
          api.get('/citas/mis-citas'),
          api.get('/dashboard/stats'),
        ]);

        if (resPedidos.status === 'fulfilled' && resPedidos.value?.data?.ok) {
          setPedidos(resPedidos.value.data.pedidos || []);
        }
        if (resCitas.status === 'fulfilled' && resCitas.value?.data?.ok) {
          setCitas(resCitas.value.data.citas || []);
        }
        if (resStats.status === 'fulfilled' && resStats.value?.data?.ok) {
          const st = resStats.value.data.stats || {};
          setPqrStats({
            total: st.pqr_radicadas || 0,
            pendientes: st.pqr_pendientes || 0,
          });
        }
      } catch (err) {
        console.error('Error cargando datos del cliente:', err);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const totalGastado = useMemo(() => {
    return pedidos
      .filter((p) => p.estado !== 'cancelado')
      .reduce((acc, p) => acc + Number(p.total || 0), 0);
  }, [pedidos]);

  const pedidosCompletados = useMemo(
    () => pedidos.filter((p) => p.estado === 'hecho').length,
    [pedidos]
  );

  const citasPendientes = useMemo(
    () => citas.filter((c) => c.estado !== 'hecho' && c.estado !== 'cancelado').length,
    [citas]
  );

  return (
    <div className="space-y-6 pb-4">
      {mensajeReciente && (
        <div className="relative overflow-hidden bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-5 md:p-6 shadow-xl flex items-start justify-between gap-4 animate-fadeIn">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-xl shadow-emerald-500/40">
              ✓
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-200/60 text-emerald-800 text-[11px] font-black uppercase tracking-wider mb-2">
                🎉 ¡Confirmación de Compra!
              </span>
              <h2 className="text-lg md:text-xl font-black text-emerald-950">
                Tu pedido #{mensajeReciente.id} se realizó correctamente
              </h2>
              <p className="text-xs sm:text-sm text-emerald-800/80 mt-1.5 leading-relaxed">
                Hemos recibido tu orden por un valor de{' '}
                <strong className="text-emerald-900">{formatPrice(mensajeReciente.total)}</strong>. Ya
                está registrada aquí en tu panel con estado{' '}
                <span className="font-bold underline">En revisión</span> y puedes consultar todos sus detalles.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMensajeReciente(null)}
            className="relative w-9 h-9 rounded-xl bg-white/80 border border-emerald-200 text-emerald-700 hover:bg-white flex items-center justify-center text-sm font-black shrink-0 transition-colors shadow-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* ===== BANNER DE BIENVENIDA ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-teal-300/20 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl md:text-4xl font-black shadow-xl shrink-0 border-2 border-white/30">
                {(user?.nombre || 'C').charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 text-white text-xs flex items-center justify-center shadow-lg border-2 border-white">
                {greeting.emoji}
              </span>
            </div>
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-black uppercase tracking-wider border border-white/20 mb-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Panel de Cliente
              </span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black leading-tight">
                {greeting.text}, {user?.nombre || 'Cliente'}
              </h1>
              <p className="text-sm md:text-base text-white/85 mt-1.5 max-w-xl leading-relaxed">
                Consulta tus <strong>pedidos</strong> y <strong>servicios técnicos</strong> con su
                estado en tiempo real.
              </p>
            </div>
          </div>

          <Link
            to="/productos"
            className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-emerald-700 font-black text-sm shadow-xl hover:bg-emerald-50 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 shrink-0"
          >
            <span className="text-lg">🛒</span>
            Nueva compra
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      </div>

      {/* ===== TARJETAS RESUMEN (Requerimiento 12) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <button
          type="button"
          onClick={() => setTabActiva('pedidos')}
          className={`group relative overflow-hidden text-left p-6 rounded-3xl shadow-lg border transition-all duration-300 active:scale-[0.98] cursor-pointer ${
            tabActiva === 'pedidos'
              ? 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 text-white border-transparent shadow-xl shadow-purple-500/30 scale-[1.02]'
              : 'bg-white border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:border-purple-200'
          }`}
        >
          {tabActiva === 'pedidos' && (
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          )}
          <div className="relative flex items-center justify-between mb-3">
            <span className={`text-[11px] font-black uppercase tracking-wider ${tabActiva === 'pedidos' ? 'text-white/80' : 'text-gray-400'}`}>
              Mis Pedidos
            </span>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3 ${tabActiva === 'pedidos' ? 'bg-white/25 text-white' : 'bg-purple-100 text-purple-600'}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
          </div>
          <p className={`text-3xl md:text-4xl font-black tracking-tight ${tabActiva === 'pedidos' ? 'text-white' : 'text-text-heading'}`}>
            {pedidos.length}
          </p>
          <div className={`mt-3 flex items-center gap-2 ${tabActiva === 'pedidos' ? 'text-white/85' : 'text-gray-500'}`}>
            <span className="text-xs font-semibold truncate">
              <strong className={tabActiva === 'pedidos' ? 'text-white' : 'text-emerald-600'}>
                {pedidosCompletados}
              </strong>{' '}
              hechos · {formatPrice(totalGastado)}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('citas')}
          className={`group relative overflow-hidden text-left p-6 rounded-3xl shadow-lg border transition-all duration-300 active:scale-[0.98] cursor-pointer ${
            tabActiva === 'citas'
              ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white border-transparent shadow-xl shadow-emerald-500/30 scale-[1.02]'
              : 'bg-white border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200'
          }`}
        >
          {tabActiva === 'citas' && (
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          )}
          <div className="relative flex items-center justify-between mb-3">
            <span className={`text-[11px] font-black uppercase tracking-wider ${tabActiva === 'citas' ? 'text-white/80' : 'text-gray-400'}`}>
              Servicios Técnicos
            </span>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3 ${tabActiva === 'citas' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>
          <p className={`text-3xl md:text-4xl font-black tracking-tight ${tabActiva === 'citas' ? 'text-white' : 'text-text-heading'}`}>
            {citas.length}
          </p>
          <div className={`mt-3 flex items-center gap-2 ${tabActiva === 'citas' ? 'text-white/85' : 'text-gray-500'}`}>
            {citasPendientes > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black border border-amber-200">
                ⏳ {citasPendientes} pendiente{citasPendientes !== 1 && 's'}
              </span>
            ) : (
              <span className="text-xs font-semibold">
                {citas.length === 0 ? 'Programa tu cita' : 'Todo al día ✓'}
              </span>
            )}
          </div>
        </button>

        {/* Card 3: PQR del Cliente */}
        <Link
          to="/cliente/pqr"
          className="group relative overflow-hidden p-6 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-rose-200 transition-all duration-300 flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                Mis PQR & Soporte
              </span>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3">
                📬
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-black tracking-tight text-text-heading">
              {pqrStats.total}
            </p>
            <div className="mt-2">
              {pqrStats.pendientes > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  ⏳ {pqrStats.pendientes} en revisión
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-600">
                  {pqrStats.total === 0 ? 'Sin solicitudes' : 'Todo al día ✓'}
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[11px] font-black text-rose-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              Ver solicitudes
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </Link>

        {/* Card 4: Perfil */}
        <Link
          to="/cliente/perfil"
          className="group relative overflow-hidden p-6 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
              Mi Perfil
            </span>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-black text-text-heading truncate">{user?.nombre || 'Usuario'}</p>
            <p className="text-xs font-semibold text-gray-400 truncate">{user?.email}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[11px] font-black text-blue-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              Editar perfil
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </Link>
      </div>

      {/* ===== TABS ===== */}
      <div className="bg-white rounded-3xl p-2 shadow-lg border border-gray-100 inline-flex gap-1">
        <button
          type="button"
          onClick={() => setTabActiva('pedidos')}
          className={`px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 transition-all duration-300 cursor-pointer ${
            tabActiva === 'pedidos'
              ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-purple-500/25 scale-[1.02]'
              : 'text-gray-500 hover:text-text-heading hover:bg-gray-50'
          }`}
        >
          <span>📦</span>
          Mis Pedidos
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${tabActiva === 'pedidos' ? 'bg-white/25 text-white' : 'bg-gray-100'}`}>
            {pedidos.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('citas')}
          className={`px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 transition-all duration-300 cursor-pointer ${
            tabActiva === 'citas'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 scale-[1.02]'
              : 'text-gray-500 hover:text-text-heading hover:bg-gray-50'
          }`}
        >
          <span>🔧</span>
          Mis Servicios
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${tabActiva === 'citas' ? 'bg-white/25 text-white' : 'bg-gray-100'}`}>
            {citas.length}
          </span>
        </button>
      </div>

      {/* ===== TAB PEDIDOS ===== */}
      {tabActiva === 'pedidos' && (
        <div className="space-y-4 animate-fadeIn">
          {cargando ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-lg">
              <div className="relative inline-block">
                <div className="w-12 h-12 border-4 border-purple-200 rounded-full" />
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
              </div>
              <p className="text-gray-500 text-sm font-medium mt-4">Consultando tus pedidos...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 md:p-14 text-center border border-gray-100 shadow-xl overflow-hidden relative">
              <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-purple-100/60 blur-3xl" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-50 to-violet-100 text-purple-500 mx-auto flex items-center justify-center shadow-inner mb-5">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <div className="relative space-y-2">
                <h3 className="text-xl md:text-2xl font-black text-text-heading">
                  Aún no has realizado pedidos
                </h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                  Explora nuestro catálogo con los mejores productos tecnológicos y realiza tu primera compra.
                </p>
              </div>
              <div className="relative mt-7">
                <Link
                  to="/productos"
                  className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 text-white font-black text-sm shadow-xl shadow-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/50 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span className="text-lg">🛍️</span>
                  Explorar catálogo de productos
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {pedidos.map((pedido) => {
                const infoEstado = getBadgePedido(pedido.estado);
                const fecha = new Date(pedido.created_at).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={pedido.id}
                    className="group relative bg-white rounded-3xl p-6 md:p-7 shadow-lg border border-gray-100 space-y-5 hover:shadow-2xl hover:border-gray-200 transition-all duration-300 overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${infoEstado.colorBarra}`} />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 font-black">
                            <span className="text-sm">📦</span>
                            Pedido #{pedido.id}
                          </span>
                          <span className="text-xs font-semibold text-gray-400">🗓️ {fecha}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          📍 Envío a:{' '}
                          <span className="font-bold text-text-heading">
                            {pedido.direccion_envio} ({pedido.ciudad || 'Bogotá'})
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-col items-start sm:items-end">
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black border shadow-md ${infoEstado.clase}`}
                        >
                          <span className="text-base">{infoEstado.icono}</span>
                          <span>Estado: {infoEstado.texto}</span>
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1.5 max-w-xs text-right">
                          {infoEstado.desc}
                        </span>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="py-2">
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-black mb-2.5">
                        {['1. En revisión', '2. Revisado', '3. Entregado'].map((step, idx) => (
                          <span key={step} className={infoEstado.stepColors[idx]}>
                            {step}
                          </span>
                        ))}
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out relative ${infoEstado.colorBarra}`}
                          style={{ width: `${infoEstado.progreso}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                        </div>
                      </div>
                    </div>

                    {/* Productos */}
                    <div className="bg-gray-50/70 rounded-2xl p-4 md:p-5 border border-gray-100">
                      <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gray-400 mb-4">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6"></line>
                          <line x1="8" y1="12" x2="21" y2="12"></line>
                          <line x1="8" y1="18" x2="21" y2="18"></line>
                          <line x1="3" y1="6" x2="3.01" y2="6"></line>
                          <line x1="3" y1="12" x2="3.01" y2="12"></line>
                          <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                        Artículos comprados ({pedido.items?.length || 0})
                      </h4>
                      <div className="space-y-2.5">
                        {pedido.items && pedido.items.length > 0 ? (
                          pedido.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                                  <img
                                    src={getProductImage(it)}
                                    alt={it.nombre_producto}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-black text-text-heading truncate">{it.nombre_producto}</p>
                                  <p className="text-gray-400 font-semibold">
                                    {it.cantidad} × {formatPrice(it.precio_unitario)}
                                  </p>
                                </div>
                              </div>
                              <span className="font-black text-accent shrink-0 ml-3">
                                {formatPrice(it.subtotal)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic">Productos del pedido</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 border-t border-gray-100">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>💳</span>
                          <span className="font-semibold">
                            Método de Pago:{' '}
                            <span className="capitalize font-black text-text-heading">
                              {pedido.metodo_pago?.replace('_', ' ')}
                            </span>
                          </span>
                        </div>
                        {pedido.numero_factura && (
                          <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold">
                            <span>🧾</span>
                            <span>Factura Oficial:</span>
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 font-black">
                              {pedido.numero_factura}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                            Total de la orden
                          </span>
                          <span className="text-2xl md:text-3xl font-black bg-gradient-to-r from-accent to-purple-600 bg-clip-text text-transparent">
                            {formatPrice(pedido.total)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const baseUrl =
                              import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
                            const token =
                              localStorage.getItem('mitienda_token') ||
                              sessionStorage.getItem('mitienda_token') ||
                              '';
                            const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
                            window.open(
                              `${baseUrl}/facturas/pedido/${pedido.id}/pdf${tokenParam}`,
                              '_blank'
                            );
                          }}
                          className="group inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 hover:from-indigo-600 hover:via-violet-600 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-[0.97] transition-all duration-300"
                          title="Descargar Factura Comercial en PDF"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-y-0.5 transition-transform">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Factura PDF
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB CITAS ===== */}
      {tabActiva === 'citas' && (
        <div className="space-y-4 animate-fadeIn">
          {cargando ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-lg">
              <div className="relative inline-block">
                <div className="w-12 h-12 border-4 border-emerald-200 rounded-full" />
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
              </div>
              <p className="text-gray-500 text-sm font-medium mt-4">Cargando servicios solicitados...</p>
            </div>
          ) : citas.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 md:p-14 text-center border border-gray-100 shadow-xl overflow-hidden relative">
              <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-100/60 blur-3xl" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-500 mx-auto flex items-center justify-center shadow-inner mb-5">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.121 2.121 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </div>
              <div className="relative space-y-2">
                <h3 className="text-xl md:text-2xl font-black text-text-heading">
                  No tienes servicios agendados
                </h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                  Si tu equipo necesita mantenimiento, reparación o asesoría técnica, agenda una cita con nosotros.
                </p>
              </div>
              <div className="relative mt-7">
                <Link
                  to="/servicios"
                  className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white font-black text-sm shadow-xl shadow-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span className="text-lg">🔧</span>
                  Ver servicios técnicos
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {citas.map((cita) => {
                const infoEstado = getBadgeCita(cita.estado);
                return (
                  <div
                    key={cita.id}
                    className="group bg-white rounded-3xl p-6 shadow-lg border border-gray-100 space-y-4 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 text-[11px] font-black uppercase tracking-wider">
                            🔧 Cita #{cita.id}
                          </span>
                          <h3 className="text-lg font-black text-text-heading mt-2 leading-snug">
                            {cita.servicio_nombre}
                          </h3>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[11px] font-black border shadow-sm shrink-0 ${infoEstado.clase}`}
                        >
                          <span className="text-sm">{infoEstado.icono}</span>
                          <span className="capitalize">{infoEstado.texto}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-emerald-50/40 border border-gray-100 text-xs mt-4">
                        <div className="space-y-0.5">
                          <span className="text-gray-400 font-black text-[10px] uppercase tracking-wider block">
                            Fecha
                          </span>
                          <span className="font-black text-text-heading text-sm">{cita.fecha_cita}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-gray-400 font-black text-[10px] uppercase tracking-wider block">
                            Hora
                          </span>
                          <span className="font-black text-text-heading text-sm">{cita.hora_cita}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-gray-400 font-black text-[10px] uppercase tracking-wider block">
                            Inversión
                          </span>
                          <span className="font-black text-emerald-600 text-sm">
                            {formatPrice(cita.servicio_precio)}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-gray-400 font-black text-[10px] uppercase tracking-wider block">
                            Duración
                          </span>
                          <span className="font-bold text-gray-700 text-sm">
                            {cita.servicio_duracion || '1-2 hrs'}
                          </span>
                        </div>
                      </div>

                      {cita.notas && (
                        <div className="mt-4 p-4 rounded-2xl bg-white border border-gray-100 text-xs text-gray-600 shadow-inner">
                          <span className="font-black text-gray-700 text-[11px] uppercase tracking-wider block mb-1.5">
                            📝 Observaciones
                          </span>
                          <p className="leading-relaxed">{cita.notas}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 font-semibold">
                      <span>📞 {cita.cliente_telefono}</span>
                      <span className="text-emerald-600 font-black">Soporte MiTienda ✓</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClientePerfil() {
  return <PerfilUsuario backLink="/cliente/dashboard" backLabel="← Volver al dashboard" />;
}

function ClienteCompras() {
  return <ClienteDashboard />;
}

export { ClienteDashboard, ClientePerfil, ClienteCompras };
export default ClienteDashboard;
