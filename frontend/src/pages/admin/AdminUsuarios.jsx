import { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Select from '../../components/Select'

const tipoDocOptions = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PP', label: 'Pasaporte' },
  { value: 'NIT', label: 'NIT' },
]

function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null })
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ type: '', msg: '' })
  const [emailChecking, setEmailChecking] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [u, r] = await Promise.all([api.get('/usuarios'), api.get('/usuarios/roles')])
      setUsuarios(u.data.usuarios || [])
      setRoles(r.data.roles || [])
    } catch (e) {
      showToast('error', 'Error cargando datos.')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast({ type: '', msg: '' }), 3000)
  }

  const openCreate = () => {
    setFormData({
      nombre: '', apellido: '', tipo_documento: 'CC', numero_documento: '',
      direccion: '', telefono: '', email: '', password: '', rol_id: 3, estado: 'activo'
    })
    setErrors({})
    setModal({ open: true, mode: 'create', data: null })
  }

  const openEdit = (u) => {
    setFormData({
      ...u,
      tipo_documento: u.tipo_documento || u.tipoDocumento,
      numero_documento: u.numero_documento || u.numeroDocumento,
      password: '',
    })
    setErrors({})
    setModal({ open: true, mode: 'edit', data: u })
  }

  const closeModal = () => setModal({ open: false, mode: 'create', data: null })

  const verificarEmailUnico = async (value, excludeId) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '')) return
    try {
      setEmailChecking(true)
      const params = { email: value }
      if (excludeId) params.excludeId = excludeId
      const { data } = await api.get('/usuarios/check-email', { params })
      if (data && data.disponible === false) {
        setErrors((p) => ({ ...p, email: 'Este correo ya está en uso por otro usuario.' }))
      } else {
        setErrors((p) => {
          const next = { ...p }
          if (next.email === 'Este correo ya está en uso por otro usuario.') delete next.email
          return next
        })
      }
    } catch (e) {
      // no-op
    } finally {
      setEmailChecking(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
    setErrors(p => ({ ...p, [name]: '' }))

    if (name === 'email') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '')
      if (emailOk) {
        debounceRef.current = setTimeout(() => verificarEmailUnico(value, modal.mode === 'edit' ? modal.data?.id : null), 400)
      }
    }
  }

  const validar = () => {
    const e = {}
    if (!formData.nombre?.trim()) e.nombre = 'Obligatorio'
    if (!formData.apellido?.trim()) e.apellido = 'Obligatorio'
    if (!formData.tipo_documento) e.tipo_documento = 'Obligatorio'
    if (!formData.numero_documento?.trim()) e.numero_documento = 'Obligatorio'
    if (!formData.direccion?.trim()) e.direccion = 'Obligatorio'
    if (!formData.telefono?.trim()) e.telefono = 'Obligatorio'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email || '')) e.email = 'Correo inválido'
    if (modal.mode === 'create' && !formData.password) e.password = 'Obligatoria'
    if (modal.mode === 'create' && formData.password && formData.password.length < 6) e.password = 'Mínimo 6 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validar()) return
    try {
      setEmailChecking(true)
      const params = { email: formData.email }
      if (modal.mode === 'edit') params.excludeId = modal.data?.id
      const { data } = await api.get('/usuarios/check-email', { params })
      if (!data.disponible) {
        setErrors((p) => ({ ...p, email: 'Este correo ya está en uso por otro usuario.' }))
        setEmailChecking(false)
        return
      }
    } catch (e) {
      // no-op
    } finally {
      setEmailChecking(false)
    }
    setSubmitting(true)
    try {
      if (modal.mode === 'create') {
        await api.post('/usuarios', formData)
        showToast('success', 'Usuario creado correctamente.')
      } else {
        const payload = { ...formData }
        if (!payload.password) delete payload.password
        await api.put(`/usuarios/${modal.data.id}`, payload)
        showToast('success', 'Usuario actualizado correctamente.')
      }
      closeModal()
      loadAll()
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error guardando.')
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleEstado = async (id) => {
    try {
      const res = await api.patch(`/usuarios/${id}/estado`)
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, estado: res.data.estado } : u))
      showToast('success', `Estado cambiado a ${res.data.estado}.`)
    } catch (e) {
      showToast('error', 'Error cambiando estado.')
    }
  }

  const borrar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return
    try {
      await api.delete(`/usuarios/${id}`)
      setUsuarios(prev => prev.filter(u => u.id !== id))
      showToast('success', 'Usuario eliminado.')
    } catch (e) {
      showToast('error', 'Error eliminando.')
    }
  }

  return (
    <div className="space-y-5">
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>{toast.msg}</div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500">Total: {usuarios.length} registros</p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo usuario
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-custom-md border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['ID','Nombre','Documento','Correo','Teléfono','Rol','Estado','Acciones'].map(h => (
                    <th key={h} className="text-left font-semibold text-gray-600 px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuarios.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">Sin usuarios registrados</td></tr>
                ) : usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-500">#{u.id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {(u.nombre||'').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-text-heading">{u.nombre} {u.apellido}</p>
                          <p className="text-[11px] text-gray-400">{u.direccion}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-medium mr-2">{u.tipo_documento}</span>
                      {u.numero_documento}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3">{u.telefono}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        u.rol_nombre === 'Administrador' ? 'bg-purple-100 text-purple-700'
                        : u.rol_nombre === 'Empleado' ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                      }`}>{u.rol_nombre}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <button onClick={() => toggleEstado(u.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                          u.estado === 'activo'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}>{u.estado}</button>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button onClick={() => borrar(u.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
                            <path d="M10 11v6M14 11v6"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-custom-xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-[fadeIn_0.2s_ease-out]" onClick={e=>e.stopPropagation()}>
            <div className="px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-accent to-purple-500 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">
                {modal.mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
              </h3>
              <button onClick={closeModal} className="w-9 h-9 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-5">
                <Input label="Nombre" name="nombre" value={formData.nombre || ''} onChange={handleChange}
                  error={errors.nombre || ''} maxLength={50} required />
                <Input label="Apellido" name="apellido" value={formData.apellido || ''} onChange={handleChange}
                  error={errors.apellido || ''} maxLength={50} required />
                <Select label="Tipo Documento" name="tipo_documento" value={formData.tipo_documento || ''}
                  onChange={handleChange} options={tipoDocOptions} error={errors.tipo_documento || ''} required />
                <Input label="Número Documento" name="numero_documento" value={formData.numero_documento || ''} onChange={handleChange}
                  error={errors.numero_documento || ''} maxLength={15} required />
                <Input label="Dirección" name="direccion" value={formData.direccion || ''} onChange={handleChange}
                  error={errors.direccion || ''} maxLength={100} required />
                <Input label="Teléfono" name="telefono" value={formData.telefono || ''} onChange={handleChange}
                  error={errors.telefono || ''} maxLength={15} required />
                <Input label="Correo" type="email" name="email" value={formData.email || ''} onChange={handleChange}
                  error={errors.email || ''} maxLength={100} required />
                <Select label="Rol" name="rol_id" value={String(formData.rol_id || '3')}
                  onChange={handleChange} error={errors.rol_id || ''}
                  options={roles.map(r => ({ value: String(r.id), label: r.nombre }))} required />
                <div className="md:col-span-2">
                  <Input label={`Contraseña${modal.mode === 'edit' ? ' (dejar en blanco para mantener)' : ''}`}
                    type="password" name="password" value={formData.password || ''} onChange={handleChange}
                    error={errors.password || ''} maxLength={50} />
                </div>
              </div>
            </form>
            <div className="px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end bg-gray-50">
              <Button type="button" variant="secondary" size="md" onClick={closeModal}>Cancelar</Button>
              <Button type="submit" variant="primary" size="md" disabled={submitting} onClick={handleSubmit}>
                {submitting ? 'Guardando...' : (modal.mode === 'create' ? 'Crear usuario' : 'Guardar cambios')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsuarios
