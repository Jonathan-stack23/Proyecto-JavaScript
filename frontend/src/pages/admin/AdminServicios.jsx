import { useEffect, useState, useMemo } from 'react'
import api from '../../services/api'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { useAuth } from '../../context/AuthContext'

const formatearCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(v) || 0)

function AdminServicios() {
  const { user } = useAuth()
  const isEmpleado = user?.rol_id === 2 || user?.rol?.nombre === 'Empleado'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null })
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ type: '', msg: '' })
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [ordenarPor, setOrdenarPor] = useState('recientes')

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast({ type: '', msg: '' }), 3000)
  }
  const load = async () => {
    try {
      setLoading(true)
      const res = await api.get('/servicios')
      const raw = res.data.servicios || []
      const visible = isEmpleado ? raw.filter((s) => s.usuario_id === user?.id) : raw
      setItems(visible)
    } catch { showToast('error', 'Error cargando servicios.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [user?.id, isEmpleado])

  const categorias = useMemo(() => {
    const setCats = new Set();
    items.forEach((s) => {
      if (s.categoria && String(s.categoria).trim()) {
        setCats.add(String(s.categoria).trim());
      }
    });
    return Array.from(setCats).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const totalActivos = useMemo(() => items.filter(s => s.estado === 'activo').length, [items]);
  const totalInactivos = useMemo(() => items.filter(s => s.estado === 'inactivo').length, [items]);

  const itemsFiltrados = useMemo(() => {
    let resultado = [...items];

    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(s => s.estado === filtroEstado);
    }

    if (filtroCategoria !== 'todas') {
      resultado = resultado.filter(s => (s.categoria || '').trim() === filtroCategoria);
    }

    const q = busqueda.trim().toLowerCase();
    if (q) {
      resultado = resultado.filter(s => {
        const porNombre = (s.nombre || '').toLowerCase().includes(q);
        const porDesc = (s.descripcion || '').toLowerCase().includes(q);
        const porCat = (s.categoria || '').toLowerCase().includes(q);
        const porDur = (s.duracion || '').toLowerCase().includes(q);
        const porPrecio = String(s.precio || '').includes(q);
        return porNombre || porDesc || porCat || porDur || porPrecio;
      });
    }

    switch (ordenarPor) {
      case 'antiguos':
        resultado.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        break;
      case 'precio_desc':
        resultado.sort((a, b) => Number(b.precio) - Number(a.precio));
        break;
      case 'precio_asc':
        resultado.sort((a, b) => Number(a.precio) - Number(b.precio));
        break;
      case 'nombre_az':
        resultado.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        break;
      case 'stock_desc':
      case 'recientes':
      default:
        resultado.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
    }

    return resultado;
  }, [items, filtroEstado, filtroCategoria, busqueda, ordenarPor]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('todas');
    setFiltroEstado('todos');
    setOrdenarPor('recientes');
  };

  const hayFiltrosActivos =
    busqueda.trim() !== '' ||
    filtroCategoria !== 'todas' ||
    filtroEstado !== 'todos' ||
    ordenarPor !== 'recientes';

  const openCreate = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      duracion: '',
      categoria: '',
      estado: 'activo',
      ...(isEmpleado && user?.id ? { usuario_id: user.id } : {}),
    })
    setErrors({})
    setModal({ open: true, mode: 'create', data: null })
  }
  const openEdit = (it) => {
    setFormData({ ...it, precio: String(it.precio || '') })
    setErrors({})
    setModal({ open: true, mode: 'edit', data: it })
  }
  const close = () => setModal({ open: false, mode: 'create', data: null })
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
    setErrors(p => ({ ...p, [name]: '' }))
  }

  const toggleEstado = async (id) => {
    try {
      const res = await api.patch(`/servicios/${id}/estado`)
      setItems(prev => prev.map(it => it.id === id ? { ...it, estado: res.data.estado } : it))
      showToast('success', 'Estado actualizado.')
    } catch { showToast('error', 'Error actualizando.') }
  }

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar este servicio?')) return
    try {
      await api.delete(`/servicios/${id}`)
      setItems(prev => prev.filter(it => it.id !== id))
      showToast('success', 'Servicio eliminado.')
    } catch { showToast('error', 'Error eliminando.') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!formData.nombre?.trim()) errs.nombre = 'Obligatorio'
    if (!formData.precio || isNaN(Number(formData.precio)) || Number(formData.precio) < 0) errs.precio = 'Precio inválido'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        precio: Number(formData.precio),
        ...(isEmpleado && user?.id ? { usuario_id: user.id } : {}),
      }
      if (modal.mode === 'create') await api.post('/servicios', payload)
      else await api.put(`/servicios/${modal.data.id}`, payload)
      showToast('success', modal.mode === 'create' ? 'Creado correctamente.' : 'Actualizado correctamente.')
      close(); load()
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error guardando.')
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-5">
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>{toast.msg}</div>
      )}

      {/* HERO BANNER CON CONTADORES */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-5 md:p-7 text-white shadow-2xl">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-yellow-200/20 blur-3xl"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shrink-0 border border-white/20 shadow-xl">
              🔧
            </div>
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider border border-white/20 mb-2">
                <span className="w-2 h-2 rounded-full bg-yellow-200 animate-pulse"></span>
                Catálogo Técnico
              </span>
              <h1 className="text-2xl md:text-3xl font-black leading-tight">Gestión de Servicios</h1>
              <p className="text-sm md:text-base text-white/85 mt-1 max-w-xl leading-relaxed">
                Administra los servicios técnicos, sus precios, duración y categorías. Controla la disponibilidad general del catálogo.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3 min-w-0 shrink-0">
            <div className="rounded-2xl p-3 md:p-4 backdrop-blur-sm bg-gradient-to-br from-white/20 to-white/5 border border-white/15 shadow-lg hover:-translate-y-0.5 transition-transform">
              <div className="text-xl mb-0.5">📋</div>
              <div className="text-2xl md:text-3xl font-black leading-none mb-0.5">{items.length}</div>
              <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-white/80">Total</div>
            </div>
            <div className="rounded-2xl p-3 md:p-4 backdrop-blur-sm bg-gradient-to-br from-emerald-300/25 to-emerald-400/10 border border-white/15 shadow-lg hover:-translate-y-0.5 transition-transform">
              <div className="text-xl mb-0.5">✅</div>
              <div className="text-2xl md:text-3xl font-black leading-none mb-0.5">{totalActivos}</div>
              <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-white/80">Activos</div>
            </div>
            <div className="rounded-2xl p-3 md:p-4 backdrop-blur-sm bg-gradient-to-br from-slate-500/25 to-slate-600/10 border border-white/15 shadow-lg hover:-translate-y-0.5 transition-transform">
              <div className="text-xl mb-0.5">⏸️</div>
              <div className="text-2xl md:text-3xl font-black leading-none mb-0.5">{totalInactivos}</div>
              <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-white/80">Inactivos</div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DE FILTROS COMPLETO */}
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-custom-md border border-gray-100 overflow-hidden relative space-y-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"></div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar servicio, descripción, categoría, duración o precio..."
                className="w-full sm:w-80 pl-10 pr-10 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent-light outline-none bg-gray-50/60 focus:bg-white transition-colors"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center text-xs font-bold"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-accent-light outline-none cursor-pointer hover:border-accent min-w-[8rem]"
            >
              <option value="todas">📂 Todas las categorías ({categorias.length || 0})</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>📁 {cat}</option>
              ))}
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-accent-light outline-none cursor-pointer hover:border-accent"
            >
              <option value="todos">🟣 Todos los estados</option>
              <option value="activo">🟢 Solo activos ({totalActivos})</option>
              <option value="inactivo">🔴 Solo inactivos ({totalInactivos})</option>
            </select>

            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-accent-light outline-none cursor-pointer hover:border-accent"
            >
              <option value="recientes">⏰ Más recientes</option>
              <option value="antiguos">📜 Más antiguos</option>
              <option value="precio_desc">💰 Precio mayor</option>
              <option value="precio_asc">💵 Precio menor</option>
              <option value="nombre_az">🔤 Nombre A-Z</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {hayFiltrosActivos ? (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold transition-colors cursor-pointer"
              >
                🧹 Limpiar filtros
              </button>
            ) : (
              <Button variant="primary" size="md" onClick={openCreate}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Nuevo servicio
              </Button>
            )}
            {hayFiltrosActivos && (
              <Button variant="primary" size="md" onClick={openCreate}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Nuevo servicio
              </Button>
            )}
          </div>
        </div>

        {/* CHIPS DE FILTROS ACTIVOS + BARRA INFORMATIVA */}
        {hayFiltrosActivos && (
          <div className="pt-4 border-t border-dashed border-gray-200 flex flex-wrap items-center gap-2 justify-between">
            <div className="text-[11px] font-bold text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
              📋 Mostrando <span className="text-accent text-sm">{itemsFiltrados.length}</span> de{' '}
              <span className="text-text-heading">{items.length}</span> servicios
              {filtroCategoria !== 'todas' && (<> · Categoría: <span className="text-amber-600">{filtroCategoria}</span></>)}
              {filtroEstado !== 'todos' && (<> · Estado: <span className={filtroEstado === 'activo' ? 'text-emerald-600' : 'text-red-600'}>{filtroEstado}</span></>)}
              {busqueda.trim() && (<> · Búsqueda: <span className="text-emerald-600">"{busqueda.trim()}"</span></>)}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {busqueda.trim() && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                  🔍 "{busqueda.trim()}"
                  <button onClick={() => setBusqueda('')} className="hover:text-emerald-900 cursor-pointer">✕</button>
                </span>
              )}
              {filtroCategoria !== 'todas' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                  📂 Categoría: {filtroCategoria}
                  <button onClick={() => setFiltroCategoria('todas')} className="hover:text-amber-900 cursor-pointer">✕</button>
                </span>
              )}
              {filtroEstado !== 'todos' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold">
                  🎯 Estado: {filtroEstado}
                  <button onClick={() => setFiltroEstado('todos')} className="hover:text-purple-900 cursor-pointer">✕</button>
                </span>
              )}
              {ordenarPor !== 'recientes' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                  ↕️ Orden: {ordenarPor}
                  <button onClick={() => setOrdenarPor('recientes')} className="hover:text-blue-900 cursor-pointer">✕</button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TABLA DE SERVICIOS */}
      <div className="bg-white rounded-3xl shadow-custom-md border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="relative">
              <div className="w-10 h-10 border-4 border-amber-200 rounded-full"></div>
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="p-12 md:p-14 text-center overflow-hidden relative">
            {items.length === 0 ? (
              <>
                <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mx-auto mb-4">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                </div>
                <h3 className="font-bold text-text-heading text-lg">Sin servicios registrados</h3>
                <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
                  Aún no has creado ningún servicio técnico. Comienza creando el primer servicio de tu catálogo.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 justify-center">
                  <Button variant="primary" size="md" onClick={openCreate}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Crear primer servicio
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mx-auto mb-4">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <h3 className="font-bold text-text-heading text-lg">Sin resultados para tus filtros</h3>
                <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
                  Prueba a cambiar el término de búsqueda, la categoría o el estado. Actualmente hay{' '}
                  <strong className="text-gray-600">{items.length}</strong> servicios en total.
                </p>
                <button
                  onClick={limpiarFiltros}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent-dark transition-colors cursor-pointer"
                >
                  🧹 Limpiar todos los filtros
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase font-bold tracking-wider">
                <tr>
                  {['ID','Servicio','Categoría','Precio','Duración','Estado','Acciones'].map(h => (
                    <th key={h} className="text-left font-black text-gray-500 px-5 py-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {itemsFiltrados.map(s => (
                  <tr key={s.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-5 py-3 text-gray-500 font-bold">#{s.id}</td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-text-heading">{s.nombre}</p>
                      <p className="text-[11px] text-gray-400 line-clamp-1 max-w-md">{s.descripcion}</p>
                    </td>
                    <td className="px-5 py-3">
                      {s.categoria
                        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">📁 {s.categoria}</span>
                        : <span className="text-gray-300 italic text-xs">Sin categoría</span>}
                    </td>
                    <td className="px-5 py-3 font-black text-text-heading text-base">{formatearCOP(s.precio)}</td>
                    <td className="px-5 py-3">
                      {s.duracion
                        ? <span className="inline-flex items-center gap-1 text-sm text-gray-600 font-medium">⏱️ {s.duracion}</span>
                        : <span className="text-gray-300 italic text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <button onClick={() => toggleEstado(s.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                          s.estado === 'activo'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                        }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {s.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(s)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer" title="Editar servicio">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button onClick={() => borrar(s.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Eliminar servicio">
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

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={close}>
          <div className="bg-white rounded-2xl shadow-custom-xl max-w-xl w-full max-h-[90vh] flex flex-col animate-[fadeIn_0.2s_ease-out]" onClick={e=>e.stopPropagation()}>
            <div className="px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">
                {modal.mode === 'create' ? 'Nuevo Servicio' : 'Editar Servicio'}
              </h3>
              <button onClick={close} className="w-9 h-9 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-5">
                <div className="md:col-span-2">
                  <Input label="Nombre" name="nombre" value={formData.nombre || ''}
                    onChange={handleChange} error={errors.nombre || ''} maxLength={100} required />
                </div>
                <div className="md:col-span-2 mb-4">
                  <label className="block text-sm font-medium text-text-heading mb-1.5">Descripción</label>
                  <textarea name="descripcion" rows={3}
                    value={formData.descripcion || ''} onChange={handleChange} maxLength={500}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-accent focus:ring-2 focus:ring-accent-light resize-none" />
                </div>
                <Input label="Precio (COP)" type="number" name="precio"
                  value={formData.precio || ''} onChange={handleChange} error={errors.precio || ''} required />
                <Input label="Duración" name="duracion"
                  value={formData.duracion || ''} onChange={handleChange} maxLength={50}
                  placeholder="Ej: 2 horas" />
                <Input label="Categoría" name="categoria"
                  value={formData.categoria || ''} onChange={handleChange} maxLength={50} />
                <div>
                  <label className="block text-sm font-medium text-text-heading mb-1.5">Estado</label>
                  <select name="estado" value={formData.estado || 'activo'} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-accent focus:ring-2 focus:ring-accent-light bg-white">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
            </form>
            <div className="px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end bg-gray-50">
              <Button type="button" variant="secondary" size="md" onClick={close}>Cancelar</Button>
              <Button type="submit" variant="primary" size="md" disabled={submitting} onClick={handleSubmit}>
                {submitting ? 'Guardando...' : (modal.mode === 'create' ? 'Crear servicio' : 'Guardar cambios')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminServicios
