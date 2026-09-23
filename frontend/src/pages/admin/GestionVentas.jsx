import { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const ESTILOS_ESTADO = {
  completada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pagada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelada: 'bg-red-100 text-red-700 border-red-200',
  'en proceso': 'bg-blue-100 text-blue-700 border-blue-200',
};

function GestionVentas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [ordenarPor, setOrdenarPor] = useState('recientes');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/ventas');
        setVentas(response.data?.ventas || []);
      } catch (error) {
        console.error('Error cargando ventas', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const estadosUnicos = useMemo(() => {
    const set = new Set(ventas.map((v) => (v.estado || '').toLowerCase().trim()).filter(Boolean));
    return Array.from(set);
  }, [ventas]);

  const totalVentas = ventas.length;
  const totalMonto = useMemo(() => ventas.reduce((acc, v) => acc + Number(v.total || 0), 0), [ventas]);
  const totalCompletadas = useMemo(
    () => ventas.filter((v) => ['completada', 'pagada'].includes((v.estado || '').toLowerCase())).length,
    [ventas]
  );
  const totalCanceladas = useMemo(
    () => ventas.filter((v) => ['cancelada', 'anulada'].includes((v.estado || '').toLowerCase())).length,
    [ventas]
  );

  const hayFiltrosActivos = busqueda.trim() !== '' || filtroEstado !== 'todos' || ordenarPor !== 'recientes';

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('todos');
    setOrdenarPor('recientes');
  };

  const ventasFiltradas = useMemo(() => {
    let resultado = [...ventas];

    if (filtroEstado !== 'todos') {
      resultado = resultado.filter((v) => (v.estado || '').toLowerCase() === filtroEstado.toLowerCase());
    }

    const q = busqueda.toLowerCase().trim();
    if (q) {
      resultado = resultado.filter((v) => {
        const campos = [
          v.numero_venta,
          v.cliente_nombre,
          v.cliente_email,
          v.cliente_documento,
          v.metodo_pago,
          String(v.total || ''),
          (v.detalles || []).map((d) => d.nombre_item || d.producto_nombre || '').join(' '),
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
      case 'monto_asc':
        resultado.sort((a, b) => Number(a.total || 0) - Number(b.total || 0));
        break;
      case 'monto_desc':
        resultado.sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
        break;
      case 'cliente_az':
        resultado.sort((a, b) => String(a.cliente_nombre || '').localeCompare(String(b.cliente_nombre || '')));
        break;
      default:
        break;
    }

    return resultado;
  }, [ventas, filtroEstado, busqueda, ordenarPor]);

  const getEstiloEstado = (estado) => {
    const key = String(estado || '').toLowerCase();
    return (
      ESTILOS_ESTADO[key] ||
      'bg-slate-100 text-slate-700 border-slate-200'
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Cargando historial de ventas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-bold text-emerald-50 border border-white/20 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                MÓDULO COMERCIAL
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-sm">Gestión de Ventas</h1>
              <p className="text-sm text-emerald-50 mt-2 max-w-2xl">
                Historial completo de transacciones comerciales de productos y servicios. Filtra, ordena y consulta el detalle de cada operación.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-emerald-100">Ventas Registradas</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{totalVentas}</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-emerald-100">Monto Total</p>
              <p className="text-xl sm:text-2xl font-black text-white mt-1">{formatCurrency(totalMonto)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-emerald-100">Completadas</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-200 mt-1">{totalCompletadas}</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-emerald-100">Canceladas</p>
              <p className="text-2xl sm:text-3xl font-black text-red-200 mt-1">{totalCanceladas}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                filtroEstado === 'todos'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todas ({totalVentas})
            </button>
            {estadosUnicos.map((est) => {
              const cont = ventas.filter((v) => (v.estado || '').toLowerCase() === est).length;
              const capitalizado = est.charAt(0).toUpperCase() + est.slice(1);
              return (
                <button
                  key={est}
                  onClick={() => setFiltroEstado(est)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    filtroEstado === est
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {capitalizado} ({cont})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
              <option value="monto_desc">Monto: Mayor a menor</option>
              <option value="monto_asc">Monto: Menor a mayor</option>
              <option value="cliente_az">Cliente: A - Z</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por #venta, cliente, email, documento, método de pago o producto..."
              className="w-full pl-11 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
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

          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold hover:bg-red-100 transition-colors shadow-sm"
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                Estado: {filtroEstado.charAt(0).toUpperCase() + filtroEstado.slice(1)}
                <button onClick={() => setFiltroEstado('todos')} className="hover:text-emerald-900 ml-0.5">✕</button>
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
              Mostrando {ventasFiltradas.length} de {totalVentas} ventas
            </span>
          </div>
        )}
      </div>

      {ventas.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-14 text-center space-y-3">
          <div className="text-5xl">💸</div>
          <h3 className="font-bold text-slate-700 text-lg">No hay ventas registradas aún</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Cuando se procesen pedidos confirmados aparecerán aquí en el historial comercial.
          </p>
        </div>
      ) : ventasFiltradas.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-amber-200 bg-amber-50/40 p-12 text-center space-y-3">
          <div className="text-5xl">🔍</div>
          <h3 className="font-bold text-slate-700 text-base">Sin resultados con los filtros actuales</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Hay {totalVentas} ventas en total pero ninguna coincide con tu búsqueda. Intenta limpiar los filtros.
          </p>
          <button
            onClick={limpiarFiltros}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
          >
            Quitar todos los filtros
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-emerald-50/50">
              <tr>
                <th className="px-4 sm:px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">Venta</th>
                <th className="px-4 sm:px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">Cliente</th>
                <th className="px-4 sm:px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">Total</th>
                <th className="px-4 sm:px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">Estado</th>
                <th className="px-4 sm:px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider text-center">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ventasFiltradas.map((venta) => (
                <tr key={venta.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-4 sm:px-6 py-4 font-bold text-slate-800 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                      #{venta.numero_venta || venta.id}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="font-semibold text-slate-800">{venta.cliente_nombre}</div>
                    {venta.cliente_email && <div className="text-xs text-slate-500 mt-0.5">{venta.cliente_email}</div>}
                    {venta.cliente_documento && <div className="text-[11px] text-slate-400 mt-0.5">Doc: {venta.cliente_documento}</div>}
                  </td>
                  <td className="px-4 sm:px-6 py-4 font-black text-slate-900 whitespace-nowrap">
                    {formatCurrency(venta.total)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${getEstiloEstado(venta.estado)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      {venta.estado || 'Sin estado'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm">
                      {venta.detalles?.length || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GestionVentas;
