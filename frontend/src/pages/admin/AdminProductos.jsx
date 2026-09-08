import { useEffect, useState } from 'react'
import api from '../../services/api'
import Button from '../../components/Button'
import Input from '../../components/Input'

const formatearCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(v) || 0)

function useCRUD(entityName, apiPath) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null })
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ type: '', msg: '' })

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast({ type: '', msg: '' }), 3000)
  }

  const load = async () => {
    try {
      setLoading(true)
      const res = await api.get(apiPath)
      setItems(res.data[entityName] || [])
    } catch (e) {
      showToast('error', `Error cargando ${entityName}.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = (defaults) => {
    setFormData({ nombre: '', descripcion: '', precio: '', stock: '', categoria: '', estado: 'activo', duracion: '', ...defaults })
    setErrors({})
    setModal({ open: true, mode: 'create', data: null })
  }
  const openEdit = (item) => {
    setFormData({ ...item, precio: String(item.precio || ''), stock: item.stock !== undefined ? String(item.stock) : '' })
    setErrors({})
    setModal({ open: true, mode: 'edit', data: item })
  }
  const close = () => setModal({ open: false, mode: 'create', data: null })
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
    setErrors(p => ({ ...p, [name]: '' }))
  }

  const toggleEstado = async (id) => {
    try {
      const res = await api.patch(`${apiPath}/${id}/estado`)
      setItems(prev => prev.map(it => it.id === id ? { ...it, estado: res.data.estado } : it))
      showToast('success', 'Estado actualizado.')
    } catch (e) {
      showToast('error', 'Error actualizando estado.')
    }
  }

  const borrar = async (id, label = 'elemento') => {
    if (!window.confirm(`¿Eliminar este ${label}?`)) return
    try {
      await api.delete(`${apiPath}/${id}`)
      setItems(prev => prev.filter(it => it.id !== id))
      showToast('success', `${label} eliminado.`)
    } catch (e) {
      showToast('error', 'Error eliminando.')
    }
  }

  const submit = async (extraValidate = () => ({})) => {
    const e = { nombre: !formData.nombre?.trim() ? 'Obligatorio' : '' }
    if (!formData.precio || isNaN(Number(formData.precio)) || Number(formData.precio) < 0) e.precio = 'Precio inválido'
    Object.assign(e, extraValidate())
    setErrors(e)
    if (Object.values(e).some(v => v)) return false
    setSubmitting(true)
    try {
      const payload = { ...formData, precio: Number(formData.precio) }
      if (formData.stock !== undefined && formData.stock !== '') payload.stock = Number(formData.stock)
      if (modal.mode === 'create') {
        await api.post(apiPath, payload)
        showToast('success', 'Creado correctamente.')
      } else {
        await api.put(`${apiPath}/${modal.data.id}`, payload)
        showToast('success', 'Actualizado correctamente.')
      }
      close()
      load()
      return true
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error guardando.')
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return {
    items, loading, modal, formData, errors, submitting, toast,
    openCreate, openEdit, close, handleChange, toggleEstado, borrar, submit, load, showToast, setFormData, setErrors
  }
}

function AdminProductos() {
  const crud = useCRUD('productos', '/productos')

  const handleSubmit = (e) => {
    e.preventDefault()
    crud.submit()
  }

  return (
    <div className="space-y-5">
      {crud.toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          crud.toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>{crud.toast.msg}</div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Gestión de Productos</h1>
          <p className="text-sm text-gray-500">Total: {crud.items.length} registros</p>
        </div>
        <Button variant="primary" size="md" onClick={() => crud.openCreate()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo producto
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-custom-md border border-gray-100 overflow-hidden">
        {crud.loading ? (
          <div className="p-10 flex justify-center"><div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['ID','Producto','Categoría','Precio','Stock','Estado','Acciones'].map(h => (
                    <th key={h} className="text-left font-semibold text-gray-600 px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {crud.items.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">Sin productos registrados</td></tr>
                ) : crud.items.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-500">#{p.id}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-text-heading">{p.nombre}</p>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{p.descripcion}</p>
                    </td>
                    <td className="px-5 py-3">
                      {p.categoria
                        ? <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700">{p.categoria}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-5 py-3 font-semibold text-text-heading">{formatearCOP(p.precio)}</td>
                    <td className="px-5 py-3">
                      <span className={`font-medium ${
                        Number(p.stock) <= 5 ? 'text-red-600' : 'text-gray-700'
                      }`}>{p.stock} unid.</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <button onClick={() => crud.toggleEstado(p.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                          p.estado === 'activo'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}>{p.estado}</button>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => crud.openEdit(p)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button onClick={() => crud.borrar(p.id, 'producto')}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
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

      {crud.modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={crud.close}>
          <div className="bg-white rounded-2xl shadow-custom-xl max-w-xl w-full max-h-[90vh] flex flex-col animate-[fadeIn_0.2s_ease-out]" onClick={e=>e.stopPropagation()}>
            <div className="px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">
                {crud.modal.mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
              </h3>
              <button onClick={crud.close} className="w-9 h-9 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-5">
                <div className="md:col-span-2">
                  <Input label="Nombre" name="nombre" value={crud.formData.nombre || ''}
                    onChange={crud.handleChange} error={crud.errors.nombre || ''} maxLength={100} required />
                </div>
                <div className="md:col-span-2 mb-4">
                  <label className="block text-sm font-medium text-text-heading mb-1.5">Descripción</label>
                  <textarea
                    name="descripcion"
                    rows={3}
                    value={crud.formData.descripcion || ''}
                    onChange={crud.handleChange}
                    maxLength={500}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-accent focus:ring-2 focus:ring-accent-light resize-none"
                  />
                </div>
                <Input label="Precio (COP)" type="number" name="precio"
                  value={crud.formData.precio || ''}
                  onChange={crud.handleChange}
                  error={crud.errors.precio || ''} required />
                <Input label="Stock" type="number" name="stock"
                  value={crud.formData.stock || ''}
                  onChange={crud.handleChange}
                  error={crud.errors.stock || ''} />
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-5">
                  <Input label="Categoría" name="categoria"
                    value={crud.formData.categoria || ''}
                    onChange={crud.handleChange}
                    maxLength={50} />
                  <div>
                    <label className="block text-sm font-medium text-text-heading mb-1.5">Estado</label>
                    <select name="estado" value={crud.formData.estado || 'activo'}
                      onChange={crud.handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-accent focus:ring-2 focus:ring-accent-light bg-white">
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
            <div className="px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end bg-gray-50">
              <Button type="button" variant="secondary" size="md" onClick={crud.close}>Cancelar</Button>
              <Button type="submit" variant="primary" size="md" disabled={crud.submitting} onClick={handleSubmit}>
                {crud.submitting ? 'Guardando...' : (crud.modal.mode === 'create' ? 'Crear producto' : 'Guardar cambios')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProductos
