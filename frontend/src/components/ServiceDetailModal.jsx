import { useEffect } from 'react';
import { formatPrice } from '../context/CartContext';

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80';

export default function ServiceDetailModal({ servicio, isOpen, onClose, onAgendar, showAgendar = true }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !servicio) return null;

  const disponible = servicio.estado === 'activo';
  const empleadoNombre = servicio.empleado_nombre || 'Especialista MiTienda';
  const empleadoApellido = servicio.empleado_apellido || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden z-10 my-8 transition-all transform animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Detalles del Servicio Técnico
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Imagen de encabezado */}
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
            <span
              className={`absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                disponible ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
              }`}
            >
              {disponible ? 'Servicio Disponible' : 'No disponible'}
            </span>
            {servicio.categoria && (
              <span className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-accent shadow-sm">
                {servicio.categoria}
              </span>
            )}
            <img
              src={servicio.imagen_url || PLACEHOLDER_IMG}
              alt={servicio.nombre}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = PLACEHOLDER_IMG;
              }}
            />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-text-heading mb-2">
              {servicio.nombre}
            </h2>

            <div className="flex items-center flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-accent-light text-accent font-bold text-base">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                {formatPrice(servicio.precio)}
              </div>
              {servicio.duracion && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Duración estimada: {servicio.duracion}
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Descripción completa
              </h4>
              <p className="text-sm text-text leading-relaxed whitespace-pre-line">
                {servicio.descripcion || 'Este servicio incluye diagnóstico profesional, revisión por técnicos especializados y garantía de satisfacción.'}
              </p>
            </div>

            {/* Responsable */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {empleadoNombre.charAt(0)}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-emerald-700 font-bold">
                  Técnico Asignado
                </p>
                <h4 className="font-bold text-text-heading text-sm">
                  {empleadoNombre} {empleadoApellido}
                </h4>
                <p className="text-xs text-gray-500">Certificado por MiTienda en soporte de hardware y software</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              Cerrar
            </button>
            {showAgendar && (
            <button
              onClick={() => {
                onClose();
                if (onAgendar) onAgendar(servicio);
              }}
              disabled={!disponible}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-bold shadow-md hover:bg-accent-dark hover:shadow-lg transition-all disabled:opacity-50 text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Agendar este servicio ahora
            </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
