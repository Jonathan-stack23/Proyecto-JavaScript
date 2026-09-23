import { useState } from 'react'
import Input from './Input'
import Button from './Button'
import { useAuth } from '../context/AuthContext'

function RecoverPassword({ onNavigateBack }) {
  const { recoverSendCode, recoverVerifyCode, recoverResetPassword } = useAuth()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    codigo: '',
    newPassword: '',
    confirmarPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' })

  const validarEmail = (value) => {
    if (!value.trim()) return 'El correo es obligatorio'
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) return 'Correo inválido'
    return ''
  }
  const validarCodigo = (value) => {
    if (!value.trim()) return 'El código es obligatorio'
    if (!/^\d{6}$/.test(value.trim())) return 'El código debe tener 6 dígitos'
    return ''
  }
  const validarPassword = (value) => {
    if (!value) return 'La contraseña es obligatoria'
    if (value.length < 8) return 'Mínimo 8 caracteres'
    if (!/[A-Z]/.test(value)) return 'Debe tener mayúscula'
    if (!/[a-z]/.test(value)) return 'Debe tener minúscula'
    if (!/[0-9]/.test(value)) return 'Debe tener un número'
    return ''
  }
  const validarConfirmar = (v, p) => (!v ? 'Confirma la contraseña' : v !== p ? 'No coinciden' : '')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
    setServerMessage({ type: '', text: '' })
    if (touched[name]) {
      let err = ''
      if (name === 'email') err = validarEmail(value)
      if (name === 'codigo') err = validarCodigo(value)
      if (name === 'newPassword') err = validarPassword(value)
      if (name === 'confirmarPassword') err = validarConfirmar(value, formData.newPassword)
      setErrors((p) => ({ ...p, [name]: err }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched((p) => ({ ...p, [name]: true }))
    let err = ''
    if (name === 'email') err = validarEmail(value)
    if (name === 'codigo') err = validarCodigo(value)
    if (name === 'newPassword') err = validarPassword(value)
    if (name === 'confirmarPassword') err = validarConfirmar(value, formData.newPassword)
    setErrors((p) => ({ ...p, [name]: err }))
  }

  const handleStep1 = async (e) => {
    e.preventDefault()
    setTouched({ email: true })
    const err = validarEmail(formData.email)
    if (err) {
      setErrors({ email: err })
      return
    }
    setIsSubmitting(true)
    setServerMessage({ type: '', text: '' })
    try {
      const res = await recoverSendCode(formData.email)
      setServerMessage({
        type: 'success',
        text: res.message || 'Código enviado exitosamente.',
      })
      setStep(2)
    } catch (error) {
      setServerMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al solicitar el código. Inténtalo nuevamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReenviarCodigo = async () => {
    setIsSubmitting(true)
    setServerMessage({ type: '', text: '' })
    try {
      const res = await recoverSendCode(formData.email)
      setFormData((p) => ({ ...p, codigo: '' }))
      setTouched({})
      setErrors({})
      setServerMessage({
        type: 'success',
        text: res.message || 'Un nuevo código ha sido enviado a tu correo.',
      })
    } catch (error) {
      setServerMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al reenviar el código.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    setTouched({ codigo: true })
    const err = validarCodigo(formData.codigo)
    if (err) {
      setErrors({ codigo: err })
      return
    }
    setIsSubmitting(true)
    setServerMessage({ type: '', text: '' })
    try {
      await recoverVerifyCode(formData.email, formData.codigo)
      setStep(3)
    } catch (error) {
      setServerMessage({
        type: 'error',
        text: error.response?.data?.message || 'Código inválido o expirado.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStep3 = async (e) => {
    e.preventDefault()
    setTouched({ newPassword: true, confirmarPassword: true })
    const pErr = validarPassword(formData.newPassword)
    const cErr = validarConfirmar(formData.confirmarPassword, formData.newPassword)
    if (pErr || cErr) {
      setErrors({ newPassword: pErr, confirmarPassword: cErr })
      return
    }
    setIsSubmitting(true)
    setServerMessage({ type: '', text: '' })
    try {
      const res = await recoverResetPassword(formData.email, formData.codigo, formData.newPassword)
      setServerMessage({
        type: 'success',
        text: res?.message || '¡Tu contraseña ha sido actualizada! Ya puedes iniciar sesión con tu nueva contraseña.',
      })
      setTimeout(() => onNavigateBack && onNavigateBack(), 2500)
    } catch (error) {
      setServerMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al actualizar la contraseña.',
      })
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
  const codigoIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      <line x1="9" y1="16" x2="9.01" y2="16"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
      <line x1="15" y1="16" x2="15.01" y2="16"></line>
    </svg>
  )
  const passwordIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  )

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              step >= n
                ? 'bg-accent text-white border-accent'
                : 'bg-white text-gray-400 border-gray-200'
            }`}
          >
            {n}
          </div>
          {n < 3 && (
            <div
              className={`w-10 h-0.5 rounded transition-all ${
                step > n ? 'bg-accent' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  const stepHeaderText = {
    1: 'Ingresa tu correo para continuar',
    2: 'Ingresa el código que enviamos a tu email',
    3: 'Define tu nueva contraseña',
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-alt via-white to-accent-light px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-custom-xl overflow-hidden">
          <div className="bg-gradient-to-r from-accent to-purple-500 px-8 py-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-md">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  <path d="M15 3h4a2 2 0 0 1 2 2v3"></path>
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white/90 mt-4 mb-1">Recuperar Contraseña</h2>
            <p className="text-white/70 text-sm">{stepHeaderText[step]}</p>
          </div>
          <div className="p-8">
            {stepIndicator}

            {serverMessage.text && (
              <div className={`mb-5 p-3 rounded-lg text-sm flex items-center gap-2 border ${
                serverMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  {serverMessage.type === 'success'
                    ? <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    : (<><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></>)
                  }
                </svg>
                {serverMessage.text}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleStep1}>
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
                <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar código de verificación'}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleStep2}>
                <div className="mb-5 p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-sm">
                  Te enviamos el código a: <strong>{formData.email}</strong>
                </div>

                <Input
                  label="Código de verificación (6 dígitos)"
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={(e) => {
                    const soloDigitos = e.target.value.replace(/\D/g, '').slice(0, 6)
                    handleChange({ ...e, target: { ...e.target, name: 'codigo', value: soloDigitos } })
                  }}
                  onBlur={handleBlur}
                  placeholder="Ej: 123456"
                  error={touched.codigo ? errors.codigo : ''}
                  icon={codigoIcon}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="\d*"
                  required
                />
                <div className="flex flex-col gap-3">
                  <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
                    {isSubmitting ? 'Verificando...' : 'Verificar código'}
                  </Button>
                  <button
                    type="button"
                    onClick={handleReenviarCodigo}
                    disabled={isSubmitting}
                    className="text-sm text-accent hover:text-accent-dark font-medium transition-colors disabled:opacity-50"
                  >
                    ¿No llegó el código? Volver a enviar
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleStep3}>
                <div className="mb-5 p-3 rounded-lg bg-green-50 border border-green-100 text-green-700 text-sm">
                  ✅ Código verificado. Cambiando contraseña para: <strong>{formData.email}</strong>
                </div>
                <Input
                  label="Nueva Contraseña"
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Mínimo 8 caracteres"
                  error={touched.newPassword ? errors.newPassword : ''}
                  icon={passwordIcon}
                  maxLength={50}
                  required
                />
                <Input
                  label="Confirmar Contraseña"
                  type="password"
                  name="confirmarPassword"
                  value={formData.confirmarPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Repite la contraseña"
                  error={touched.confirmarPassword ? errors.confirmarPassword : ''}
                  icon={passwordIcon}
                  maxLength={50}
                  required
                />
                <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Actualizando...' : 'Cambiar contraseña'}
                </Button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                if (step === 1) {
                  if (onNavigateBack) onNavigateBack()
                } else if (step === 2) {
                  setStep(1)
                  setServerMessage({ type: '', text: '' })
                  setTouched({})
                  setErrors({})
                } else {
                  setStep(2)
                  setServerMessage({ type: '', text: '' })
                  setTouched({})
                  setErrors({})
                }
              }}
              className="mt-5 w-full text-sm text-accent hover:text-accent-dark font-medium transition-colors"
            >
              {step === 1
                ? '← Volver al inicio de sesión'
                : step === 2
                  ? '← Volver a ingresar correo'
                  : '← Volver a verificar código'}
            </button>
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Desarrollado por <span className="font-medium text-text-heading">Jonathan Martinez</span>
        </p>
      </div>
    </div>
  )
}

export default RecoverPassword
