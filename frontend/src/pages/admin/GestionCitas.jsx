import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatPrice } from '../../context/CartContext';

const ESTADOS = [
  { value: 'en revision', label: 'En revisión' },
  { value: 'revisado', label: 'Revisado' },
  { value: 'hecho', label: 'Hecho' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default function GestionCitas({ titulo = 'Gestión de Citas de Servicios' }) {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [actualizandoId, setActualizandoId] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const cargarCitas = async () => {
    try {
      setCargando(true);
      setError(null);
      const res = await api.get('/citas', {
        params: {
          estado: filtroEstado !== 'todos' ? filtroEstado : undefined,
          q: busqueda || undefined,
        },
      });
      if (res.data?.ok) {
        setCitas(res.data.citas || []);
      }
    } catch (err) {
      console.error('Error cargando citas:', err);
      setError('No se pudieron cargar las citas de servicios.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, [filtroEstado]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">{titulo}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Supervisa los servicios agendados por clientes y actualiza su estado.
          </p>
        </div>
        <button
          onClick={cargarCitas}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 shadow-sm"
        >
          Actualizar lista
        </button>
      </div>

      {mensaje && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          {mensaje}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-custom-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroEstado === 'todos'
                ? 'bg-accent text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas ({citas.length})
          </button>
          {ESTADOS.map((est) => (
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

        <div className="w-full md:w-64">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cargarCitas()}
            placeholder="Buscar por cliente o servicio..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:border-accent outline-none"
          />
        </div>
      </div>

      {/* Tabla de Citas */}
      {cargando ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100">
          <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Cargando citas agendadas...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-2xl text-center text-sm">{error}</div>
      ) : citas.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <h3 className="font-bold text-text-heading text-base">No hay citas registradas</h3>
          <p className="text-gray-400 text-xs mt-1">Los clientes aún no han agendado citas de servicio.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-custom-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-xs text-gray-500 uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Cita</th>
                  <th className="px-6 py-4">Servicio</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-center">Cambiar Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {citas.map((cita) => {
                  const isUpdating = actualizandoId === cita.id;
                  return (
                    <tr key={cita.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-accent">#{cita.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-heading">{cita.servicio_nombre}</div>
                        <span className="text-xs text-emerald-600 font-semibold">{formatPrice(cita.servicio_precio)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-heading">{cita.cliente_nombre}</div>
                        <div className="text-xs text-gray-400">{cita.cliente_email}</div>
                        <div className="text-xs text-gray-500">{cita.cliente_telefono}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-text-heading">{cita.fecha_cita}</div>
                        <div className="text-xs text-gray-500">{cita.hora_cita}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(cita.estado)}`}>
                          {cita.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <select
                          value={cita.estado}
                          disabled={isUpdating}
                          onChange={(e) => handleCambiarEstado(cita.id, e.target.value)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm outline-none cursor-pointer"
                        >
                          <option value="en revision">En revisión</option>
                          <option value="revisado">Revisado</option>
                          <option value="hecho">Hecho</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
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
