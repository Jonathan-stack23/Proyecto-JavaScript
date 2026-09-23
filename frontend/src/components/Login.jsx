import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from './Input'
import Button from './Button'
import RegisterModal from './RegisterModal'
import { useAuth } from '../context/AuthContext'

function Login({ onNavigateRecover }) {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [serverError, setServerError] = useState('')

  const validarEmail = (email) => {
    if (!email.trim()) return 'El correo electrónico es obligatorio'
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) return 'Ingresa un correo electrónico válido'
    if (email.length > 100) return 'El correo no puede exceder 100 caracteres'
    return ''
  }

  const validarPassword = (password) => {
    if (!password) return 'La contraseña es obligatoria'
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    if (password.length > 50) return 'La contraseña no puede exceder 50 caracteres'
    const forbiddenRegex = /[<>'"`;]/
    if (forbiddenRegex.test(password)) return 'La contraseña contiene caracteres no permitidos'
    return ''
  }

  const validarFormulario = () => {
    const nuevosErrores = {
      email: validarEmail(formData.email),
      password: validarPassword(formData.password),
    }
    setErrors(nuevosErrores)
    return !nuevosErrores.email && !nuevosErrores.password
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    setFormData((prev) => ({ ...prev, [name]: newValue }))
    setServerError('')

    if (name === 'email' && touched.email) {
      setErrors((prev) => ({ ...prev, email: validarEmail(value) }))
    }
    if (name === 'password' && touched.password) {
      setErrors((prev) => ({ ...prev, password: validarPassword(value) }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))

    if (name === 'email') {
      setErrors((prev) => ({ ...prev, email: validarEmail(value) }))
    }
    if (name === 'password') {
      setErrors((prev) => ({ ...prev, password: validarPassword(value) }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })

    if (!validarFormulario()) return

    setIsSubmitting(true)
    setServerError('')

    try {
      const result = await login(formData.email, formData.password, formData.rememberMe)
      if (result.user?.rol === 'Administrador') {
        navigate('/admin/dashboard')
      } else if (result.user?.rol === 'Empleado') {
        navigate('/empleado/dashboard')
      } else {
        navigate('/')
      }
    } catch (error) {
      console.error('Login error:', error)
      setServerError(
        error.response?.data?.message || 'Error al iniciar sesión. Inténtalo nuevamente.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-alt via-white to-accent-light px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-custom-xl overflow-hidden">
          <div className="bg-gradient-to-r from-accent to-purple-500 px-8 py-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-md">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 01-8 0"></path>
                </svg>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-extrabold text-white leading-none">MiTienda</h1>
                <p className="text-xs text-white/80 mt-0.5">Tecnología & más</p>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white/90 mt-6 mb-1">Iniciar Sesión</h2>
            <p className="text-white/70 text-sm">Bienvenido de nuevo</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
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

            <Input
              label="Correo Electrónico"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="tu.correo@ejemplo.com"
              error={touched.email ? errors.email : ''}
              icon={emailIcon}
              maxLength={100}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ingresa tu contraseña"
              error={touched.password ? errors.password : ''}
              icon={passwordIcon}
              maxLength={50}
              required
            />

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="text-sm text-gray-600 group-hover:text-text-heading transition-colors">
                  Recordarme
                </span>
              </label>
              <button
                type="button"
                onClick={onNavigateRecover}
                className="text-sm text-accent hover:text-accent-dark font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                    </path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  Iniciar Sesión
                </>
              )}
            </Button>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">O</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-3">
                ¿Aún no tienes una cuenta?
              </p>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowRegisterModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Crear una cuenta
              </Button>
            </div>

            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => navigate('/')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5"></path>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Volver a inicio
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Desarrollado por <span className="font-medium text-text-heading">Jonathan Martinez</span>
        </p>
      </div>

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />
    </div>
  )
}

export default Login

