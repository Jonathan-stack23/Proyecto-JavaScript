import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ESTILOS_ESTADO_PQR = {
  pendiente: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    icono: '⏳',
    nombre: 'Pendiente',
  },
  'en proceso': {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    icono: '⚙️',
    nombre: 'En Proceso',
  },
  respondida: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icono: '✅',
    nombre: 'Respondida',
  },
  cerrada: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    icono: '🔒',
    nombre: 'Cerrada',
  },
};

function ClientePQR() {
  const { user } = useAuth();
  const [pqrs, setPqrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [radicadoCreado, setRadicadoCreado] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    tipo: 'peticion',
    asunto: '',
    descripcion: '',
    prioridad: 'media',
  });

  // Búsqueda rápida por radicado
  const [busquedaRadicado, setBusquedaRadicado] = useState('');
  const [pqrEncontrada, setPqrEncontrada] = useState(null);
  const [buscandoRadicado, setBuscandoRadicado] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState(null);

  const cargarMisPqr = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pqr/mis-pqr');
      if (res.data?.ok) {
        setPqrs(res.data.pqrs || []);
      }
    } catch (err) {
      console.error('Error al cargar PQR:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMisPqr();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadicar = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.asunto.trim() || !formData.descripcion.trim()) {
      setErrorMsg('Por favor completa el asunto y el detalle de tu solicitud.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        tipo: formData.tipo,
        asunto: formData.asunto.trim(),
        descripcion: formData.descripcion.trim(),
        prioridad: formData.prioridad,
        cliente_nombre: `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Cliente',
        cliente_email: user?.email || '',
        cliente_telefono: user?.telefono || '',
      };

      const res = await api.post('/pqr', payload);
      if (res.data?.ok && res.data.pqr) {
        setRadicadoCreado(res.data.pqr.numero_radicado);
        setFormData({
          tipo: 'peticion',
          asunto: '',
          descripcion: '',
          prioridad: 'media',
        });
        cargarMisPqr();
      }
    } catch (err) {
      console.error('Error al radicar PQR:', err);
      const detalle = err.response?.data?.detail;
      setErrorMsg(typeof detalle === 'string' ? detalle : 'Error al registrar tu solicitud. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuscarPorRadicado = async (e) => {
    e.preventDefault();
    const codigo = busquedaRadicado.trim().toUpperCase();
    if (!codigo) return;

    try {
      setBuscandoRadicado(true);
      setErrorBusqueda(null);
      setPqrEncontrada(null);
      const res = await api.get(`/pqr/radicado/${codigo}`);
      if (res.data?.ok && res.data.pqr) {
        setPqrEncontrada(res.data.pqr);
      }
    } catch (err) {
      setErrorBusqueda(`No se encontró ninguna solicitud con el radicado ${codigo}`);
    } finally {
      setBuscandoRadicado(false);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Banner Principal */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-2">
              <span>📬</span> Centro de Atención Ciudadana
            </span>
            <h1 className="text-2xl md:text-3xl font-black">Peticiones, Quejas y Reclamos (PQR)</h1>
            <p className="text-white/85 text-sm max-w-xl mt-1">
              Tu opinión y satisfacción son nuestra prioridad. Radica una solicitud con número de seguimiento oficial o consulta el avance de tus casos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-center min-w-[110px]">
              <p className="text-2xl font-black">{pqrs.length}</p>
              <p className="text-[11px] font-medium text-white/80 uppercase tracking-wider">Tus Solicitudes</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-center min-w-[110px]">
              <p className="text-2xl font-black">
                {pqrs.filter((p) => p.estado === 'respondida' || p.estado === 'cerrada').length}
              </p>
              <p className="text-[11px] font-medium text-white/80 uppercase tracking-wider">Atendidas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Radicado Exitoso */}
      {radicadoCreado && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-400 bg-emerald-50 p-6 shadow-md animate-fadeIn flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-lg shadow-emerald-500/30">
              ✓
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-200/60 px-2 py-0.5 rounded-full">
                Solicitud Radicada con Éxito
              </span>
              <h2 className="text-lg font-black text-emerald-950 mt-1">
                Número Oficial de Radicado: <span className="text-emerald-700 font-mono tracking-wide">{radicadoCreado}</span>
              </h2>
              <p className="text-xs sm:text-sm text-emerald-800/80 mt-1">
                Hemos asignado este consecutivo único a tu caso. Nuestro equipo responderá tu solicitud en un plazo máximo de 48 horas hábiles.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRadicadoCreado(null)}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Layout en dos columnas: Radicar PQR y Consulta Rápida */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Formulario de Radicación (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">
              ✍️
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Radicar una Nueva Solicitud</h2>
              <p className="text-xs text-gray-500">Completa el formulario para iniciar la gestión</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleRadicar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Tipo de Solicitud *
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                >
                  <option value="peticion">Petición (Solicitud de información / trámite)</option>
                  <option value="queja">Queja (Inconformidad con la atención)</option>
                  <option value="reclamo">Reclamo (Problema con producto o servicio)</option>
                  <option value="sugerencia">Sugerencia (Propuesta de mejora)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Prioridad Estimada
                </label>
                <select
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                >
                  <option value="baja">Baja (Sin urgencia)</option>
                  <option value="media">Media (Atención estándar)</option>
                  <option value="alta">Alta (Urgente / Garantía crítica)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Asunto Principal *
              </label>
              <input
                type="text"
                name="asunto"
                value={formData.asunto}
                onChange={handleChange}
                placeholder="Ej: Inconveniente con el despacho de mi pedido #12"
                className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                maxLength={150}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Descripción Detallada *
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={4}
                placeholder="Describe claramente los hechos, números de pedido o servicio técnico relacionado, fechas y tu requerimiento puntual..."
                className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Radicando...
                  </>
                ) : (
                  <>
                    <span>📨</span> Radicar PQR Oficial
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Columna Derecha: Búsqueda Rápida por Radicado (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center text-xl">
                🔍
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Consultar Estado de Radicado</h2>
                <p className="text-xs text-gray-500">Ingresa tu código único de seguimiento</p>
              </div>
            </div>

            <form onSubmit={handleBuscarPorRadicado} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={busquedaRadicado}
                  onChange={(e) => setBusquedaRadicado(e.target.value)}
                  placeholder="PQR-2026-0001"
                  className="flex-1 rounded-2xl border border-gray-200 px-3.5 py-2 text-sm uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <button
                  type="submit"
                  disabled={buscandoRadicado}
                  className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {buscandoRadicado ? '...' : 'Buscar'}
                </button>
              </div>
            </form>

            {errorBusqueda && (
              <p className="mt-3 text-xs text-red-600 font-medium">{errorBusqueda}</p>
            )}

            {pqrEncontrada && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800">{pqrEncontrada.numero_radicado}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] border ${ESTILOS_ESTADO_PQR[pqrEncontrada.estado]?.badge || 'bg-gray-100'}`}>
                    {pqrEncontrada.estado}
                  </span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{pqrEncontrada.asunto}</p>
                <p className="text-slate-600 line-clamp-2">{pqrEncontrada.descripcion}</p>
                {pqrEncontrada.respuesta ? (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <p className="font-bold text-[11px] mb-1">Respuesta del Asesor:</p>
                    <p className="text-[11px]">{pqrEncontrada.respuesta}</p>
                  </div>
                ) : (
                  <p className="text-amber-700 italic text-[11px]">En revisión por el equipo de soporte.</p>
                )}
              </div>
            )}
          </div>

          {/* Tarjeta de Información de Contacto / Derechos */}
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-3xl p-6 border border-emerald-100">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Garantías y Plazos de Ley</h3>
            <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Peticiones de información:</strong> Respuesta en 24 a 48 horas hábiles.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Reclamos y garantías:</strong> Diagnóstico inicial en menos de 3 días hábiles.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>También puedes consultar el estado desde nuestro <strong>Chatbot virtual</strong> ingresando tu radicado.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Historial de PQR del Cliente */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Historial de Mis Solicitudes</h2>
            <p className="text-xs text-gray-500">Revisa las respuestas y estado de tus casos radicados</p>
          </div>
          <button
            type="button"
            onClick={cargarMisPqr}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            🔄 Actualizar lista
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Cargando tus solicitudes...</div>
        ) : pqrs.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
            <p className="text-2xl mb-1">📭</p>
            No tienes ninguna solicitud PQR radicada actualmente.
          </div>
        ) : (
          <div className="space-y-4">
            {pqrs.map((pqr) => {
              const infoEstado = ESTILOS_ESTADO_PQR[pqr.estado] || ESTILOS_ESTADO_PQR.pendiente;
              return (
                <div
                  key={pqr.id}
                  className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-emerald-200 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-wider">
                        {pqr.numero_radicado}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs uppercase">
                        {pqr.tipo}
                      </span>
                      <span className="text-xs text-gray-400">
                        {pqr.fecha_radicado ? new Date(pqr.fecha_radicado).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${infoEstado.badge}`}>
                      <span>{infoEstado.icono}</span>
                      <span className="uppercase tracking-wider text-[11px]">{infoEstado.nombre}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-gray-900">{pqr.asunto}</h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{pqr.descripcion}</p>
                  </div>

                  {/* Sección de respuesta del asesor si ya fue respondida */}
                  {pqr.respuesta && (
                    <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between font-bold text-emerald-800 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span>💬</span> Respuesta Oficial de Atención al Cliente:
                        </span>
                        {pqr.respondido_por_nombre && (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            Por: {pqr.respondido_por_nombre}
                          </span>
                        )}
                      </div>
                      <p className="text-emerald-900 leading-relaxed whitespace-pre-wrap">{pqr.respuesta}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientePQR;
