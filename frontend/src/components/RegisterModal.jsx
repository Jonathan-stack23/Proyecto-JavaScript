import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from './Input'
import Select from './Select'
import Button from './Button'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const tipoDocumentoOptions = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PP', label: 'Pasaporte' },
  { value: 'NIT', label: 'NIT' },
]

function RegisterModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    tipoDocumento: '',
    numeroDocumento: '',
    direccion: '',
    telefono: '',
    email: '',
    password: '',
    confirmarPassword: '',
    aceptaTerminos: false,
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [serverError, setServerError] = useState('')
  const [emailChecking, setEmailChecking] = useState(false)
  const [mostrarTerminosModal, setMostrarTerminosModal] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (mostrarTerminosModal) {
          setMostrarTerminosModal(false)
        } else {
          handleClose()
        }
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, mostrarTerminosModal])

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      tipoDocumento: '',
      numeroDocumento: '',
      direccion: '',
      telefono: '',
      email: '',
      password: '',
      confirmarPassword: '',
      aceptaTerminos: false,
    })
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
    setIsSuccess(false)
    setServerError('')
    setMostrarTerminosModal(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const soloLetras = (str) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(str)
  const soloNumeros = (str) => /^[0-9]+$/.test(str)
  const sinCaracteresProhibidos = (str) => !/[<>'"`;]/.test(str)

  const validarNombre = (value) => {
    if (!value.trim()) return 'El nombre es obligatorio'
    if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres'
    if (value.length > 50) return 'El nombre no puede exceder 50 caracteres'
    if (!soloLetras(value.trim())) return 'El nombre solo puede contener letras y espacios'
    if (!sinCaracteresProhibidos(value)) return 'El nombre contiene caracteres no permitidos'
    return ''
  }

  const validarApellido = (value) => {
    if (!value.trim()) return 'El apellido es obligatorio'
    if (value.trim().length < 2) return 'El apellido debe tener al menos 2 caracteres'
    if (value.length > 50) return 'El apellido no puede exceder 50 caracteres'
    if (!soloLetras(value.trim())) return 'El apellido solo puede contener letras y espacios'
    if (!sinCaracteresProhibidos(value)) return 'El apellido contiene caracteres no permitidos'
    return ''
  }

  const validarTipoDocumento = (value) => {
    if (!value) return 'Selecciona un tipo de documento'
    return ''
  }

  const validarNumeroDocumento = (value) => {
    if (!value.trim()) return 'El número de documento es obligatorio'
    if (!soloNumeros(value)) return 'El documento solo puede contener números'
    if (value.length < 5) return 'El documento debe tener al menos 5 dígitos'
    if (value.length > 15) return 'El documento no puede exceder 15 dígitos'
    return ''
  }

  const validarDireccion = (value) => {
    if (!value.trim()) return 'La dirección es obligatoria'
    if (value.trim().length < 5) return 'La dirección debe tener al menos 5 caracteres'
    if (value.length > 100) return 'La dirección no puede exceder 100 caracteres'
    if (!sinCaracteresProhibidos(value)) return 'La dirección contiene caracteres no permitidos'
    return ''
  }

  const validarTelefono = (value) => {
    if (!value.trim()) return 'El teléfono es obligatorio'
    const clean = value.replace(/[\s\-+]/g, '')
    if (!soloNumeros(clean)) return 'El teléfono solo puede contener números'
    if (clean.length < 7) return 'El teléfono debe tener al menos 7 dígitos'
    if (clean.length > 15) return 'El teléfono no puede exceder 15 dígitos'
    return ''
  }

  const validarEmail = (value) => {
    if (!value.trim()) return 'El correo electrónico es obligatorio'
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(value)) return 'Ingresa un correo electrónico válido'
    if (value.length > 100) return 'El correo no puede exceder 100 caracteres'
    return ''
  }

  const validarPassword = (value) => {
    if (!value) return 'La contraseña es obligatoria'
    if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (value.length > 50) return 'La contraseña no puede exceder 50 caracteres'
    if (!/[A-Z]/.test(value)) return 'La contraseña debe tener al menos una letra mayúscula'
    if (!/[a-z]/.test(value)) return 'La contraseña debe tener al menos una letra minúscula'
    if (!/[0-9]/.test(value)) return 'La contraseña debe tener al menos un número'
    if (!sinCaracteresProhibidos(value)) return 'La contraseña contiene caracteres no permitidos'
    return ''
  }

  const validarConfirmarPassword = (value, password) => {
    if (!value) return 'Confirma tu contraseña'
    if (value !== password) return 'Las contraseñas no coinciden'
    return ''
  }

  const validarAceptaTerminos = (value) => {
    if (!value) return 'Debes aceptar los términos y condiciones para continuar'
    return ''
  }

  const validarCampo = (name, value) => {
    switch (name) {
      case 'nombre': return validarNombre(value)
      case 'apellido': return validarApellido(value)
      case 'tipoDocumento': return validarTipoDocumento(value)
      case 'numeroDocumento': return validarNumeroDocumento(value)
      case 'direccion': return validarDireccion(value)
      case 'telefono': return validarTelefono(value)
      case 'email': return validarEmail(value)
      case 'password': return validarPassword(value)
      case 'confirmarPassword': return validarConfirmarPassword(value, formData.password)
      case 'aceptaTerminos': return validarAceptaTerminos(value)
      default: return ''
    }
  }

  const validarTodo = () => {
    const nuevosErrores = {
      nombre: validarNombre(formData.nombre),
      apellido: validarApellido(formData.apellido),
      tipoDocumento: validarTipoDocumento(formData.tipoDocumento),
      numeroDocumento: validarNumeroDocumento(formData.numeroDocumento),
      direccion: validarDireccion(formData.direccion),
      telefono: validarTelefono(formData.telefono),
      email: validarEmail(formData.email),
      password: validarPassword(formData.password),
      confirmarPassword: validarConfirmarPassword(formData.confirmarPassword, formData.password),
      aceptaTerminos: validarAceptaTerminos(formData.aceptaTerminos),
    }
    setErrors(nuevosErrores)
    return Object.values(nuevosErrores).every((e) => !e)
  }

  const verificarEmailUnico = async (value) => {
    if (validarEmail(value)) return
    try {
      setEmailChecking(true)
      const { data } = await api.get('/auth/check-email', { params: { email: value } })
      if (data && data.disponible === false) {
        setErrors((prev) => ({ ...prev, email: 'Este correo ya está registrado. Usa otro o inicia sesión.' }))
      } else if (data && data.disponible) {
        setErrors((prev) => {
          const next = { ...prev }
          if (next.email === 'Este correo ya está registrado. Usa otro o inicia sesión.') {
            delete next.email
          }
          return next
        })
      }
    } catch (e) {
      // no-op, el backend validará de todas formas en submit
    } finally {
      setEmailChecking(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : value
    setFormData((prev) => ({ ...prev, [name]: val }))
    setServerError('')

    if (name === 'email') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      const validacionLocal = validarEmail(value)
      if (!validacionLocal && value.trim()) {
        debounceRef.current = setTimeout(() => verificarEmailUnico(value), 500)
      }
    }

    if (touched[name]) {
      const error = validarCampo(name, val)
      setErrors((prev) => ({ ...prev, [name]: error }))
    }

    if (name === 'password' && touched.confirmarPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmarPassword: validarConfirmarPassword(formData.confirmarPassword, value),
      }))
    }
  }

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : value
    setTouched((prev) => ({ ...prev, [name]: true }))
    const error = validarCampo(name, val)
    setErrors((prev) => ({ ...prev, [name]: error }))
    if (name === 'email' && !error && value.trim()) {
      verificarEmailUnico(value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const allTouched = {
      nombre: true, apellido: true, tipoDocumento: true, numeroDocumento: true,
      direccion: true, telefono: true, email: true, password: true, confirmarPassword: true,
      aceptaTerminos: true,
    }
    setTouched(allTouched)

    if (!validarTodo()) return

    try {
      setEmailChecking(true)
      const { data } = await api.get('/auth/check-email', { params: { email: formData.email } })
      if (!data.disponible) {
        setErrors((prev) => ({ ...prev, email: 'Este correo ya está registrado. Usa otro o inicia sesión.' }))
        setEmailChecking(false)
        return
      }
    } catch (e) {
      // no-op
    } finally {
      setEmailChecking(false)
    }

    setIsSubmitting(true)
    setServerError('')

    try {
      const payload = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        direccion: formData.direccion,
        telefono: formData.telefono,
        email: formData.email,
        password: formData.password,
      }
      await register(payload)
      setIsSubmitting(false)
      setIsSuccess(true)
    } catch (error) {
      console.error('Register error:', error)
      setIsSubmitting(false)
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      }
      setServerError(
        error.response?.data?.message || 'Error al registrarse. Inténtalo nuevamente.'
      )
    }
  }

  const handleSuccessClose = () => {
    handleClose()
    navigate('/')
  }

  if (!isOpen) return null

  const userIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  )

  const docIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  )

  const addressIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  )

  const phoneIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  )

  const emailIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  )

  const passwordIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  )

  if (isSuccess) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleSuccessClose}
      >
        <div
          className="bg-white rounded-2xl shadow-custom-xl max-w-md w-full overflow-hidden animate-[fadeIn_0.2s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-heading mb-3">¡Registro exitoso!</h2>
            <p className="text-gray-600 mb-8">
              Bienvenido a MiTienda, <span className="font-semibold text-accent">{formData.nombre}</span>.
              Tu cuenta ha sido creada correctamente.
            </p>
            <Button variant="primary" size="lg" fullWidth onClick={handleSuccessClose}>
              Continuar a la tienda
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-custom-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-accent to-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-md">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 01-8 0"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white leading-none">MiTienda</h1>
              <p className="text-[11px] text-white/80 mt-0.5">Crear nueva cuenta</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-8">
            {serverError && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <Input label="Nombre" type="text" name="nombre" value={formData.nombre}
                onChange={handleChange} onBlur={handleBlur} placeholder="Tu nombre"
                error={touched.nombre ? errors.nombre : ''} icon={userIcon} maxLength={50} required />
              <Input label="Apellido" type="text" name="apellido" value={formData.apellido}
                onChange={handleChange} onBlur={handleBlur} placeholder="Tu apellido"
                error={touched.apellido ? errors.apellido : ''} icon={userIcon} maxLength={50} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <Select label="Tipo de Documento" name="tipoDocumento" value={formData.tipoDocumento}
                onChange={handleChange} onBlur={handleBlur} options={tipoDocumentoOptions}
                error={touched.tipoDocumento ? errors.tipoDocumento : ''} required placeholder="Seleccione tipo" />
              <Input label="Número de Documento" type="text" name="numeroDocumento" value={formData.numeroDocumento}
                onChange={handleChange} onBlur={handleBlur} placeholder="Ej: 123456789"
                error={touched.numeroDocumento ? errors.numeroDocumento : ''} icon={docIcon} maxLength={15} required />
            </div>
            <Input label="Dirección" type="text" name="direccion" value={formData.direccion}
              onChange={handleChange} onBlur={handleBlur} placeholder="Calle, número, ciudad..."
              error={touched.direccion ? errors.direccion : ''} icon={addressIcon} maxLength={100} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <Input label="Teléfono" type="tel" name="telefono" value={formData.telefono}
                onChange={handleChange} onBlur={handleBlur} placeholder="Ej: 3001234567"
                error={touched.telefono ? errors.telefono : ''} icon={phoneIcon} maxLength={15} required />
              <Input label="Correo Electrónico" type="email" name="email" value={formData.email}
                onChange={handleChange} onBlur={handleBlur} placeholder="tu.correo@ejemplo.com"
                error={touched.email ? errors.email : ''} icon={emailIcon} maxLength={100} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <Input label="Contraseña" type="password" name="password" value={formData.password}
                onChange={handleChange} onBlur={handleBlur} placeholder="Mínimo 8 caracteres"
                error={touched.password ? errors.password : ''} icon={passwordIcon} maxLength={50} required />
              <Input label="Confirmar Contraseña" type="password" name="confirmarPassword" value={formData.confirmarPassword}
                onChange={handleChange} onBlur={handleBlur} placeholder="Repite tu contraseña"
                error={touched.confirmarPassword ? errors.confirmarPassword : ''} icon={passwordIcon} maxLength={50} required />
            </div>
            <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-500 mb-2 font-medium">Requisitos de contraseña:</p>
              <ul className="text-xs text-gray-500 space-y-1 grid grid-cols-2 gap-1">
                <li className={`flex items-center gap-1.5 ${formData.password.length >= 8 ? 'text-green-600' : ''}`}>
                  <span className={formData.password.length >= 8 ? 'text-green-500' : 'text-gray-300'}>✓</span> Mínimo 8 caracteres
                </li>
                <li className={`flex items-center gap-1.5 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                  <span className={/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}>✓</span> Una letra mayúscula
                </li>
                <li className={`flex items-center gap-1.5 ${/[a-z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                  <span className={/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}>✓</span> Una letra minúscula
                </li>
                <li className={`flex items-center gap-1.5 ${/[0-9]/.test(formData.password) ? 'text-green-600' : ''}`}>
                  <span className={/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}>✓</span> Al menos un número
                </li>
              </ul>
            </div>

            {/* Casilla: Acepto términos y condiciones */}
            <div
              className={`mt-5 p-4 rounded-2xl border transition-all duration-200 ${
                touched.aceptaTerminos && errors.aceptaTerminos
                  ? 'bg-red-50/70 border-red-300 ring-1 ring-red-200'
                  : formData.aceptaTerminos
                  ? 'bg-accent-light/30 border-accent/40 ring-1 ring-accent/20'
                  : 'bg-gray-50/80 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="aceptaTerminos"
                  name="aceptaTerminos"
                  checked={formData.aceptaTerminos}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-0.5 w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent cursor-pointer transition-colors"
                />
                <label htmlFor="aceptaTerminos" className="text-xs sm:text-sm text-gray-700 select-none cursor-pointer leading-relaxed flex-1">
                  Acepto los{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setMostrarTerminosModal(true)
                    }}
                    className="font-bold text-accent hover:text-accent-dark underline transition-colors"
                  >
                    términos y condiciones
                  </button>{' '}
                  y la política de privacidad de MiTienda. <span className="text-red-500 font-bold">*</span>
                </label>
              </div>
              {touched.aceptaTerminos && errors.aceptaTerminos && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1 font-medium animate-fade-in pl-7">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {errors.aceptaTerminos}
                </p>
              )}
            </div>
          </div>
        </form>

        <div className="px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end bg-gray-50">
          <Button type="button" variant="secondary" size="md" onClick={handleClose} className="sm:flex-1">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md" className="sm:flex-1"
            disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                  </path>
                </svg>
                Registrando...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Registrarse
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Modal de Términos y Condiciones */}
      {mostrarTerminosModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setMostrarTerminosModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-custom-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent-light text-accent flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <h3 className="font-bold text-text-heading text-base">Términos y Condiciones</h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarTerminosModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
              <p>
                Al registrarte en <strong>MiTienda</strong>, aceptas expresamente los siguientes términos de servicio y políticas de privacidad:
              </p>

              <div>
                <h4 className="font-semibold text-text-heading mb-1 text-sm">1. Uso de la Cuenta</h4>
                <p>
                  El usuario es el único responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran bajo su cuenta.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-text-heading mb-1 text-sm">2. Veracidad de la Información</h4>
                <p>
                  El usuario declara que todos los datos suministrados (nombre, documento, dirección, teléfono y correo) son reales, vigentes y verídicos.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-text-heading mb-1 text-sm">3. Protección de Datos (Habeas Data)</h4>
                <p>
                  Tus datos personales serán tratados conforme a la Ley 1581 de 2012 y normativas aplicables de protección de datos, únicamente para la prestación de servicios, facturación y soporte.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-text-heading mb-1 text-sm">4. Pedidos y Garantías</h4>
                <p>
                  Todos los productos y servicios adquiridos a través de la plataforma cuentan con garantía legal vigente y respaldo de servicio técnico certificado.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 gap-3">
              <button
                type="button"
                onClick={() => setMostrarTerminosModal(false)}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, aceptaTerminos: true }))
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.aceptaTerminos
                    return next
                  })
                  setMostrarTerminosModal(false)
                }}
                className="px-5 py-2 rounded-xl bg-accent text-white text-xs sm:text-sm font-semibold shadow-md hover:bg-accent-dark transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Aceptar Términos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegisterModal
