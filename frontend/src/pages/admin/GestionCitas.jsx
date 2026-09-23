import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import { formatPrice } from '../../context/CartContext';

const ESTADOS = [
  { value: 'en revision', label: 'En revisión' },
  { value: 'revisado', label: 'Revisado' },
  { value: 'hecho', label: 'Hecho' },
  { value: 'cancelado', label: 'Cancelado' },
];

const ESTILOS_ESTADO = {
  'en revision': 'bg-amber-100 text-amber-800 border-amber-200',
  revisado: 'bg-blue-100 text-blue-800 border-blue-200',
  hecho: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
};

export default function GestionCitas({ titulo = 'Gestión de Citas de Servicios' }) {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [ordenarPor, setOrdenarPor] = useState('recientes');
  const [actualizandoId, setActualizandoId] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const cargarCitas = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const res = await api.get('/citas');
      if (res.data?.ok) {
        setCitas(res.data.citas || []);
      } else {
        setCitas(res.data?.citas || []);
      }
    } catch (err) {
      console.error('Error cargando citas:', err);
      setError('No se pudieron cargar las citas de servicios.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  const handleCambiarEstado = async (citaId, nuevoEstado) => {
    try {
      setActualizandoId(citaId);
      const res = await api.patch(`/citas/${citaId}/estado`, { estado: nuevoEstado });
      if (res.data?.ok) {
        setCitas((prev) =>
          prev.map((c) => (c.id === citaId ? { ...c, estado: nuevoEstado } : c))
        );
        setMensaje(`Cita #${citaId} actualizada a "${nuevoEstado}".`);
        setTimeout(() => setMensaje(null), 3000);
      }
    } catch (err) {
      console.error('Error cambiando estado de cita:', err);
      alert('Error al actualizar el estado de la cita.');
    } finally {
      setActualizandoId(null);
    }
  };

  const serviciosUnicos = useMemo(() => {
    const set = new Set(citas.map((c) => (c.servicio_nombre || '').trim()).filter(Boolean));
    return Array.from(set);
  }, [citas]);

  const totalCitas = citas.length;
  const totalEnRevision = useMemo(
    () => citas.filter((c) => (c.estado || '').toLowerCase() === 'en revision').length,
    [citas]
  );
  const totalHechas = useMemo(
    () => citas.filter((c) => ['hecho', 'revisado'].includes((c.estado || '').toLowerCase())).length,
    [citas]
  );
  const totalCanceladas = useMemo(
    () => citas.filter((c) => (c.estado || '').toLowerCase() === 'cancelado').length,
    [citas]
  );

  const hayFiltrosActivos =
    busqueda.trim() !== '' || filtroEstado !== 'todos' || ordenarPor !== 'recientes';

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('todos');
    setOrdenarPor('recientes');
  };

  const citasFiltradas = useMemo(() => {
    let resultado = [...citas];

    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(
        (c) => (c.estado || '').toLowerCase() === filtroEstado.toLowerCase()
      );
    }

    const q = busqueda.toLowerCase().trim();
    if (q) {
      resultado = resultado.filter((c) => {
        const campos = [
          c.id,
          c.servicio_nombre,
          c.cliente_nombre,
          c.cliente_email,
          c.cliente_telefono,
          c.fecha_cita,
          c.hora_cita,
          c.estado,
        ];
        return campos.some((campo) => String(campo || '').toLowerCase().includes(q));
      });
    }

    switch (ordenarPor) {
      case 'recientes':
        resultado.sort((a, b) => {
          const fa = `${a.fecha_cita || ''} ${a.hora_cita || ''}`;
          const fb = `${b.fecha_cita || ''} ${b.hora_cita || ''}`;
          if (fa && fb) return fb.localeCompare(fa);
          return Number(b.id || 0) - Number(a.id || 0);
        });
        break;
      case 'antiguos':
        resultado.sort((a, b) => {
          const fa = `${a.fecha_cita || ''} ${a.hora_cita || ''}`;
          const fb = `${b.fecha_cita || ''} ${b.hora_cita || ''}`;
          if (fa && fb) return fa.localeCompare(fb);
          return Number(a.id || 0) - Number(b.id || 0);
        });
        break;
      case 'precio_desc':
        resultado.sort((a, b) => Number(b.servicio_precio || 0) - Number(a.servicio_precio || 0));
        break;
      case 'precio_asc':
        resultado.sort((a, b) => Number(a.servicio_precio || 0) - Number(b.servicio_precio || 0));
        break;
      case 'cliente_az':
        resultado.sort((a, b) =>
          String(a.cliente_nombre || '').localeCompare(String(b.cliente_nombre || ''))
        );
        break;
      default:
        break;
    }

    return resultado;
  }, [citas, filtroEstado, busqueda, ordenarPor]);

  const getBadgeStyle = (estado) => {
    const key = String(estado || '').toLowerCase();
    return (
      ESTILOS_ESTADO[key] || 'bg-gray-100 text-gray-800 border-gray-200'
    );
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-bold text-sky-50 border border-white/20 mb-3">
                <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                AGENDA DE SERVICIOS
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-sm">{titulo}</h1>
              <p className="text-sm text-sky-50 mt-2 max-w-2xl">
                Supervisa las citas agendadas por los clientes, filtra por estado y actualiza el progreso de cada servicio técnico.
              </p>
            </div>
            <button
              onClick={cargarCitas}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white text-sm font-bold hover:bg-white/20 shadow-sm transition-colors self-start sm:self-auto"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Actualizar lista
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-sky-100">Total Citas</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{totalCitas}</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-sky-100">En Revisión</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-200 mt-1">{totalEnRevision}</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-sky-100">Finalizadas</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-200 mt-1">{totalHechas}</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-sky-100">Canceladas</p>
              <p className="text-2xl sm:text-3xl font-black text-red-200 mt-1">{totalCanceladas}</p>
            </div>
          </div>
        </div>
      </div>

      {mensaje && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {mensaje}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                filtroEstado === 'todos'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/25'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todas ({totalCitas})
            </button>
            {ESTADOS.map((est) => {
              const cont = citas.filter(
                (c) => (c.estado || '').toLowerCase() === est.value
              ).length;
              return (
                <button
                  key={est.value}
                  onClick={() => setFiltroEstado(est.value)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    filtroEstado === est.value
                      ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/25'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {est.label} ({cont})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="recientes">Orden: Más recientes</option>
              <option value="antiguos">Orden: Más antiguas</option>
              <option value="precio_desc">Orden: Precio mayor a menor</option>
              <option value="precio_asc">Orden: Precio menor a mayor</option>
              <option value="cliente_az">Orden: Cliente A - Z</option>
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
              placeholder="Buscar por #cita, servicio, cliente, email, teléfono, fecha u hora..."
              className="w-full pl-11 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">
                Estado: {ESTADOS.find((e) => e.value === filtroEstado)?.label || filtroEstado}
                <button onClick={() => setFiltroEstado('todos')} className="hover:text-sky-900 ml-0.5">✕</button>
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
                    antiguos: 'Más antiguas',
                    precio_desc: 'Precio ↓',
                    precio_asc: 'Precio ↑',
                    cliente_az: 'Cliente A-Z',
                  }[ordenarPor]
                }
                <button onClick={() => setOrdenarPor('recientes')} className="hover:text-purple-900 ml-0.5">✕</button>
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-semibold ml-auto">
              Mostrando {citasFiltradas.length} de {totalCitas} citas
            </span>
          </div>
        )}
      </div>

      {cargando ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100">
          <div className="animate-spin w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-semibold">Cargando citas agendadas...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-2xl text-center text-sm font-semibold border border-red-200">
          {error}
        </div>
      ) : citas.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-300 shadow-sm space-y-3">
          <div className="text-5xl">📅</div>
          <h3 className="font-bold text-slate-700 text-lg">No hay citas registradas</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Los clientes aún no han agendado citas de servicio técnico. Cuando lo hagan aparecerán aquí.
          </p>
        </div>
      ) : citasFiltradas.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-amber-200 bg-amber-50/40 shadow-sm space-y-3">
          <div className="text-5xl">🔍</div>
          <h3 className="font-bold text-slate-700 text-base">Sin citas que coincidan con los filtros</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Hay {totalCitas} citas en total pero ninguna coincide con tu búsqueda actual. Intenta limpiar los filtros.
          </p>
          <button
            onClick={limpiarFiltros}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 shadow-md shadow-sky-600/20 transition-all"
          >
            Quitar todos los filtros
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-sky-50/50 border-b border-slate-200 text-xs text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Cita</th>
                  <th className="px-6 py-4">Servicio</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-center">Cambiar Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {citasFiltradas.map((cita) => {
                  const isUpdating = actualizandoId === cita.id;
                  return (
                    <tr key={cita.id} className="hover:bg-sky-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-black text-sky-600 rounded-lg bg-sky-50 px-2.5 py-1 text-xs border border-sky-200">
                          #{cita.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{cita.servicio_nombre}</div>
                        <span className="text-xs text-emerald-600 font-semibold mt-0.5 inline-block">
                          {formatPrice(cita.servicio_precio)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{cita.cliente_nombre}</div>
                        {cita.cliente_email && <div className="text-xs text-slate-500 mt-0.5">{cita.cliente_email}</div>}
                        {cita.cliente_telefono && <div className="text-xs text-slate-400 mt-0.5">{cita.cliente_telefono}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{cita.fecha_cita || 'Sin fecha'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">🕒 {cita.hora_cita || 'Sin hora'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(cita.estado)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {cita.estado || 'Sin estado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <select
                          value={cita.estado || ''}
                          disabled={isUpdating}
                          onChange={(e) => handleCambiarEstado(cita.id, e.target.value)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm outline-none cursor-pointer focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <option value="en revision">En revisión</option>
                          <option value="revisado">Revisado</option>
                          <option value="hecho">Hecho</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                        {isUpdating && (
                          <div className="mt-1 text-[10px] text-sky-600 font-bold flex items-center justify-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                            Actualizando...
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
