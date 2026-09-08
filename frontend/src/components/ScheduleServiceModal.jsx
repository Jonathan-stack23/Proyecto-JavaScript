import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../context/CartContext';
import api from '../services/api';

export default function ScheduleServiceModal({ servicio, isOpen, onClose }) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_email: '',
    cliente_telefono: '',
    fecha_cita: '',
    hora_cita: '09:00',
    direccion: '',
    notas: '',
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [citaExitosa, setCitaExitosa] = useState(null);

  // Pre-llenar datos del usuario autenticado si existen
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        cliente_nombre: `${user.nombre || ''} ${user.apellido || ''}`.trim(),
        cliente_email: user.email || '',
        cliente_telefono: user.telefono || '',
        direccion: user.direccion || '',
      }));
    }
  }, [user, isOpen]);

  // Restablecer estados al abrir/cerrar
  useEffect(() => {
    setError(null);
    setCitaExitosa(null);
  }, [isOpen, servicio]);

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

  // Fecha mínima = hoy
  const hoy = new Date();
  hoy.setDate(hoy.getDate() + 1);
  const minFecha = hoy.toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.cliente_nombre.trim() || !formData.cliente_email.trim() || !formData.cliente_telefono.trim()) {
      setError('Por favor completa todos tus datos de contacto.');
      return;
    }

    if (!formData.fecha_cita || !formData.hora_cita) {
      setError('Por favor selecciona la fecha y hora para la cita.');
      return;
    }

    try {
      setCargando(true);
      const res = await api.post('/citas', {
        servicio_id: servicio.id,
        cliente_nombre: formData.cliente_nombre,
        cliente_email: formData.cliente_email,
        cliente_telefono: formData.cliente_telefono,
        fecha_cita: formData.fecha_cita,
        hora_cita: formData.hora_cita,
        direccion: formData.direccion,
        notas: formData.notas,
      });

      if (res.data?.ok) {
        setCitaExitosa(res.data.cita);
      } else {
        setError(res.data?.message || 'No se pudo agendar la cita.');
      }
    } catch (err) {
      console.error('Error agendando cita:', err);
      setError(err.response?.data?.message || 'Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div
        className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden z-10 my-8 transition-all transform animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3 className="font-bold text-base">Agendar Cita de Servicio</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {citaExitosa ? (
          /* Estado de éxito */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 className="text-2xl font-extrabold text-text-heading">¡Cita Agendada Exitosamente!</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Hemos registrado tu solicitud para <strong>{servicio.nombre}</strong>. Un técnico se comunicará contigo para confirmar los detalles.
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left max-w-sm mx-auto text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Referencia:</span>
                <span className="font-bold text-text-heading">#{citaExitosa.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha:</span>
                <span className="font-semibold text-text-heading">{citaExitosa.fecha_cita}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Hora:</span>
                <span className="font-semibold text-text-heading">{citaExitosa.hora_cita}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estado inicial:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                  En revisión
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Podrás hacer seguimiento a tu servicio en tiempo real desde tu <strong>Panel de Cliente</strong>.
            </p>

            <div className="pt-3">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-accent text-white font-bold shadow-md hover:bg-accent-dark transition-all text-sm"
              >
                Aceptar y Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* Formulario */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Resumen del servicio */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-text-heading text-sm truncate">{servicio.nombre}</h4>
                <p className="text-xs text-gray-500">Duración: {servicio.duracion || '1-2 horas'}</p>
              </div>
              <span className="font-extrabold text-emerald-600 text-sm">
                {formatPrice(servicio.precio)}
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-heading mb-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="cliente_nombre"
                  value={formData.cliente_nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent-light outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-heading mb-1">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="cliente_email"
                  value={formData.cliente_email}
                  onChange={handleChange}
                  required
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent-light outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-heading mb-1">
                  Teléfono / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="cliente_telefono"
                  value={formData.cliente_telefono}
                  onChange={handleChange}
                  required
                  placeholder="+57 300 123 4567"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent-light outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-heading mb-1">
                  Dirección o Sede
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="A domicilio o en tienda"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent-light outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-heading mb-1">
                  Fecha de la Cita <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fecha_cita"
                  min={minFecha}
                  value={formData.fecha_cita}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent-light outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-heading mb-1">
                  Hora Preferida <span className="text-red-500">*</span>
                </label>
                <select
                  name="hora_cita"
                  value={formData.hora_cita}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent-light outline-none bg-white"
                >
                  <option value="08:00">08:00 AM</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="17:00">05:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-heading mb-1">
                Detalles o Síntomas del Equipo (Opcional)
              </label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                rows={2}
                placeholder="Describe brevemente la falla, marca o modelo..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent-light outline-none resize-none"
              ></textarea>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={cargando}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold shadow-md hover:bg-emerald-700 transition-all text-sm disabled:opacity-50"
              >
                {cargando ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    Procesando agendamiento...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Confirmar Agendamiento
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
