import { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';

const ESTILOS_ESTADO = {
  pendiente: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Pendiente',
  },
  'en proceso': {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
    label: 'En Proceso',
  },
  respondida: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Respondida',
  },
  cerrada: {
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    dot: 'bg-slate-400',
    label: 'Cerrada',
  },
};

const ESTILOS_PRIORIDAD = {
  alta: 'bg-rose-100 text-rose-700 border-rose-200 font-bold',
  media: 'bg-amber-50 text-amber-700 border-amber-200',
  baja: 'bg-slate-100 text-slate-600 border-slate-200',
};

function GestionPQR() {
  const [pqrs, setPqrs] = useState([]);
  const [resumen, setResumen] = useState({ total: 0, pendientes: 0, en_proceso: 0, respondidas: 0, cerradas: 0 });
  const [loading, setLoading] = useState(true);
  const [respuesta, setRespuesta] = useState({});
  const [estadoSeleccionado, setEstadoSeleccionado] = useState({});
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [enviando, setEnviando] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pqr');
      if (response.data?.ok) {
        setPqrs(response.data.pqrs || []);
        if (response.data.resumen) {
          setResumen(response.data.resumen);
        }
      }
    } catch (error) {
      console.error('Error cargando PQR', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (id) => {
    const text = (respuesta[id] || '').trim();
    const targetState = estadoSeleccionado[id] || 'respondida';
    if (!text) return;

    try {
      setEnviando((prev) => ({ ...prev, [id]: true }));
      await api.patch(`/pqr/${id}/responder`, {
        respuesta: text,
        estado: targetState,
      });
      setRespuesta((prev) => ({ ...prev, [id]: '' }));
      load();
    } catch (error) {
      console.error('Error respondiendo PQR', error);
    } finally {
      setEnviando((prev) => ({ ...prev, [id]: false }));
    }
  };

  const pqrsFiltradas = useMemo(() => {
    let result = [...pqrs];
    if (filtroEstado !== 'todas') {
      result = result.filter((p) => p.estado.toLowerCase() === filtroEstado.toLowerCase());
    }
    const q = busqueda.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (p) =>
          p.numero_radicado.toLowerCase().includes(q) ||
          p.cliente_nombre.toLowerCase().includes(q) ||
          p.cliente_email.toLowerCase().includes(q) ||
          p.asunto.toLowerCase().includes(q)
      );
    }
    return result;
  }, [pqrs, filtroEstado, busqueda]);

  if (loading) {
    return <div className="py-20 text-center text-slate-400 font-medium">Cargando bandeja de PQR...</div>;
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">Bandeja de Gestión PQR</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Atención, seguimiento y respuesta a peticiones, quejas, reclamos y sugerencias.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-sm cursor-pointer"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Radicadas</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{pqrs.length}</p>
        </div>
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 shadow-sm">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pendientes</p>
          <p className="text-2xl font-black text-amber-900 mt-1">
            {pqrs.filter((p) => p.estado === 'pendiente').length}
          </p>
        </div>
        <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 shadow-sm">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">En Proceso</p>
          <p className="text-2xl font-black text-blue-900 mt-1">
            {pqrs.filter((p) => p.estado === 'en proceso').length}
          </p>
        </div>
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Respondidas / Cerradas</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">
            {pqrs.filter((p) => p.estado === 'respondida' || p.estado === 'cerrada').length}
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'pendiente', label: 'Pendientes' },
            { id: 'en proceso', label: 'En Proceso' },
            { id: 'respondida', label: 'Respondidas' },
            { id: 'cerrada', label: 'Cerradas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroEstado === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por radicado, cliente o asunto..."
            className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Lista de Solicitudes */}
      <div className="space-y-4">
        {pqrsFiltradas.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
            <p className="text-3xl mb-2">📭</p>
            No se encontraron solicitudes PQR con los criterios seleccionados.
          </div>
        ) : (
          pqrsFiltradas.map((pqr) => {
            const estilo = ESTILOS_ESTADO[pqr.estado] || ESTILOS_ESTADO.pendiente;
            const estiloPrio = ESTILOS_PRIORIDAD[pqr.prioridad] || ESTILOS_PRIORIDAD.media;
            const targetState = estadoSeleccionado[pqr.id] || (pqr.estado === 'pendiente' ? 'respondida' : pqr.estado);

            return (
              <div key={pqr.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-xl bg-slate-900 text-white font-mono text-xs font-bold px-3 py-1 tracking-wider">
                      {pqr.numero_radicado}
                    </span>
                    <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 uppercase">
                      {pqr.tipo}
                    </span>
                    <span className={`rounded-xl px-2 py-0.5 text-[11px] border uppercase ${estiloPrio}`}>
                      Prioridad: {pqr.prioridad}
                    </span>
                    <span className="text-xs text-slate-400">
                      {pqr.fecha_radicado ? new Date(pqr.fecha_radicado).toLocaleString('es-CO') : ''}
                    </span>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border self-start md:self-auto flex items-center gap-1.5 ${estilo.badge}`}>
                    <span className={`w-2 h-2 rounded-full ${estilo.dot}`} />
                    {estilo.label}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-800">{pqr.asunto}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                    <span><strong>Cliente:</strong> {pqr.cliente_nombre}</span>
                    <span><strong>Email:</strong> {pqr.cliente_email}</span>
                    {pqr.cliente_telefono && <span><strong>Tel:</strong> {pqr.cliente_telefono}</span>}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed">
                  {pqr.descripcion}
                </div>

                {/* Respuesta previa registrada */}
                {pqr.respuesta && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center justify-between font-bold text-emerald-900 mb-1">
                      <span>✓ Respuesta Registrada:</span>
                      {pqr.respondido_por_nombre && (
                        <span className="text-emerald-700 font-medium text-[11px]">
                          Atendido por: {pqr.respondido_por_nombre}
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{pqr.respuesta}</p>
                    {pqr.fecha_respuesta && (
                      <p className="text-[10px] text-emerald-700 mt-1 italic">
                        Fecha: {new Date(pqr.fecha_respuesta).toLocaleString('es-CO')}
                      </p>
                    )}
                  </div>
                )}

                {/* Formulario de Respuesta y Cambio de Estado */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <label className="text-xs font-bold text-slate-700">
                      {pqr.respuesta ? 'Actualizar Respuesta / Estado:' : 'Redactar Respuesta Oficial:'}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Asignar Estado:</span>
                      <select
                        value={targetState}
                        onChange={(e) => setEstadoSeleccionado((prev) => ({ ...prev, [pqr.id]: e.target.value }))}
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-bold bg-white focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="en proceso">⚙️ En Proceso</option>
                        <option value="respondida">✅ Respondida</option>
                        <option value="cerrada">🔒 Cerrada</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    value={respuesta[pqr.id] ?? ''}
                    onChange={(e) => setRespuesta((prev) => ({ ...prev, [pqr.id]: e.target.value }))}
                    rows="3"
                    placeholder="Escribe la respuesta formal para el cliente..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={enviando[pqr.id] || !(respuesta[pqr.id] || '').trim()}
                      onClick={() => respond(pqr.id)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-40"
                    >
                      {enviando[pqr.id] ? 'Guardando...' : 'Registrar Respuesta y Notificar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default GestionPQR;
