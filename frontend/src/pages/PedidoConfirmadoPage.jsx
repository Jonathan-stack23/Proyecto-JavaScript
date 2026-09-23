import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../context/CartContext';

export default function PedidoConfirmadoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, hasRole } = useAuth();
  const [pedido, setPedido] = useState(null);

  const getPanelLink = () => {
    if (hasRole('Administrador') || user?.rol_id === 1 || user?.rol === 'Administrador') {
      return '/admin/dashboard';
    }
    if (hasRole('Empleado') || user?.rol_id === 2 || user?.rol === 'Empleado') {
      return '/empleado/dashboard';
    }
    return '/cliente/dashboard';
  };

  useEffect(() => {
    // 1. Obtener pedido de la navegación reciente (state)
    let pedidoData = location.state?.pedido || null;

    // 2. Si no viene en state, buscar en sessionStorage
    if (!pedidoData) {
      try {
        const stored = sessionStorage.getItem('mitienda_pedido_reciente');
        if (stored) {
          pedidoData = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error al leer pedido de sessionStorage:', e);
      }
    }

    if (pedidoData) {
      setPedido(pedidoData);
    }
  }, [location.state]);

  // Si no se encuentra información de pedido reciente
  if (!pedido) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="bg-white rounded-3xl shadow-custom-md border border-gray-100 p-8 sm:p-12 space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-heading">No hay un pedido reciente</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              No encontramos información de una compra reciente en esta sesión. Puedes volver al inicio o explorar nuestro catálogo de productos.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent text-white font-bold text-sm shadow-md hover:bg-accent-dark transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              Volver al inicio
            </Link>
            <Link
              to="/productos"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              Ver productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const clienteNombre = pedido.cliente_nombre || (user ? `${user.nombre || ''} ${user.apellido || ''}`.trim() : '') || 'Cliente';
  const pedidoId = pedido.id ? `#${pedido.id}` : '#0000';
  const metodoPago = String(pedido.metodo_pago || 'Efectivo contra entrega').replace(/_/g, ' ');
  const totalVal = pedido.total ?? pedido.subtotal ?? 0;
  const itemsCount = pedido.itemsCount ?? (Array.isArray(pedido.items) ? pedido.items.length : 1);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="bg-white rounded-3xl shadow-custom-lg border border-gray-100 overflow-hidden">
        {/* ENCABEZADO DESTACADO DE ÉXITO */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-6 py-10 sm:px-10 sm:py-14 text-center text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 800 400" fill="none" preserveAspectRatio="xMidYMid slice">
              <circle cx="700" cy="50" r="200" fill="white" />
              <circle cx="50" cy="350" r="180" fill="white" />
            </svg>
          </div>

          <div className="relative z-10 space-y-4">
            {/* Ícono animado de éxito */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-sm text-white mx-auto flex items-center justify-center shadow-2xl border border-white/30">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div>
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black bg-white/25 border border-white/40 mb-3 tracking-wide uppercase shadow-sm">
                ✓ Pedido Realizado con Éxito
              </span>
              <h1 className="text-2xl sm:text-4xl font-black leading-tight">
                ¡Gracias por tu compra, {clienteNombre}!
              </h1>
              <p className="text-sm sm:text-base text-white/90 mt-2 max-w-lg mx-auto">
                Tu orden ha sido registrada correctamente con el identificador{' '}
                <span className="inline-block bg-white/20 px-3 py-1 rounded-lg border border-white/30 font-black tracking-wider">
                  {pedidoId}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* CONTENIDO Y RESUMEN DEL PEDIDO */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* TARJETAS DE RESUMEN RÁPIDO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 text-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total a pagar</p>
              <p className="text-2xl font-black text-gray-900">{formatPrice(totalVal)}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 text-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Método de pago</p>
              <p className="text-base font-bold text-gray-800 capitalize">
                {metodoPago}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 text-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Estado de tu orden</p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                ⏳ En revisión
              </span>
            </div>
          </div>

          {/* DETALLES DE ENTREGA Y RESUMEN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">
                  📍
                </span>
                Datos de Entrega
              </h3>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs font-semibold">Cliente</p>
                  <p className="font-bold text-gray-900">{clienteNombre}</p>
                </div>
                {pedido.cliente_email && (
                  <div>
                    <p className="text-gray-400 text-xs font-semibold">Correo Electrónico</p>
                    <p className="font-semibold text-gray-700">{pedido.cliente_email}</p>
                  </div>
                )}
                {pedido.cliente_telefono && (
                  <div>
                    <p className="text-gray-400 text-xs font-semibold">Teléfono de Contacto</p>
                    <p className="font-semibold text-gray-700">{pedido.cliente_telefono}</p>
                  </div>
                )}
                {pedido.direccion_envio && (
                  <div>
                    <p className="text-gray-400 text-xs font-semibold">Dirección de Envío</p>
                    <p className="font-semibold text-gray-700">
                      {pedido.direccion_envio}
                      {pedido.ciudad ? `, ${pedido.ciudad}` : ''}
                    </p>
                  </div>
                )}
                {pedido.notas && (
                  <div>
                    <p className="text-gray-400 text-xs font-semibold">Notas de Entrega</p>
                    <p className="font-medium text-gray-600 italic">"{pedido.notas}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">
                  📦
                </span>
                Resumen de la Compra
              </h3>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Productos comprados</span>
                  <span className="font-bold text-gray-900">{itemsCount} item(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-700">{formatPrice(pedido.subtotal ?? totalVal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Costo de envío</span>
                  <span className="font-bold text-emerald-600 uppercase text-xs px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    Gratis
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                  <span className="font-black text-gray-900">Total</span>
                  <span className="font-black text-2xl text-accent">{formatPrice(totalVal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* MENSAJE DE CONFIRMACIÓN */}
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-sm text-emerald-800 flex items-start gap-3.5 shadow-sm">
            <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex-shrink-0 flex items-center justify-center mt-0.5">
              ✓
            </div>
            <div>
              <p className="font-black text-base text-emerald-950 mb-0.5">
                ¡Tu pedido ya está siendo preparado!
              </p>
              <p className="text-emerald-800 leading-relaxed">
                Hemos registrado tu solicitud en el sistema. Puedes hacer seguimiento a este pedido desde tu panel en cualquier momento.
              </p>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN (CON ÉNFASIS EN VOLVER AL INICIO) */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 items-stretch">
            {/* Botón principal: Volver al inicio */}
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-accent text-white font-extrabold text-base shadow-lg shadow-accent/25 hover:bg-accent-dark hover:shadow-xl transition-all active:scale-[0.98] text-center cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Volver al inicio
            </Link>

            {/* Botón Descargar Factura PDF */}
            {pedido.id ? (
              <button
                type="button"
                onClick={() => {
                  const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
                  const token = localStorage.getItem('mitienda_token') || sessionStorage.getItem('mitienda_token') || '';
                  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
                  window.open(`${baseUrl}/facturas/pedido/${pedido.id}/pdf${tokenParam}`, '_blank');
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Descargar Factura (PDF)
              </button>
            ) : null}

            {/* Botón secundario: Ver mi pedido en el panel */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate(getPanelLink())}
                className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                </svg>
                Ver en mi Panel
              </button>
            ) : null}

            {/* Botón terciario: Seguir comprando */}
            <button
              type="button"
              onClick={() => navigate('/productos')}
              className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              Seguir comprando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
