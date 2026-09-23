import { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const ESTILOS_ESTADO_FACTURA = {
  pagada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'pagado parcial': 'bg-amber-100 text-amber-700 border-amber-200',
  pendiente: 'bg-orange-100 text-orange-700 border-orange-200',
  vencida: 'bg-red-100 text-red-700 border-red-200',
  anulada: 'bg-slate-200 text-slate-700 border-slate-300',
};

function GestionFacturas() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroMetodoPago, setFiltroMetodoPago] = useState('todos');
  const [ordenarPor, setOrdenarPor] = useState('recientes');
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/facturas');
      setFacturas(response.data?.facturas || []);
    } catch (error) {
      console.error('Error cargando facturas', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFacturas();
  }, []);

  const downloadPdf = (id) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const token = localStorage.getItem('mitienda_token') || sessionStorage.getItem('mitienda_token') || '';
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    window.open(`${baseUrl}/facturas/${id}/pdf${tokenParam}`, '_blank');
  };

  const verInformacionFactura = async (facturaItem) => {
    try {
      setCargandoDetalle(true);
      const res = await api.get(`/facturas/${facturaItem.id}`);
      if (res.data?.ok && res.data.factura) {
        setFacturaSeleccionada(res.data.factura);
      } else {
        setFacturaSeleccionada(facturaItem);
      }
    } catch (e) {
      console.error('Error al obtener detalle de la factura:', e);
      setFacturaSeleccionada(facturaItem);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const estadosUnicos = useMemo(() => {
    const set = new Set(facturas.map((f) => (f.estado || '').toLowerCase().trim()).filter(Boolean));
    return Array.from(set);
  }, [facturas]);

  const metodosPagoUnicos = useMemo(() => {
    const set = new Set(facturas.map((f) => (f.metodo_pago || '').toLowerCase().trim()).filter(Boolean));
    return Array.from(set);
  }, [facturas]);

  const totalFacturas = facturas.length;
  const totalMontoFacturado = useMemo(
    () => facturas.reduce((acc, f) => acc + Number(f.total || 0), 0),
    [facturas]
  );
  const totalPagadas = useMemo(
    () => facturas.filter((f) => ['pagada', 'pagado', 'pagado parcial'].includes((f.estado || '').toLowerCase())).length,
    [facturas]
  );
  const totalPendientes = useMemo(
    () => facturas.filter((f) => ['pendiente', 'vencida'].includes((f.estado || '').toLowerCase())).length,
    [facturas]
  );

  const hayFiltrosActivos =
    busqueda.trim() !== '' ||
    filtroEstado !== 'todos' ||
    filtroMetodoPago !== 'todos' ||
    ordenarPor !== 'recientes';

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('todos');
    setFiltroMetodoPago('todos');
    setOrdenarPor('recientes');
  };

  const getEstiloEstado = (estado) => {
    const key = String(estado || '').toLowerCase();
    return ESTILOS_ESTADO_FACTURA[key] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatearMetodoPago = (m) =>
    String(m || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const facturasFiltradas = useMemo(() => {
    let resultado = [...facturas];

    if (filtroEstado !== 'todos') {
      resultado = resultado.filter((f) => (f.estado || '').toLowerCase() === filtroEstado.toLowerCase());
    }

    if (filtroMetodoPago !== 'todos') {
      resultado = resultado.filter(
        (f) => (f.metodo_pago || '').toLowerCase() === filtroMetodoPago.toLowerCase()
      );
    }

    const q = busqueda.toLowerCase().trim();
    if (q) {
      resultado = resultado.filter((f) => {
        const campos = [
          f.numero_factura,
          f.cliente_nombre,
          f.cliente_email,
          f.cliente_documento,
          f.cliente_telefono,
          f.cliente_direccion,
          f.metodo_pago,
          (f.detalles || []).map((d) => d.nombre_item || '').join(' '),
        ];
        return campos.some((c) => String(c || '').toLowerCase().includes(q));
      });
    }

    switch (ordenarPor) {
      case 'recientes':
        resultado.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
        break;
      case 'antiguos':
        resultado.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
        break;
      case 'monto_desc':
        resultado.sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
        break;
      case 'monto_asc':
        resultado.sort((a, b) => Number(a.total || 0) - Number(b.total || 0));
        break;
      case 'cliente_az':
        resultado.sort((a, b) => String(a.cliente_nombre || '').localeCompare(String(b.cliente_nombre || '')));
        break;
      default:
        break;
    }

    return resultado;
  }, [facturas, filtroEstado, filtroMetodoPago, busqueda, ordenarPor]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Cargando facturas comerciales...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-bold text-indigo-50 border border-white/20 mb-3">
                <span className="w-2 h-2 rounded-full bg-violet-300 animate-pulse" />
                FACTURACIÓN OFICIAL
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-sm">Gestión de Facturas</h1>
              <p className="text-sm text-indigo-50 mt-2 max-w-2xl">
                Consulta la información comercial de cada factura, filtra por estado o método de pago y descarga el documento oficial en PDF.
              </p>
            </div>
            <button
              type="button"
              onClick={cargarFacturas}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white text-sm font-bold hover:bg-white/20 shadow-sm transition-colors self-start sm:self-auto"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refrescar
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-indigo-100">Facturas Emitidas</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{totalFacturas}</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-indigo-100">Monto Total</p>
              <p className="text-lg sm:text-2xl font-black text-white mt-1">{formatCurrency(totalMontoFacturado)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-indigo-100">Pagadas</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-200 mt-1">{totalPagadas}</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-indigo-100">Pendientes / Vencidas</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-200 mt-1">{totalPendientes}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar factura (número, cliente, doc, email, pago, items...)"
              className="w-full pl-11 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
          >
            <option value="todos">Todos los estados ({totalFacturas})</option>
            {estadosUnicos.map((est) => {
              const cont = facturas.filter((f) => (f.estado || '').toLowerCase() === est).length;
              const cap = est.charAt(0).toUpperCase() + est.slice(1);
              return (
                <option key={est} value={est}>
                  {cap} ({cont})
                </option>
              );
            })}
          </select>

          <select
            value={filtroMetodoPago}
            onChange={(e) => setFiltroMetodoPago(e.target.value)}
            className="px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
          >
            <option value="todos">Todos los métodos de pago</option>
            {metodosPagoUnicos.map((mp) => (
              <option key={mp} value={mp}>
                {formatearMetodoPago(mp)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <select
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold outline-none focus:border-indigo-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="recientes">Orden: Más recientes</option>
            <option value="antiguos">Orden: Más antiguos</option>
            <option value="monto_desc">Orden: Monto mayor a menor</option>
            <option value="monto_asc">Orden: Monto menor a mayor</option>
            <option value="cliente_az">Orden: Cliente A - Z</option>
          </select>

          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold hover:bg-red-100 transition-colors shadow-sm w-full sm:w-auto"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Limpiar filtros
            </button>
          )}
        </div>

        {hayFiltrosActivos && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500">Filtros activos:</span>
            {filtroEstado !== 'todos' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700">
                Estado: {filtroEstado.charAt(0).toUpperCase() + filtroEstado.slice(1)}
                <button onClick={() => setFiltroEstado('todos')} className="hover:text-indigo-900 ml-0.5">✕</button>
              </span>
            )}
            {filtroMetodoPago !== 'todos' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 px-3 py-1 text-xs font-bold text-fuchsia-700">
                Pago: {formatearMetodoPago(filtroMetodoPago)}
                <button onClick={() => setFiltroMetodoPago('todos')} className="hover:text-fuchsia-900 ml-0.5">✕</button>
              </span>
            )}
            {busqueda.trim() !== '' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
                Búsqueda: "{busqueda.trim().slice(0, 30)}{busqueda.trim().length > 30 ? '...' : ''}"
                <button onClick={() => setBusqueda('')} className="hover:text-blue-900 ml-0.5">✕</button>
              </span>
            )}
            {ordenarPor !== 'recientes' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-700">
                Orden: {
                  {
                    antiguos: 'Más antiguos',
                    monto_desc: 'Monto ↓',
                    monto_asc: 'Monto ↑',
                    cliente_az: 'Cliente A-Z',
                  }[ordenarPor]
                }
                <button onClick={() => setOrdenarPor('recientes')} className="hover:text-purple-900 ml-0.5">✕</button>
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-semibold ml-auto">
              Mostrando {facturasFiltradas.length} de {totalFacturas} facturas
            </span>
          </div>
        )}
      </div>

      {facturas.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-14 text-center space-y-3">
          <div className="text-5xl">🧾</div>
          <h3 className="font-bold text-slate-700 text-lg">No hay facturas emitidas aún</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Cuando se confirmen y facturen ventas aparecerán aquí los documentos oficiales.
          </p>
        </div>
      ) : facturasFiltradas.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-amber-200 bg-amber-50/40 p-12 text-center space-y-3">
          <div className="text-5xl">🔍</div>
          <h3 className="font-bold text-slate-700 text-base">Sin facturas que coincidan</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Hay {totalFacturas} facturas en total pero ninguna coincide con los filtros actuales. Intenta limpiarlos.
          </p>
          <button
            onClick={limpiarFiltros}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
          >
            Quitar todos los filtros
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {facturasFiltradas.map((factura) => (
            <div
              key={factura.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700">
                    {factura.numero_factura}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${getEstiloEstado(factura.estado)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    {(factura.estado || 'Sin estado').toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400">
                    {factura.fecha_emision ? new Date(factura.fecha_emision).toLocaleString('es-CO') : 'Sin fecha'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {factura.cliente_nombre}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Doc: <strong className="text-slate-700">{factura.cliente_documento || 'Consumidor Final'}</strong></span>
                  <span>Email: <strong className="text-slate-700">{factura.cliente_email}</strong></span>
                  <span>Pago: <strong className="text-slate-700">{formatearMetodoPago(factura.metodo_pago)}</strong></span>
                  <span>Ítems: <strong className="text-slate-700">{factura.detalles?.length || 0}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-left sm:text-right mr-2">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Total Facturado</p>
                  <p className="text-xl sm:text-2xl font-black text-indigo-600">{formatCurrency(factura.total)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => verInformacionFactura(factura)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
                    title="Ver detalle comercial de la factura"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Ver Info
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadPdf(factura.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer"
                    title="Descargar documento en PDF"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {facturaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">
                  🧾
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-200">Información Oficial</span>
                  <h2 className="text-xl font-black">{facturaSeleccionada.numero_factura}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFacturaSeleccionada(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-1">Adquiriente / Cliente</span>
                  <p className="font-extrabold text-sm text-slate-900">{facturaSeleccionada.cliente_nombre}</p>
                  <p className="mt-0.5">Doc: <strong>{facturaSeleccionada.cliente_documento || '222222222222'}</strong></p>
                  <p>Email: <strong>{facturaSeleccionada.cliente_email}</strong></p>
                  <p>Tel: <strong>{facturaSeleccionada.cliente_telefono || 'N/A'}</strong></p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-1">Datos de Emisión y Pago</span>
                  <p>Fecha: <strong>{facturaSeleccionada.fecha_emision ? new Date(facturaSeleccionada.fecha_emision).toLocaleString('es-CO') : 'N/A'}</strong></p>
                  <p>Método: <strong className="capitalize">{String(facturaSeleccionada.metodo_pago || '').replace(/_/g, ' ')}</strong></p>
                  <p>Estado: <span className={`inline-block px-2 py-0.5 rounded-md font-bold uppercase text-[10px] border ${getEstiloEstado(facturaSeleccionada.estado)}`}>{facturaSeleccionada.estado}</span></p>
                  <p>Dirección: <strong>{facturaSeleccionada.cliente_direccion || 'Bogotá, Colombia'}</strong></p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Ítems Facturados ({facturaSeleccionada.detalles?.length || 0})
                </h4>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left">Ítem</th>
                        <th className="px-3 py-2 text-center">Cant.</th>
                        <th className="px-3 py-2 text-right">Precio Unitario</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(facturaSeleccionada.detalles || []).map((det, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-slate-800 block">{det.nombre_item}</span>
                            <span className="text-[10px] text-slate-400 capitalize">{det.tipo_item}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{det.cantidad}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">{formatCurrency(det.precio_unitario)}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-800">{formatCurrency(det.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal Comercial:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(facturaSeleccionada.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Descuento Aplicado:</span>
                  <span className="font-semibold text-emerald-600">-{formatCurrency(facturaSeleccionada.descuento || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA Liquidado (19%):</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(facturaSeleccionada.impuestos || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-indigo-700">
                  <span>TOTAL FACTURA:</span>
                  <span className="text-base font-black">{formatCurrency(facturaSeleccionada.total)}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-2 text-center">
                Resolución DIAN No. 18764000123 de 2026. Sistema de Facturación MiTienda — SENA Ficha 3406204.
              </p>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setFacturaSeleccionada(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => downloadPdf(facturaSeleccionada.id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Descargar en PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionFacturas;
