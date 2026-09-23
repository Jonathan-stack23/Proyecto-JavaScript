import { useEffect, useState, useMemo } from 'react'
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
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [ordenarPor, setOrdenarPor] = useState('default')

  const handleSubmit = (e) => {
    e.preventDefault()
    crud.submit()
  }

  const categorias = useMemo(() => {
    const cats = crud.items.map((p) => p.categoria).filter(Boolean)
    return ['Todas', ...Array.from(new Set(cats))]
  }, [crud.items])

  const itemsFiltrados = useMemo(() => {
    let resultado = crud.items.filter((p) => {
      const coincideBusqueda = !busqueda ||
        p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        String(p.id).includes(busqueda)
      const coincideCategoria = filtroCategoria === 'Todas' || p.categoria === filtroCategoria
      const coincideEstado = filtroEstado === 'Todos' || p.estado === filtroEstado
      return coincideBusqueda && coincideCategoria && coincideEstado
    })

    switch (ordenarPor) {
      case 'precio_asc':
        resultado = [...resultado].sort((a, b) => Number(a.precio) - Number(b.precio))
        break
      case 'precio_desc':
        resultado = [...resultado].sort((a, b) => Number(b.precio) - Number(a.precio))
        break
      case 'stock_asc':
        resultado = [...resultado].sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
        break
      case 'stock_desc':
        resultado = [...resultado].sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))
        break
      case 'nombre_az':
        resultado = [...resultado].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
        break
      default:
        resultado = [...resultado].sort((a, b) => Number(b.id) - Number(a.id))
        break
    }
    return resultado
  }, [crud.items, busqueda, filtroCategoria, filtroEstado, ordenarPor])

  const hayFiltrosActivos = busqueda !== '' || filtroCategoria !== 'Todas' || filtroEstado !== 'Todos' || ordenarPor !== 'default'

  return (
    <div className="space-y-5">
      {crud.toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-[fadeIn_0.2s_ease-out] ${
          crud.toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>{crud.toast.msg}</div>
      )}

      {/* Header con título y acciones */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl p-6 md:p-8 text-white shadow-custom-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">Gestión de Productos</h1>
              <p className="text-sm text-white/80 mt-0.5">
                Administra el inventario: {crud.items.length} productos registrados ·{' '}
                <span className="font-bold">{itemsFiltrados.length}</span> visibles
              </p>
            </div>
          </div>
          <Button variant="primary" size="md" onClick={() => crud.openCreate()} className="!bg-white !text-emerald-700 hover:!bg-emerald-50 shadow-lg !px-5 !py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nuevo producto
          </Button>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="bg-white rounded-2xl shadow-custom-md border border-gray-100 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Buscador */}
          <div className="relative flex-1 min-w-0 lg:max-w-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, descripción o ID..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          {/* Filtro categoría */}
          <div className="relative min-w-[180px]">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="appearance-none w-full px-4 py-2.5 pr-10 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 cursor-pointer focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            >
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat === 'Todas' ? '📦 Todas las categorías' : `🏷️ ${cat}`}</option>
              ))}
            </select>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {/* Filtro estado */}
          <div className="relative min-w-[160px]">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="appearance-none w-full px-4 py-2.5 pr-10 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 cursor-pointer focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            >
              <option value="Todos">📋 Todos los estados</option>
              <option value="activo">✅ Activos</option>
              <option value="inactivo">⛔ Inactivos</option>
            </select>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {/* Ordenamiento */}
          <div className="relative min-w-[200px]">
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value)}
              className="appearance-none w-full px-4 py-2.5 pr-10 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 cursor-pointer focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            >
              <option value="default">🔄 Más recientes</option>
              <option value="nombre_az">🔤 Nombre (A-Z)</option>
              <option value="precio_asc">💰 Precio ↑</option>
              <option value="precio_desc">💰 Precio ↓</option>
              <option value="stock_asc">📦 Stock ↓</option>
              <option value="stock_desc">📦 Stock ↑</option>
            </select>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {/* Botón limpiar filtros */}
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={() => {
                setBusqueda('')
                setFiltroCategoria('Todas')
                setFiltroEstado('Todos')
                setOrdenarPor('default')
              }}
              className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-2 shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              Limpiar
            </button>
          )}
        </div>

        {/* Chips informativos de filtros activos */}
        {hayFiltrosActivos && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Filtros:</span>
            {busqueda && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-100">
                🔍 "{busqueda}"
              </span>
            )}
            {filtroCategoria !== 'Todas' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-100">
                🏷️ {filtroCategoria}
              </span>
            )}
            {filtroEstado !== 'Todos' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100">
                {filtroEstado === 'activo' ? '✅' : '⛔'} {filtroEstado}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-2xl shadow-custom-md border border-gray-100 overflow-hidden">
        {crud.loading ? (
          <div className="p-10 flex justify-center"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3 className="font-bold text-text-heading text-lg">
              {crud.items.length === 0 ? 'Sin productos registrados' : 'No hay resultados'}
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {crud.items.length === 0
                ? 'Crea tu primer producto usando el botón "Nuevo producto".'
                : 'Prueba modificando los filtros o términos de búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100">
                <tr>
                  {['ID','Producto','Categoría','Precio','Stock','Estado','Acciones'].map(h => (
                    <th key={h} className="text-left font-bold text-gray-600 px-5 py-3.5 whitespace-nowrap text-[11px] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {itemsFiltrados.map((p) => (
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
