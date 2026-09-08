import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

/* ────────────────────────────────────────────
   Helpers
──────────────────────────────────────────── */
const TIPOS_DOCUMENTO = ['CC', 'TI', 'CE', 'Pasaporte', 'NIT']

const soloLetras = (s) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(s)
const soloNumeros = (s) => /^[0-9]+$/.test(s)
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

function InputField({ label, id, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Alert({ type, message, onClose }) {
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }
  const icons = {
    success: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    error: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  }
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${styles[type]} animate-fade-in`}>
      <span className="mt-0.5 flex-shrink-0">{icons[type]}</span>
      <p className="flex-1">{message}</p>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────
   Main Component
──────────────────────────────────────────── */
function PerfilUsuario({ backLink, backLabel = '← Volver al inicio' }) {
  const { user, updateProfile, getProfile } = useAuth()

  /* ─── State: Datos personales ─── */
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: '',
    numero_documento: '',
    direccion: '',
    telefono: '',
    email: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [formTouched, setFormTouched] = useState({})
  const [savingDatos, setSavingDatos] = useState(false)
  const [alertDatos, setAlertDatos] = useState(null)

  /* ─── State: Cambio de contraseña ─── */
  const [passForm, setPassForm] = useState({
    password_actual: '',
    nueva_password: '',
    confirmar_password: '',
  })
  const [passErrors, setPassErrors] = useState({})
  const [passTouched, setPassTouched] = useState({})
  const [savingPass, setSavingPass] = useState(false)
  const [alertPass, setAlertPass] = useState(null)
  const [showPass, setShowPass] = useState({ actual: false, nueva: false, confirmar: false })

  /* ─── Load profile on mount ─── */
  useEffect(() => {
    getProfile().catch(() => {})
  }, []) // eslint-disable-line

  /* ─── Sync user into form ─── */
  useEffect(() => {
    if (user) {
      setForm({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        tipo_documento: user.tipo_documento || user.tipoDocumento || '',
        numero_documento: user.numero_documento || user.numeroDocumento || '',
        direccion: user.direccion || '',
        telefono: user.telefono || '',
        email: user.email || '',
      })
    }
  }, [user])

  /* ════════════════════════════════
     VALIDACIÓN: Datos personales
  ════════════════════════════════ */
  const validateForm = (data = form) => {
    const e = {}
    if (!data.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    else if (data.nombre.trim().length < 2) e.nombre = 'Mínimo 2 caracteres'
    else if (!soloLetras(data.nombre.trim())) e.nombre = 'Solo letras y espacios'

    if (!data.apellido.trim()) e.apellido = 'El apellido es obligatorio'
    else if (data.apellido.trim().length < 2) e.apellido = 'Mínimo 2 caracteres'
    else if (!soloLetras(data.apellido.trim())) e.apellido = 'Solo letras y espacios'

    if (!data.tipo_documento) e.tipo_documento = 'Selecciona un tipo de documento'

    if (!data.numero_documento.trim()) e.numero_documento = 'El número de documento es obligatorio'
    else if (!soloNumeros(data.numero_documento)) e.numero_documento = 'Solo números'
    else if (data.numero_documento.length < 5) e.numero_documento = 'Mínimo 5 dígitos'

    if (!data.direccion.trim()) e.direccion = 'La dirección es obligatoria'
    else if (data.direccion.trim().length < 5) e.direccion = 'Mínimo 5 caracteres'

    if (!data.telefono.trim()) e.telefono = 'El teléfono es obligatorio'
    else if (!soloNumeros(data.telefono.replace(/[\s\-+]/g, ''))) e.telefono = 'Solo números'
    else if (data.telefono.replace(/[\s\-+]/g, '').length < 7) e.telefono = 'Mínimo 7 dígitos'

    if (!data.email.trim()) e.email = 'El correo es obligatorio'
    else if (!emailRegex.test(data.email.trim())) e.email = 'Correo inválido'

    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  /* ════════════════════════════════
     VALIDACIÓN: Contraseña
  ════════════════════════════════ */
  const validatePass = (data = passForm) => {
    const e = {}
    if (!data.password_actual) e.password_actual = 'Ingresa tu contraseña actual'

    if (!data.nueva_password) e.nueva_password = 'La nueva contraseña es obligatoria'
    else if (data.nueva_password.length < 8) e.nueva_password = 'Mínimo 8 caracteres'
    else if (!/[A-Z]/.test(data.nueva_password)) e.nueva_password = 'Al menos una mayúscula'
    else if (!/[a-z]/.test(data.nueva_password)) e.nueva_password = 'Al menos una minúscula'
    else if (!/[0-9]/.test(data.nueva_password)) e.nueva_password = 'Al menos un número'

    if (!data.confirmar_password) e.confirmar_password = 'Confirma la contraseña'
    else if (data.nueva_password !== data.confirmar_password) e.confirmar_password = 'Las contraseñas no coinciden'

    setPassErrors(e)
    return Object.keys(e).length === 0
  }

  /* ════════════════════════════════
     Handlers: Datos personales
  ════════════════════════════════ */
  const handleChange = (e) => {
    const { name, value } = e.target
    const next = { ...form, [name]: value }
    setForm(next)
    if (formTouched[name]) validateForm(next)
  }

  const handleBlur = (e) => {
    setFormTouched((p) => ({ ...p, [e.target.name]: true }))
    validateForm()
  }

  const handleSubmitDatos = async (e) => {
    e.preventDefault()
    const allTouched = Object.keys(form).reduce((a, k) => ({ ...a, [k]: true }), {})
    setFormTouched(allTouched)
    if (!validateForm()) return

    setSavingDatos(true)
    setAlertDatos(null)
    try {
      const res = await updateProfile({
        nombre: form.nombre,
        apellido: form.apellido,
        tipo_documento: form.tipo_documento,
        numero_documento: form.numero_documento,
        direccion: form.direccion,
        telefono: form.telefono,
        email: form.email,
      })
      if (res.ok) {
        setAlertDatos({ type: 'success', message: '¡Datos actualizados correctamente!' })
      } else {
        const msg = res.errors
          ? Object.values(res.errors).join(' · ')
          : res.message || 'Error al actualizar.'
        setAlertDatos({ type: 'error', message: msg })
        if (res.errors) setFormErrors((p) => ({ ...p, ...res.errors }))
      }
    } catch (err) {
      const data = err?.response?.data
      const msg = data?.errors
        ? Object.values(data.errors).join(' · ')
        : data?.message || 'Error al guardar los datos.'
      setAlertDatos({ type: 'error', message: msg })
      if (data?.errors) setFormErrors((p) => ({ ...p, ...data.errors }))
    } finally {
      setSavingDatos(false)
    }
  }

  /* ════════════════════════════════
     Handlers: Contraseña
  ════════════════════════════════ */
  const handlePassChange = (e) => {
    const { name, value } = e.target
    const next = { ...passForm, [name]: value }
    setPassForm(next)
    if (passTouched[name]) validatePass(next)
  }

  const handlePassBlur = (e) => {
    setPassTouched((p) => ({ ...p, [e.target.name]: true }))
    validatePass()
  }

  const handleSubmitPass = async (e) => {
    e.preventDefault()
    const allTouched = { password_actual: true, nueva_password: true, confirmar_password: true }
    setPassTouched(allTouched)
    if (!validatePass()) return

    setSavingPass(true)
    setAlertPass(null)
    try {
      const res = await updateProfile({
        password_actual: passForm.password_actual,
        nueva_password: passForm.nueva_password,
      })
      if (res.ok) {
        setAlertPass({ type: 'success', message: '¡Contraseña cambiada exitosamente!' })
        setPassForm({ password_actual: '', nueva_password: '', confirmar_password: '' })
        setPassTouched({})
        setPassErrors({})
      } else {
        const msg = res.errors
          ? Object.values(res.errors).join(' · ')
          : res.message || 'Error al cambiar la contraseña.'
        setAlertPass({ type: 'error', message: msg })
        if (res.errors) setPassErrors((p) => ({ ...p, ...res.errors }))
      }
    } catch (err) {
      const data = err?.response?.data
      const msg = data?.errors
        ? Object.values(data.errors).join(' · ')
        : data?.message || 'Error al cambiar la contraseña.'
      setAlertPass({ type: 'error', message: msg })
      if (data?.errors) setPassErrors((p) => ({ ...p, ...data.errors }))
    } finally {
      setSavingPass(false)
    }
  }

  /* ─── Input class helper ─── */
  const inputCls = (name, touched = formTouched, errors = formErrors) =>
    `w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm ${
      errors[name] && touched[name]
        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
        : 'border-gray-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
    }`

  const passCls = (name) => inputCls(name, passTouched, passErrors)

  /* ─── Password strength indicator ─── */
  const passStrength = (() => {
    const p = passForm.nueva_password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[a-z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^a-zA-Z0-9]/.test(p)) s++
    return s
  })()
  const strengthLabel = ['', 'Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'][passStrength]
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'][passStrength]

  /* ════════════════════════════════
     RENDER
  ════════════════════════════════ */
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Actualiza tu información personal y contraseña.</p>
      </div>

      {/* ── Avatar card ── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0">
          {(user?.nombre || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg leading-tight">
            {user?.nombre} {user?.apellido}
          </p>
          <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
          <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            {user?.rol || user?.rol_nombre || 'Usuario'}
          </span>
        </div>
      </div>

      {/* ════════════════════════════════
          Formulario: Datos personales
      ════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Datos personales</h2>
            <p className="text-xs text-gray-400">Actualiza tu nombre, documento, contacto y correo.</p>
          </div>
        </div>

        <form onSubmit={handleSubmitDatos} noValidate className="p-6 space-y-5">
          {alertDatos && (
            <Alert
              type={alertDatos.type}
              message={alertDatos.message}
              onClose={() => setAlertDatos(null)}
            />
          )}

          {/* Nombre / Apellido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Nombre *" id="nombre" error={formTouched.nombre && formErrors.nombre}>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={50}
                className={inputCls('nombre')}
                placeholder="Tu nombre"
              />
            </InputField>
            <InputField label="Apellido *" id="apellido" error={formTouched.apellido && formErrors.apellido}>
              <input
                id="apellido"
                name="apellido"
                type="text"
                value={form.apellido}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={50}
                className={inputCls('apellido')}
                placeholder="Tu apellido"
              />
            </InputField>
          </div>

          {/* Tipo + Número documento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Tipo de documento *" id="tipo_documento" error={formTouched.tipo_documento && formErrors.tipo_documento}>
              <select
                id="tipo_documento"
                name="tipo_documento"
                value={form.tipo_documento}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputCls('tipo_documento')}
              >
                <option value="">Seleccionar...</option>
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </InputField>
            <InputField label="Número de documento *" id="numero_documento" error={formTouched.numero_documento && formErrors.numero_documento}>
              <input
                id="numero_documento"
                name="numero_documento"
                type="text"
                value={form.numero_documento}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={15}
                className={inputCls('numero_documento')}
                placeholder="Ej: 1234567890"
              />
            </InputField>
          </div>

          {/* Teléfono / Dirección */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Teléfono *" id="telefono" error={formTouched.telefono && formErrors.telefono}>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={15}
                className={inputCls('telefono')}
                placeholder="Ej: 3001234567"
              />
            </InputField>
            <InputField label="Dirección *" id="direccion" error={formTouched.direccion && formErrors.direccion}>
              <input
                id="direccion"
                name="direccion"
                type="text"
                value={form.direccion}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={100}
                className={inputCls('direccion')}
                placeholder="Tu dirección"
              />
            </InputField>
          </div>

          {/* Email */}
          <InputField label="Correo electrónico *" id="email" error={formTouched.email && formErrors.email}>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={100}
              className={inputCls('email')}
              placeholder="tu@correo.com"
            />
          </InputField>

          <div className="flex items-center justify-between pt-1">
            {backLink && (
              <Link to={backLink} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                {backLabel}
              </Link>
            )}
            <button
              type="submit"
              id="btn-guardar-datos"
              disabled={savingDatos}
              className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingDatos ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                    </path>
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                  </svg>
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ════════════════════════════════
          Formulario: Cambio de contraseña
      ════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Cambiar contraseña</h2>
            <p className="text-xs text-gray-400">Debes ingresar tu contraseña actual para poder cambiarla.</p>
          </div>
        </div>

        <form onSubmit={handleSubmitPass} noValidate className="p-6 space-y-5">
          {alertPass && (
            <Alert
              type={alertPass.type}
              message={alertPass.message}
              onClose={() => setAlertPass(null)}
            />
          )}

          {/* Contraseña actual */}
          <InputField label="Contraseña actual *" id="password_actual" error={passTouched.password_actual && passErrors.password_actual}>
            <div className="relative">
              <input
                id="password_actual"
                name="password_actual"
                type={showPass.actual ? 'text' : 'password'}
                value={passForm.password_actual}
                onChange={handlePassChange}
                onBlur={handlePassBlur}
                className={`${passCls('password_actual')} pr-11`}
                placeholder="Tu contraseña actual"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => ({ ...p, actual: !p.actual }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPass.actual
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                }
              </button>
            </div>
          </InputField>

          {/* Nueva contraseña */}
          <InputField label="Nueva contraseña *" id="nueva_password" error={passTouched.nueva_password && passErrors.nueva_password}>
            <div className="relative">
              <input
                id="nueva_password"
                name="nueva_password"
                type={showPass.nueva ? 'text' : 'password'}
                value={passForm.nueva_password}
                onChange={handlePassChange}
                onBlur={handlePassBlur}
                className={`${passCls('nueva_password')} pr-11`}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => ({ ...p, nueva: !p.nueva }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPass.nueva
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                }
              </button>
            </div>
            {/* Strength bar */}
            {passForm.nueva_password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passStrength ? strengthColor : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400">{strengthLabel}</p>
              </div>
            )}
          </InputField>

          {/* Confirmar contraseña */}
          <InputField label="Confirmar nueva contraseña *" id="confirmar_password" error={passTouched.confirmar_password && passErrors.confirmar_password}>
            <div className="relative">
              <input
                id="confirmar_password"
                name="confirmar_password"
                type={showPass.confirmar ? 'text' : 'password'}
                value={passForm.confirmar_password}
                onChange={handlePassChange}
                onBlur={handlePassBlur}
                className={`${passCls('confirmar_password')} pr-11`}
                placeholder="Repite la nueva contraseña"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => ({ ...p, confirmar: !p.confirmar }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPass.confirmar
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                }
              </button>
            </div>
          </InputField>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              id="btn-cambiar-password"
              disabled={savingPass}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold shadow-md hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingPass ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                    </path>
                  </svg>
                  Cambiando...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Cambiar contraseña
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PerfilUsuario
