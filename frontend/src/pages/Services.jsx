import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatPrice } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ServiceDetailModal from '../components/ServiceDetailModal';
import ScheduleServiceModal from '../components/ScheduleServiceModal';

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80';

function Services() {
  const { hasRole } = useAuth();
  const esAdminOEmpleado = hasRole('Administrador') || hasRole('Empleado');
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Modales
  const [servicioDetalle, setServicioDetalle] = useState(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  const [servicioAgendar, setServicioAgendar] = useState(null);
  const [modalAgendarAbierto, setModalAgendarAbierto] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const { data } = await api.get('/servicios', { params: { activos: 'true' } });
        if (data?.ok) setServicios(data.servicios || []);
      } catch (err) {
        console.error('Error cargando servicios:', err);
        setError('No se pudieron cargar los servicios. Inténtalo más tarde.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const iniciales = (nombre, apellido) => {
    const n = nombre?.trim().charAt(0) || '';
    const a = apellido?.trim().charAt(0) || '';
    return (n + a).toUpperCase();
  };

  const handleAbrirDetalle = (s) => {
    setServicioDetalle(s);
    setModalDetalleAbierto(true);
  };

  const handleAbrirAgendar = (s) => {
    setServicioAgendar(s);
    setModalAgendarAbierto(true);
  };

  return (
    <div className="services-page">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-accent-light py-16 md:py-20">
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-emerald-200/40 blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-100 shadow-sm text-emerald-600 mb-4">
            Servicio Técnico Profesional
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-heading mb-4">
            Mantenimiento & Soporte Especializado
          </h2>
          <p className="text-text max-w-2xl mx-auto text-base md:text-lg">
            Diagnóstico, optimización y reparación de computadores y dispositivos móviles a cargo de técnicos calificados.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {cargando && (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin text-accent" width="36" height="36" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.2" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <p className="text-text text-sm">Cargando servicios...</p>
            </div>
          </div>
        )}

        {!cargando && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center max-w-2xl mx-auto">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {!cargando && !error && servicios.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 text-gray-500 rounded-2xl p-10 text-center max-w-2xl mx-auto">
            <p className="text-lg font-medium mb-2">No hay servicios disponibles</p>
            <p className="text-sm text-gray-400">Por favor vuelve a consultar más tarde.</p>
          </div>
        )}

        {!cargando && !error && servicios.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {servicios.map((s) => {
              const disponible = s.estado === 'activo';
              const empleadoNombre = s.empleado_nombre || 'Especialista';
              const empleadoApellido = s.empleado_apellido || 'Técnico';

              return (
                <article
                  key={s.id}
                  className={`group bg-white rounded-3xl overflow-hidden shadow-custom-sm ring-1 ring-gray-100 hover:shadow-custom-xl transition-all duration-300 flex flex-col ${
                    !disponible ? 'opacity-80' : ''
                  }`}
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                    <span
                      className={`absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm shadow-sm ${
                        disponible
                          ? 'bg-emerald-500/95 text-white'
                          : 'bg-gray-500/95 text-white'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          disponible ? 'bg-white animate-pulse' : 'bg-white/80'
                        }`}
                      ></span>
                      {disponible ? 'Disponible' : 'No disponible'}
                    </span>
                    {s.categoria && (
                      <span className="absolute top-4 right-4 z-10 inline-block px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-accent shadow-sm">
                        {s.categoria}
                      </span>
                    )}
                    <img
                      src={s.imagen_url || PLACEHOLDER_IMG}
                      alt={s.nombre}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_IMG;
                      }}
                    />
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-text-heading mb-2">{s.nombre}</h3>
                    <p className="text-sm text-text mb-5 leading-relaxed flex-1 line-clamp-2">
                      {s.descripcion || 'Sin descripción disponible.'}
                    </p>

                    <div className="flex items-center flex-wrap gap-3 mb-5 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent-light text-accent text-sm font-semibold">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        {formatPrice(s.precio)}
                      </div>
                      {s.duracion && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {s.duracion}
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-100 mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-emerald-500 flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">
                          {iniciales(empleadoNombre, empleadoApellido) || 'TM'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">
                            Técnico Responsable
                          </p>
                          <h4 className="font-bold text-text-heading truncate text-sm">
                            {empleadoNombre} {empleadoApellido}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">Atención personalizada y garantizada</p>
                        </div>
                      </div>
                    </div>

                    {/* BOTONES DE ACCIÓN: VER DETALLES Y AGENDAR SERVICIO */}
                    <div className={`grid gap-3 ${esAdminOEmpleado ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      <button
                        type="button"
                        onClick={() => handleAbrirDetalle(s)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        Ver detalles
                      </button>

                      {!esAdminOEmpleado && (
                      <button
                        type="button"
                        onClick={() => handleAbrirAgendar(s)}
                        disabled={!disponible}
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] ${
                          disponible
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Agendar
                      </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Ver Detalles del Servicio */}
      <ServiceDetailModal
        servicio={servicioDetalle}
        isOpen={modalDetalleAbierto}
        onClose={() => {
          setModalDetalleAbierto(false);
          setServicioDetalle(null);
        }}
        onAgendar={!esAdminOEmpleado ? (s) => { handleAbrirAgendar(s); } : null}
        showAgendar={!esAdminOEmpleado}
      />

      {/* Modal Agendar Servicio */}
      <ScheduleServiceModal
        servicio={servicioAgendar}
        isOpen={modalAgendarAbierto}
        onClose={() => {
          setModalAgendarAbierto(false);
          setServicioAgendar(null);
        }}
      />
    </div>
  );
}

export default Services;
