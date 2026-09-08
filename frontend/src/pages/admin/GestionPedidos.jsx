import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatPrice } from '../../context/CartContext';

const ESTADOS_DISPONIBLES = [
  { value: 'en revision', label: 'En revisión', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'revisado', label: 'Revisado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'hecho', label: 'Hecho', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
];

export default function GestionPedidos({ titulo = 'Gestión de Pedidos' }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pedidoModal, setPedidoModal] = useState(null);
  const [actualizandoId, setActualizandoId] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      setError(null);
      const res = await api.get('/pedidos', {
        params: {
          estado: filtroEstado !== 'todos' ? filtroEstado : undefined,
          q: busqueda || undefined,
        },
      });
      if (res.data?.ok) {
        setPedidos(res.data.pedidos || []);
      }
    } catch (err) {
      console.error('Error cargando pedidos:', err);
      setError('No se pudieron cargar los pedidos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, [filtroEstado]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarPedidos();
  };

  const handleCambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      setActualizandoId(pedidoId);
      const res = await api.patch(`/pedidos/${pedidoId}/estado`, { estado: nuevoEstado });
      if (res.data?.ok) {
        setPedidos((prev) =>
          prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
        );
        setMensajeExito(`Pedido #${pedidoId} actualizado a "${nuevoEstado}".`);
        setTimeout(() => setMensajeExito(null), 3000);
      }
    } catch (err) {
      console.error('Error cambiando estado del pedido:', err);
      alert('Error al actualizar estado del pedido.');
    } finally {
      setActualizandoId(null);
    }
  };

  const getBadgeStyle = (estado) => {
    switch (estado) {
      case 'en revision':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'revisado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hecho':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">{titulo}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Supervisa las compras de clientes y actualiza su estado (En revisión, Revisado, Hecho).
          </p>
        </div>
        <button
          onClick={cargarPedidos}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Actualizar lista
        </button>
      </div>

      {mensajeExito && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {mensajeExito}
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-custom-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Filtros de estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroEstado === 'todos'
                ? 'bg-accent text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({pedidos.length})
          </button>
          {ESTADOS_DISPONIBLES.map((est) => (
            <button
              key={est.value}
              onClick={() => setFiltroEstado(est.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filtroEstado === est.value
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {est.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <form onSubmit={handleBuscar} className="flex gap-2 w-full md:w-72">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por ID, cliente o correo..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent-light outline-none"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-dark transition-colors shrink-0"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Listado de Pedidos */}
      {cargando ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
          <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Cargando pedidos registrados...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-center text-sm">
          {error}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <h3 className="font-bold text-text-heading text-base">No hay pedidos para mostrar</h3>
          <p className="text-gray-400 text-xs mt-1">
            {filtroEstado !== 'todos' ? `No se encontraron pedidos con estado "${filtroEstado}".` : 'Aún no se han generado órdenes de compra.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-custom-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-xs text-gray-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Orden</th>
                  <th className="px-6 py-4">Cliente / Contacto</th>
                  <th className="px-6 py-4">Entrega</th>
                  <th className="px-6 py-4">Pago & Total</th>
                  <th className="px-6 py-4">Estado Actual</th>
                  <th className="px-6 py-4 text-center">Cambiar Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidos.map((pedido) => {
                  const isUpdating = actualizandoId === pedido.id;
                  const fecha = new Date(pedido.created_at).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={pedido.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* ID y Fecha */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-extrabold text-accent text-sm block">#{pedido.id}</span>
                        <span className="text-[11px] text-gray-400">{fecha}</span>
                      </td>

                      {/* Cliente */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-heading leading-tight">{pedido.cliente_nombre}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[12rem]">{pedido.cliente_email}</div>
                        <div className="text-xs text-gray-500 font-medium">{pedido.cliente_telefono}</div>
                      </td>

                      {/* Dirección */}
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-700 font-medium max-w-[14rem] line-clamp-2">
                          {pedido.direccion_envio}
                        </div>
                        <span className="text-[10px] text-gray-400 block">{pedido.ciudad || 'Bogotá'}</span>
                      </td>

                      {/* Método de pago y Total */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-extrabold text-text-heading text-sm block">
                          {formatPrice(pedido.total)}
                        </span>
                        <span className="text-[11px] text-gray-500 capitalize">
                          {pedido.metodo_pago?.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Estado Actual Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(
                            pedido.estado
                          )}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span className="capitalize">{pedido.estado}</span>
                        </span>
                      </td>

                      {/* SELECTOR / BOTONES PARA CAMBIAR ESTADO (Requerimiento clave del usuario) */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <select
                          value={pedido.estado}
                          disabled={isUpdating}
                          onChange={(e) => handleCambiarEstado(pedido.id, e.target.value)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-accent-light outline-none cursor-pointer hover:border-accent"
                        >
                          <option value="en revision">En revisión</option>
                          <option value="revisado">Revisado</option>
                          <option value="hecho">Hecho</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>

                      {/* Acciones (Ver productos comprados) */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => setPedidoModal(pedido)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-accent-light text-gray-700 hover:text-accent text-xs font-bold transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          Ver productos ({pedido.items?.length || pedido.total_items || 0})
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE PRODUCTOS COMPRADOS */}
      {pedidoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setPedidoModal(null)}></div>
          <div
            className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden z-10 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="font-bold text-text-heading text-base">
                  Productos del Pedido #{pedidoModal.id}
                </h3>
                <p className="text-xs text-gray-400">Cliente: {pedidoModal.cliente_nombre}</p>
              </div>
              <button
                onClick={() => setPedidoModal(null)}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto divide-y divide-gray-100">
              {pedidoModal.items && pedidoModal.items.length > 0 ? (
                pedidoModal.items.map((it, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-1 shrink-0">
                        {it.imagen_url ? (
                          <img src={it.imagen_url} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-xs text-gray-400">📦</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-text-heading">{it.nombre_producto}</p>
                        <p className="text-xs text-gray-400">
                          {it.cantidad} unidad(es) × {formatPrice(it.precio_unitario)}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-accent">{formatPrice(it.subtotal)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">No se cargaron ítems individuales.</p>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-400 block">Total pagado:</span>
                <span className="text-xl font-black text-text-heading">{formatPrice(pedidoModal.total)}</span>
              </div>
              <button
                onClick={() => setPedidoModal(null)}
                className="px-5 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-dark"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
