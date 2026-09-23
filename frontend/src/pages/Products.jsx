import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCart, formatPrice } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductDetailModal from '../components/ProductDetailModal';
import { getProductImage } from '../utils/productImages';
import api from '../services/api';

const PRODUCTOS_DEFAULT = [
  { id: 1, nombre: 'Laptop HP Pavilion 15"', precio: 3599000, categoria: 'Computadores', descripcion: 'Laptop de alto rendimiento con procesador i7, 16GB RAM y 512GB SSD.', stock: 15, imagen_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&h=600&q=80' },
  { id: 2, nombre: 'Smartphone Samsung Galaxy A54', precio: 1899000, categoria: 'Celulares', descripcion: 'Pantalla AMOLED 6.5", cámara 108MP, batería de 5000mAh, 128GB.', stock: 25, imagen_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&h=600&q=80' },
  { id: 3, nombre: 'Auriculares Inalámbricos Bluetooth', precio: 299000, categoria: 'Accesorios', descripcion: 'Cancelación activa de ruido, 30 horas de autonomía inalámbrica.', stock: 50, imagen_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&h=600&q=80' },
  { id: 4, nombre: 'Monitor LG 27" Full HD IPS', precio: 899000, categoria: 'Monitores', descripcion: 'Pantalla Full HD IPS, bordes ultra delgados, 75Hz con FreeSync.', stock: 20, imagen_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&h=600&q=80' },
  { id: 5, nombre: 'Teclado Mecánico RGB Gamer', precio: 459000, categoria: 'Accesorios', descripcion: 'Switches mecánicos, retroiluminación RGB configurable, anti-ghosting.', stock: 30, imagen_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=500&h=600&q=80' },
  { id: 6, nombre: 'Mouse Gamer RGB 16000 DPI', precio: 249000, categoria: 'Accesorios', descripcion: 'Sensor óptico de alta precisión, peso regulable, iluminación RGB.', stock: 40, imagen_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=500&h=600&q=80' },
];

const FALLBACK_PRODUCTO_IMG =
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&h=600&q=80';

const iconosCategoria = {
  'Todas': '🛍️',
  'Computadores': '💻',
  'Celulares': '📱',
  'Accesorios': '🎧',
  'Monitores': '🖥️',
};

function Products() {
  const { addToCart } = useCart();
  const { hasRole } = useAuth();
  const esAdminOEmpleado = hasRole('Administrador') || hasRole('Empleado');
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('default');

  const [productoModal, setProductoModal] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [agregadosIds, setAgregadosIds] = useState({});

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true);
        const res = await api.get('/productos', { params: { activos: 'true' } });
        if (res.data?.ok && res.data.productos?.length > 0) {
          setProductos(res.data.productos);
        } else {
          setProductos(PRODUCTOS_DEFAULT);
        }
      } catch (e) {
        console.warn('Cargando productos default por error de API:', e);
        setProductos(PRODUCTOS_DEFAULT);
      } finally {
        setCargando(false);
      }
    };
    cargarProductos();
  }, []);

  const categorias = useMemo(() => {
    const cats = productos.map((p) => p.categoria).filter(Boolean);
    return ['Todas', ...Array.from(new Set(cats))];
  }, [productos]);

  const contarPorCategoria = useCallback((cat) => {
    if (cat === 'Todas') return productos.length;
    return productos.filter((p) => p.categoria === cat).length;
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    let resultado = productos.filter((p) => {
      const coincideCategoria = categoriaActiva === 'Todas' || p.categoria === categoriaActiva;
      const coincideBusqueda = !busqueda ||
        p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      return coincideCategoria && coincideBusqueda;
    });

    switch (ordenarPor) {
      case 'precio_asc':
        resultado = [...resultado].sort((a, b) => Number(a.precio) - Number(b.precio));
        break;
      case 'precio_desc':
        resultado = [...resultado].sort((a, b) => Number(b.precio) - Number(a.precio));
        break;
      case 'nombre_az':
        resultado = [...resultado].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        break;
      case 'stock_desc':
        resultado = [...resultado].sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));
        break;
      default:
        break;
    }
    return resultado;
  }, [productos, categoriaActiva, busqueda, ordenarPor]);

  const handleAgregar = (p) => {
    addToCart(p, 1);
    setAgregadosIds((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setAgregadosIds((prev) => ({ ...prev, [p.id]: false }));
    }, 1500);
  };

  const abrirModalDetalles = (p) => {
    setProductoModal(p);
    setModalAbierto(true);
  };

  return (
    <div className="products-page">
      {/* Banner Principal */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent-light via-white to-purple-50 py-16 md:py-20">
        <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-purple-200/40 blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-100 shadow-sm text-accent mb-4">
            Catálogo Oficial MiTienda
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-heading mb-4">
            Hardware & Accesorios Premium
          </h2>
          <p className="text-text max-w-2xl mx-auto text-base md:text-lg">
            Encuentra tecnología de última generación con garantía directa, envío rápido y pagos seguros.
          </p>

          {/* Buscador */}
          <div className="max-w-md mx-auto mt-8">
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o descripción..."
                className="w-full px-5 py-3.5 pl-12 rounded-2xl bg-white border border-gray-200 shadow-sm focus:border-accent focus:ring-2 focus:ring-accent-light outline-none text-sm"
              />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" className="absolute left-4 top-4">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filtro de categorías + Ordenamiento */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Botones de categorías */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none flex-1">
            {categorias.map((cat) => {
              const cantidad = contarPorCategoria(cat);
              const estaActiva = categoriaActiva === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaActiva(cat)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 cursor-pointer active:scale-95 ${
                    estaActiva
                      ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-accent/50 hover:bg-accent/5 hover:text-accent'
                  }`}
                >
                  <span className="text-sm">{iconosCategoria[cat] || '🏷️'}</span>
                  <span>{cat}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    estaActiva ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {cantidad}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selector de ordenamiento */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-bold text-gray-500 whitespace-nowrap">Ordenar:</label>
            <div className="relative">
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-10 rounded-2xl text-xs font-bold bg-white border border-gray-200 text-gray-700 cursor-pointer focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all hover:border-accent/50"
              >
                <option value="default">Relevancia</option>
                <option value="precio_asc">Precio: Menor a Mayor</option>
                <option value="precio_desc">Precio: Mayor a Menor</option>
                <option value="nombre_az">Nombre (A-Z)</option>
                <option value="stock_desc">Más Stock</option>
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </div>

        {/* Barra informativa de resultados */}
        <div className="flex items-center justify-between mt-3 mb-2 px-1">
          <p className="text-[11px] font-semibold text-gray-400">
            Mostrando <span className="text-accent font-black">{productosFiltrados.length}</span> de{' '}
            <span className="text-text-heading font-black">{productos.length}</span> productos
            {categoriaActiva !== 'Todas' && (
              <> en <span className="text-purple-600 font-black">{categoriaActiva}</span></>
            )}
            {busqueda && (
              <> para "<span className="text-indigo-600 font-black">{busqueda}</span>"</>
            )}
          </p>
          {(categoriaActiva !== 'Todas' || busqueda || ordenarPor !== 'default') && (
            <button
              type="button"
              onClick={() => {
                setCategoriaActiva('Todas');
                setBusqueda('');
                setOrdenarPor('default');
              }}
              className="text-[11px] font-bold text-accent hover:text-accent-dark transition-colors flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              Limpiar filtros
            </button>
          )}
        </div>
      </section>

      {/* Grid de Productos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {cargando ? (
          <div className="text-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Cargando catálogo...</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3 className="font-bold text-text-heading text-lg mb-1">No se encontraron productos</h3>
            <p className="text-xs text-gray-400 mb-4">Prueba cambiando los términos de búsqueda o de categoría.</p>
            <button
              onClick={() => {
                setBusqueda('');
                setCategoriaActiva('Todas');
              }}
              className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {productosFiltrados.map((p) => {
              const imagen = getProductImage(p);
              const stock = p.stock !== undefined ? parseInt(p.stock, 10) : 10;
              const estaAgregado = agregadosIds[p.id];

              return (
                <div
                  key={p.id}
                  className="group bg-white rounded-3xl overflow-hidden shadow-custom-sm ring-1 ring-gray-100 hover:shadow-custom-xl transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-[5/6] overflow-hidden bg-gray-100 flex items-center justify-center">
                    {p.categoria && (
                      <span className="absolute top-4 left-4 z-10 inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-accent shadow-sm">
                        {p.categoria}
                      </span>
                    )}
                    <span
                      className={`absolute top-4 right-4 z-10 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm ${
                        stock > 0 ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
                      }`}
                    >
                      {stock > 0 ? `${stock} disp.` : 'Agotado'}
                    </span>

                    <img
                      src={imagen}
                      alt={p.nombre}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = FALLBACK_PRODUCTO_IMG;
                      }}
                    />

                    {/* Overlay botón ver detalles */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-5">
                      <button
                        onClick={() => abrirModalDetalles(p)}
                        className="px-5 py-2.5 rounded-xl bg-white text-text-heading text-sm font-bold shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-accent hover:text-white"
                      >
                        👁️ Ver detalles
                      </button>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-text-heading mb-2 line-clamp-1">{p.nombre}</h3>
                    <p className="text-sm text-text mb-5 leading-relaxed flex-1 line-clamp-2">
                      {p.descripcion || 'Producto tecnológico de alta calidad.'}
                    </p>

                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-[10px] uppercase text-gray-400 font-bold block">Precio</span>
                        <p className="text-xl md:text-2xl font-black text-accent">{formatPrice(p.precio)}</p>
                      </div>

                      <div className="flex gap-2">
                        {/* Botón ver detalles directo */}
                        <button
                          onClick={() => abrirModalDetalles(p)}
                          className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                          title="Ver detalles completos"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>

                        {/* Botón agregar al carrito — solo para Clientes */}
                        {!esAdminOEmpleado && (
                        <button
                          onClick={() => handleAgregar(p)}
                          disabled={stock <= 0}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-[0.98] ${
                            estaAgregado
                              ? 'bg-emerald-500 text-white'
                              : 'bg-accent text-white hover:bg-accent-dark hover:shadow-lg disabled:opacity-40'
                          }`}
                        >
                          {estaAgregado ? (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              ¡Listo!
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                              </svg>
                              Agregar
                            </>
                          )}
                        </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de detalles de producto */}
      <ProductDetailModal
        producto={productoModal}
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setProductoModal(null);
        }}
        showAddToCart={!esAdminOEmpleado}
      />
    </div>
  );
}

export default Products;

