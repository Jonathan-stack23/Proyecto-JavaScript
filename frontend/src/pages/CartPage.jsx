import { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useCart, formatPrice } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductDetailModal from '../components/ProductDetailModal';
import { getProductImage } from '../utils/productImages';
import api from '../services/api';

const METODOS_PAGO = [
  {
    id: 'efectivo',
    nombre: 'Efectivo contra entrega',
    descripcion: 'Paga en efectivo al recibir tus productos en tu domicilio',
  },
  {
    id: 'tarjeta_credito',
    nombre: 'Tarjeta de Crédito',
    descripcion: 'Visa, Mastercard, American Express',
  },
  {
    id: 'tarjeta_debito',
    nombre: 'Tarjeta de Débito (PSE)',
    descripcion: 'Pago seguro en línea por débito bancario',
  },
  {
    id: 'transferencia',
    nombre: 'Transferencia Bancaria',
    descripcion: 'Bancolombia, Davivienda, Banco de Bogotá',
  },
  {
    id: 'nequi_daviplata',
    nombre: 'Nequi / Daviplata',
    descripcion: 'Paga al instante con tu número de teléfono móvil',
  },
];

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, total } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mostrarEditarDatos, setMostrarEditarDatos] = useState(false);

  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_email: '',
    cliente_telefono: '',
    direccion_envio: '',
    ciudad: 'Bogotá',
    metodo_pago: 'efectivo',
    notas: '',
    numero_tarjeta: '',
    expira: '',
    cvv: '',
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [pedidoExitoso, setPedidoExitoso] = useState(null);
  const [datosAutocompletados, setDatosAutocompletados] = useState(false);

  // Limpiar cualquier residuo de datos antiguos de localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('mitienda_cliente_datos');
    } catch {}
  }, []);

  // Autocompletar EXCLUSIVAMENTE los datos del usuario que tiene la sesión iniciada
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setFormData((prev) => ({
        ...prev,
        cliente_nombre: '',
        cliente_email: '',
        cliente_telefono: '',
        direccion_envio: '',
        ciudad: 'Bogotá',
      }));
      setDatosAutocompletados(false);
      return;
    }

    const cargarDatosUsuarioAutenticado = async () => {
      try {
        const res = await api.get('/auth/profile');
        if (res.data?.ok && res.data.user) {
          const u = res.data.user;
          const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.trim();
          setFormData((prev) => ({
            ...prev,
            cliente_nombre: nombreCompleto || `${user.nombre || ''} ${user.apellido || ''}`.trim(),
            cliente_email: u.email || user.email || '',
            cliente_telefono: u.telefono || user.telefono || '',
            direccion_envio: u.direccion || user.direccion || '',
            ciudad: 'Bogotá',
          }));
          setDatosAutocompletados(true);
          return;
        }
      } catch {
        // Fallback a los datos de la sesión actual
      }

      // Si falla la petición, usar directamente los datos del usuario en sesión
      const nombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim();
      setFormData((prev) => ({
        ...prev,
        cliente_nombre: nombreCompleto,
        cliente_email: user.email || '',
        cliente_telefono: user.telefono || '',
        direccion_envio: user.direccion || '',
        ciudad: 'Bogotá',
      }));
      setDatosAutocompletados(true);
    };

    cargarDatosUsuarioAutenticado();
  }, [user, isAuthenticated]);

  // Si la sesión no está iniciada, abrir el panel de inicio de sesión
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login?redirect=/carrito" replace />;
  }

  const abrirDetalles = (item) => {
    setProductoSeleccionado(item);
    setModalAbierto(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);

    if (!cart || cart.length === 0) {
      setError('El carrito está vacío. Agrega productos para realizar un pedido.');
      return;
    }

    const nombre = formData.cliente_nombre?.trim() || `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Cliente';
    const email = formData.cliente_email?.trim() || user?.email;
    const telefono = formData.cliente_telefono?.trim() || user?.telefono;
    const direccion = formData.direccion_envio?.trim() || user?.direccion;

    if (!telefono || !direccion) {
      setError('Por favor ingresa tu teléfono y dirección de entrega para despachar tu pedido.');
      setMostrarEditarDatos(true);
      return;
    }

    try {
      setCargando(true);

      const itemsPayload = cart.map((it) => ({
        producto_id: it.id,
        nombre_producto: it.nombre,
        precio_unitario: it.precio,
        cantidad: it.cantidad || 1,
        imagen_url: getProductImage(it),
      }));

      const res = await api.post('/pedidos', {
        cliente_nombre: nombre,
        cliente_email: email,
        cliente_telefono: telefono,
        direccion_envio: direccion,
        ciudad: formData.ciudad || 'Bogotá',
        metodo_pago: formData.metodo_pago || 'efectivo',
        notas: formData.notas || '',
        items: itemsPayload,
      });

      if (res.data?.ok && res.data.pedido) {
        const nuevoPedido = res.data.pedido;
        setPedidoExitoso(nuevoPedido);
        try {
          sessionStorage.setItem('mitienda_pedido_reciente', JSON.stringify(nuevoPedido));
        } catch {}
        clearCart();
      } else {
        setError(res.data?.message || 'No se pudo procesar el pedido.');
      }
    } catch (err) {
      console.error('Error al realizar el pedido:', err);
      setError(err.response?.data?.message || 'Error al conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* MODAL / MENSAJE DESTACADO DE PEDIDO REALIZADO CORRECTAMENTE */}
      {pedidoExitoso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <div>
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                ¡Pedido Realizado Correctamente!
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text-heading">
                ¡Gracias por tu compra, {pedidoExitoso.cliente_nombre}!
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Tu orden ha sido registrada con el identificador <strong className="text-accent font-black">#{pedidoExitoso.id}</strong>.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total a Pagar:</span>
                <span className="font-extrabold text-base text-text-heading">{formatPrice(pedidoExitoso.total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Método de Pago:</span>
                <span className="font-semibold text-gray-700 capitalize">
                  {pedidoExitoso.metodo_pago?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Estado en tu Panel:</span>
                <span className="font-bold px-2.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
                  En revisión
                </span>
              </div>
            </div>

            <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100 font-medium">
              ✓ Este pedido ya se encuentra disponible en tu panel de cliente para que puedas ver su estado en tiempo real.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/cliente/dashboard')}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-accent text-white font-bold text-sm shadow-md hover:bg-accent-dark transition-all cursor-pointer"
              >
                Ver mi pedido en el Panel
              </button>
              <button
                type="button"
                onClick={() => {
                  setPedidoExitoso(null);
                  navigate('/productos');
                }}
                className="inline-flex items-center justify-center px-4 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all cursor-pointer"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado del Carrito */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-text-heading flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center text-lg shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </span>
          Apartado del Carrito
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Revisa tus productos seleccionados, confirma tu información de entrega y elige tu método de pago.
        </p>
      </div>

      {/* Carrito Vacío */}
      {cart.length === 0 && !pedidoExitoso && (
        <div className="bg-white rounded-3xl p-12 md:p-16 shadow-custom-md border border-gray-100 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-20 h-20 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-heading">Tu carrito está vacío</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Agrega productos desde el catálogo para generar tu pedido y recibirlo en tu dirección.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/productos"
              className="px-6 py-3 rounded-xl bg-accent text-white font-bold text-sm shadow-md hover:bg-accent-dark transition-all"
            >
              Explorar Catálogo
            </Link>
            <Link
              to="/cliente/dashboard"
              className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              Ver mis pedidos anteriores
            </Link>
          </div>
        </div>
      )}

      {/* Carrito con Productos */}
      {cart.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Productos + Formulario */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Lista de productos */}
            <div className="bg-white rounded-3xl p-6 shadow-custom-md border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-text-heading flex items-center gap-2">
                  <span>Productos en el Carrito</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-light text-accent">
                    {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                >
                  Vaciar carrito
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {cart.map((item) => {
                  const itemTotal = (typeof item.precio === 'number' ? item.precio : 0) * (item.cantidad || 1);
                  const itemImg = getProductImage(item);

                  return (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 p-2 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={itemImg}
                          alt={item.nombre}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        {item.categoria && (
                          <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-0.5">
                            {item.categoria}
                          </span>
                        )}
                        <h3 className="font-bold text-text-heading text-base truncate">{item.nombre}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Precio unitario: <span className="font-semibold text-gray-700">{formatPrice(item.precio)}</span>
                        </p>

                        <button
                          type="button"
                          onClick={() => abrirDetalles(item)}
                          className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-accent-light hover:text-accent transition-colors cursor-pointer"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          Ver detalles
                        </button>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, (item.cantidad || 1) - 1)}
                            className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-sm font-bold text-text-heading min-w-[2rem] text-center">
                            {item.cantidad || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, (item.cantidad || 1) + 1)}
                            className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right min-w-[5.5rem]">
                          <p className="text-xs text-gray-400">Subtotal</p>
                          <p className="font-extrabold text-accent text-base">{formatPrice(itemTotal)}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FORMULARIO DE CHECKOUT */}
            <form onSubmit={handleSubmit} id="checkout-form" className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl font-semibold">
                  {error}
                </div>
              )}

              {/* SECCIÓN 1: DATOS DEL CLIENTE AUTENTICADO */}
              <div className="bg-white rounded-3xl p-6 shadow-custom-md border border-gray-100 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-text-heading">Información de Entrega</h2>
                      <p className="text-xs text-emerald-600 font-semibold">
                        ✓ Datos vinculados a tu cuenta ({user?.email})
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMostrarEditarDatos(!mostrarEditarDatos)}
                    className="text-xs font-bold text-accent hover:text-accent-dark underline cursor-pointer"
                  >
                    {mostrarEditarDatos ? 'Ver resumen' : 'Modificar datos de entrega'}
                  </button>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${mostrarEditarDatos ? '' : 'bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100'}`}>
                  <div>
                    <label className="block text-xs font-bold text-text-heading mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      name="cliente_nombre"
                      value={formData.cliente_nombre}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-heading mb-1">Teléfono de Contacto</label>
                    <input
                      type="tel"
                      name="cliente_telefono"
                      value={formData.cliente_telefono}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white"
                      placeholder="Ej. 3001234567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-heading mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      name="cliente_email"
                      value={formData.cliente_email}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-heading mb-1">Ciudad</label>
                    <input
                      type="text"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white"
                      placeholder="Bogotá"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-text-heading mb-1">Dirección de Entrega</label>
                    <input
                      type="text"
                      name="direccion_envio"
                      value={formData.direccion_envio}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white"
                      placeholder="Calle 100 # 15-20, Apto / Casa"
                    />
                  </div>
                </div>

                {/* NOTAS ADICIONALES */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-text-heading mb-1">
                    📝 Notas adicionales de entrega (Opcional)
                  </label>
                  <input
                    type="text"
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    placeholder="Ej. Dejar con el portero, timbre 301, entregar en la tarde..."
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent-light outline-none"
                  />
                </div>
              </div>

              {/* SECCIÓN 2: INFORMACIÓN DEL MÉTODO DE PAGO */}
              <div className="bg-white rounded-3xl p-6 shadow-custom-md border border-gray-100 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                  <div className="w-7 h-7 rounded-xl bg-accent text-white flex items-center justify-center text-xs font-bold">
                    💳
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text-heading">Información de Pago</h2>
                    <p className="text-xs text-gray-400">Selecciona cómo deseas pagar tu pedido</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {METODOS_PAGO.map((metodo) => {
                    const seleccionado = formData.metodo_pago === metodo.id;
                    return (
                      <label
                        key={metodo.id}
                        className={`relative flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                          seleccionado
                            ? 'border-accent bg-accent/5 ring-2 ring-accent/20 shadow-sm'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="metodo_pago"
                          value={metodo.id}
                          checked={seleccionado}
                          onChange={handleChange}
                          className="mt-1 text-accent focus:ring-accent cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-bold text-text-heading block mb-0.5">{metodo.nombre}</span>
                          <p className="text-xs text-gray-500 leading-snug">{metodo.descripcion}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {formData.metodo_pago === 'tarjeta_credito' && (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">Datos de la Tarjeta</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          name="numero_tarjeta"
                          value={formData.numero_tarjeta}
                          onChange={handleChange}
                          placeholder="Número de tarjeta (16 dígitos)"
                          maxLength={19}
                          className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          name="expira"
                          value={formData.expira}
                          onChange={handleChange}
                          placeholder="MM/AA"
                          maxLength={5}
                          className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleChange}
                          placeholder="CVV"
                          maxLength={4}
                          className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Columna Derecha: Subtotal y Botón Confirmar */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-custom-lg border border-gray-100 space-y-6">
              <h2 className="text-xl font-bold text-text-heading">Resumen de Compra</h2>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
                    <span className="text-gray-600 truncate max-w-[12rem]">
                      {item.cantidad || 1}x {item.nombre}
                    </span>
                    <span className="font-bold text-text-heading">
                      {formatPrice((item.precio || 0) * (item.cantidad || 1))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtotal y Total */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Subtotal de lo pedido:</span>
                  <span className="font-bold text-text-heading text-base">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Envío:</span>
                  <span className="font-bold text-emerald-600 uppercase text-xs px-2 py-0.5 rounded-full bg-emerald-100">
                    Gratis
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-extrabold text-text-heading block">Total a Pagar:</span>
                    <span className="text-[11px] text-gray-400">Impuestos y entrega incluidos</span>
                  </div>
                  <span className="text-2xl font-black text-accent">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Botón Realizar Pedido */}
              <button
                type="submit"
                form="checkout-form"
                disabled={cargando || cart.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-accent text-white font-extrabold text-base shadow-lg shadow-accent/25 hover:bg-accent-dark hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {cargando ? (
                  <>
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    Procesando tu pedido...
                  </>
                ) : (
                  <>
                    Realizar Pedido — {formatPrice(total)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles de Producto */}
      <ProductDetailModal
        producto={productoSeleccionado}
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setProductoSeleccionado(null);
        }}
        showAddToCart={false}
      />
    </div>
  );
}
