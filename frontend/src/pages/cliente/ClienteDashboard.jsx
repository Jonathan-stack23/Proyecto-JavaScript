import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../context/CartContext';
import { getProductImage } from '../../utils/productImages';
import PerfilUsuario from '../../components/PerfilUsuario';
import api from '../../services/api';

function ClienteDashboard() {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState('pedidos');
  const [mensajeReciente, setMensajeReciente] = useState(null);

  useEffect(() => {
    // Detectar si recién se realizó un pedido
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
        const [resPedidos, resCitas] = await Promise.allSettled([
          api.get('/pedidos/mis-pedidos'),
          api.get('/citas/mis-citas'),
        ]);

        if (resPedidos.status === 'fulfilled' && resPedidos.value?.data?.ok) {
          setPedidos(resPedidos.value.data.pedidos || []);
        }
        if (resCitas.status === 'fulfilled' && resCitas.value?.data?.ok) {
          setCitas(resCitas.value.data.citas || []);
        }
      } catch (err) {
        console.error('Error cargando datos del cliente:', err);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const getBadgePedido = (estado) => {
    switch (estado) {
      case 'en revision':
        return {
          clase: 'bg-amber-100 text-amber-800 border-amber-200',
          texto: 'En revisión',
          icono: '⏳',
          desc: 'Tu orden está siendo validada por nuestro equipo técnico y administrativo.',
        };
      case 'revisado':
        return {
          clase: 'bg-blue-100 text-blue-800 border-blue-200',
          texto: 'Revisado',
          icono: '🔍',
          desc: 'Pedido verificado y preparado para despacho.',
        };
      case 'hecho':
        return {
          clase: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          texto: 'Hecho',
          icono: '✅',
          desc: '¡Pedido completado y entregado exitosamente!',
        };
      case 'cancelado':
        return {
          clase: 'bg-red-100 text-red-800 border-red-200',
          texto: 'Cancelado',
          icono: '❌',
          desc: 'Orden cancelada.',
        };
      default:
        return {
          clase: 'bg-gray-100 text-gray-800 border-gray-200',
          texto: estado,
          icono: '📦',
          desc: '',
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
          texto: 'Revisado',
          icono: '📅',
        };
      case 'hecho':
        return {
          clase: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          texto: 'Hecho',
          icono: '✅',
        };
      case 'cancelado':
        return {
          clase: 'bg-red-100 text-red-800 border-red-200',
          texto: 'Cancelado',
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

  return (
    <div className="space-y-6">
      {/* MENSAJE DESTACADO: PEDIDO REALIZADO CORRECTAMENTE */}
      {mensajeReciente && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-5 md:p-6 shadow-custom-md flex items-start justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-md">
              ✓
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                ¡Confirmación de Compra!
              </span>
              <h2 className="text-lg md:text-xl font-extrabold text-emerald-950 mt-0.5">
                Tu pedido #{mensajeReciente.id} se realizó correctamente
              </h2>
              <p className="text-xs sm:text-sm text-emerald-800 mt-1 leading-relaxed">
                Hemos recibido tu orden por un valor de <strong>{formatPrice(mensajeReciente.total)}</strong>. Ya está registrada aquí en tu panel con estado <span className="font-bold underline">En revisión</span> y puedes consultar todos sus detalles abajo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMensajeReciente(null)}
            className="w-8 h-8 rounded-full bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center text-sm font-bold shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl p-6 md:p-8 text-white shadow-custom-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold shadow-md">
              {(user?.nombre || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Panel de Cliente
              </span>
              <h1 className="text-2xl md:text-3xl font-bold">¡Hola, {user?.nombre || 'Cliente'}!</h1>
              <p className="text-sm text-white/80 mt-0.5">
                Aquí puedes consultar tus pedidos y servicios técnicos solicitados con su estado en tiempo real.
              </p>
            </div>
          </div>

          <Link
            to="/productos"
            className="px-5 py-2.5 rounded-xl bg-white text-emerald-700 font-bold text-xs shadow-md hover:bg-emerald-50 transition-colors"
          >
            + Nueva compra
          </Link>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <button
          type="button"
          onClick={() => setTabActiva('pedidos')}
          className={`text-left p-6 rounded-2xl shadow-custom-sm border transition-all duration-200 cursor-pointer ${
            tabActiva === 'pedidos'
              ? 'bg-white border-accent ring-2 ring-accent/20 shadow-md'
              : 'bg-white border-gray-100 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Mis Pedidos</span>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-text-heading">{pedidos.length}</p>
          <p className="text-xs text-gray-500 mt-1">Compras registradas en tu cuenta</p>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('citas')}
          className={`text-left p-6 rounded-2xl shadow-custom-sm border transition-all duration-200 cursor-pointer ${
            tabActiva === 'citas'
              ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'bg-white border-gray-100 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Servicios Agendados</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-text-heading">{citas.length}</p>
          <p className="text-xs text-gray-500 mt-1">Citas técnicas programadas</p>
        </button>

        <Link
          to="/cliente/perfil"
          className="p-6 rounded-2xl bg-white border border-gray-100 shadow-custom-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Mi Perfil</span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-text-heading truncate">{user?.email}</p>
            <p className="text-xs text-accent mt-0.5 font-semibold">Editar datos de contacto →</p>
          </div>
        </Link>
      </div>

      {/* Selector de pestañas */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          type="button"
          onClick={() => setTabActiva('pedidos')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            tabActiva === 'pedidos'
              ? 'border-accent text-accent'
              : 'border-transparent text-gray-500 hover:text-text-heading'
          }`}
        >
          <span>📦 Mis Pedidos</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 font-bold">{pedidos.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('citas')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            tabActiva === 'citas'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-text-heading'
          }`}
        >
          <span>🔧 Mis Servicios Solicitados</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 font-bold">{citas.length}</span>
        </button>
      </div>

      {/* TAB PEDIDOS */}
      {tabActiva === 'pedidos' && (
        <div className="space-y-4 animate-fadeIn">
          {cargando ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Consultando tus pedidos...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-heading">Aún no has realizado pedidos</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Agrega productos desde nuestro catálogo y podrás ver el progreso de entrega aquí.
                </p>
              </div>
              <Link
                to="/productos"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-md hover:bg-accent-dark transition-all"
              >
                Explorar catálogo de productos
              </Link>
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
                    className="bg-white rounded-3xl p-6 shadow-custom-md border border-gray-100 space-y-4 hover:shadow-custom-lg transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-accent text-lg">Pedido #{pedido.id}</span>
                          <span className="text-xs text-gray-400">({fecha})</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Envío a: <span className="font-medium text-text-heading">{pedido.direccion_envio} ({pedido.ciudad || 'Bogotá'})</span>
                        </p>
                      </div>

                      <div className="flex flex-col items-start sm:items-end">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border shadow-sm ${infoEstado.clase}`}
                        >
                          <span>{infoEstado.icono}</span>
                          <span>Estado: {infoEstado.texto}</span>
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1">{infoEstado.desc}</span>
                      </div>
                    </div>

                    {/* Barra de progreso de estado */}
                    <div className="py-2">
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold mb-1">
                        <span className={pedido.estado === 'en revision' ? 'text-amber-700' : 'text-gray-400'}>
                          1. En revisión
                        </span>
                        <span className={pedido.estado === 'revisado' ? 'text-blue-700' : 'text-gray-400'}>
                          2. Revisado
                        </span>
                        <span className={pedido.estado === 'hecho' ? 'text-emerald-700' : 'text-gray-400'}>
                          3. Hecho
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            pedido.estado === 'en revision'
                              ? 'w-1/3 bg-amber-500'
                              : pedido.estado === 'revisado'
                              ? 'w-2/3 bg-blue-600'
                              : pedido.estado === 'hecho'
                              ? 'w-full bg-emerald-500'
                              : 'w-0 bg-gray-300'
                          }`}
                        ></div>
                      </div>
                    </div>

                    {/* Productos dentro del pedido */}
                    <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Artículos comprados ({pedido.items?.length || 0})
                      </h4>
                      <div className="space-y-3">
                        {pedido.items && pedido.items.length > 0 ? (
                          pedido.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                                  <img
                                    src={getProductImage(it)}
                                    alt={it.nombre_producto}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div>
                                  <p className="font-bold text-text-heading">{it.nombre_producto}</p>
                                  <p className="text-gray-400">
                                    {it.cantidad} unidad(es) × {formatPrice(it.precio_unitario)}
                                  </p>
                                </div>
                              </div>
                              <span className="font-extrabold text-accent">{formatPrice(it.subtotal)}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400">Productos del pedido</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                      <div className="text-xs text-gray-500">
                        Método de Pago:{' '}
                        <span className="font-bold text-text-heading capitalize">
                          {pedido.metodo_pago?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">Total de la orden:</span>
                        <span className="text-xl font-black text-accent">{formatPrice(pedido.total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CITAS */}
      {tabActiva === 'citas' && (
        <div className="space-y-4 animate-fadeIn">
          {cargando ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Cargando servicios solicitados...</p>
            </div>
          ) : citas.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-heading">No tienes servicios agendados</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Si tu equipo necesita mantenimiento o reparación, agenda una cita con nuestros técnicos.
                </p>
              </div>
              <Link
                to="/servicios"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition-all"
              >
                Ver servicios técnicos disponibles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {citas.map((cita) => {
                const infoEstado = getBadgeCita(cita.estado);
                return (
                  <div
                    key={cita.id}
                    className="bg-white rounded-3xl p-6 shadow-custom-md border border-gray-100 space-y-4 hover:shadow-custom-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                            Cita #{cita.id}
                          </span>
                          <h3 className="text-lg font-bold text-text-heading">{cita.servicio_nombre}</h3>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${infoEstado.clase}`}
                        >
                          <span>{infoEstado.icono}</span>
                          <span className="capitalize">{infoEstado.texto}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs mt-3">
                        <div>
                          <span className="text-gray-400 block">Fecha asignada:</span>
                          <span className="font-bold text-text-heading">{cita.fecha_cita}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Hora:</span>
                          <span className="font-bold text-text-heading">{cita.hora_cita}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Precio:</span>
                          <span className="font-bold text-emerald-600">{formatPrice(cita.servicio_precio)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Duración:</span>
                          <span className="font-semibold text-gray-700">{cita.servicio_duracion || '1-2 hrs'}</span>
                        </div>
                      </div>

                      {cita.notas && (
                        <div className="mt-3 p-3 bg-white rounded-xl border border-gray-100 text-xs text-gray-500">
                          <span className="font-semibold text-gray-700 block mb-0.5">Observaciones:</span>
                          {cita.notas}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                      <span>Contacto: {cita.cliente_telefono}</span>
                      <span>Soporte MiTienda</span>
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
