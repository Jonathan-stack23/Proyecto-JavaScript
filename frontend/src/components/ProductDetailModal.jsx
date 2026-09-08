import { useState, useEffect } from 'react';
import { useCart, formatPrice } from '../context/CartContext';
import { getProductImage } from '../utils/productImages';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';

export default function ProductDetailModal({ producto, isOpen, onClose, showAddToCart = true }) {
  const { addToCart } = useCart();
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);

  useEffect(() => {
    setCantidad(1);
    setAgregado(false);
  }, [producto, isOpen]);

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

  if (!isOpen || !producto) return null;

  const stock = producto.stock !== undefined ? parseInt(producto.stock, 10) : 10;
  const disponible = stock > 0;
  const imagen = getProductImage(producto);

  const handleSumar = () => {
    if (cantidad < stock) setCantidad((prev) => prev + 1);
  };

  const handleRestar = () => {
    if (cantidad > 1) setCantidad((prev) => prev - 1);
  };

  const handleAgregar = () => {
    addToCart(producto, cantidad);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose}></div>

      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-100 overflow-hidden z-10 my-8 transition-all transform animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con botón cerrar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Detalles del Producto
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
            aria-label="Cerrar modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Imagen y Badges */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center group">
            {producto.categoria && (
              <span className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-accent shadow-sm backdrop-blur-sm">
                {producto.categoria}
              </span>
            )}
            <span
              className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                disponible
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {disponible ? `${stock} disp.` : 'Agotado'}
            </span>

            <img
              src={imagen}
              alt={producto.nombre}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.src = FALLBACK_IMG;
              }}
            />
          </div>

          {/* Información */}
          <div className="flex flex-col h-full justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-accent tracking-wider mb-1">
                {producto.categoria || 'Tecnología'}
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-text-heading mb-3 leading-tight">
                {producto.nombre}
              </h2>

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-black text-accent">
                  {formatPrice(producto.precio)}
                </span>
                <span className="text-xs text-gray-400 font-medium">IVA incluido</span>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Descripción
                </h4>
                <p className="text-sm text-text leading-relaxed whitespace-pre-line">
                  {producto.descripcion || 'Sin descripción detallada disponible para este producto.'}
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div>
              {showAddToCart && disponible && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-text-heading">Cantidad:</span>
                    <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={handleRestar}
                        disabled={cantidad <= 1}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>
                      <span className="px-4 py-2 text-sm font-bold text-text-heading min-w-[2.5rem] text-center">
                        {cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={handleSumar}
                        disabled={cantidad >= stock}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAgregar}
                    className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] ${
                      agregado
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                        : 'bg-accent text-white hover:bg-accent-dark shadow-accent/20 hover:shadow-xl'
                    }`}
                  >
                    {agregado ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        ¡Agregado al carrito!
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        Agregar al carrito
                      </>
                    )}
                  </button>
                </div>
              )}

              {!disponible && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center text-red-600 font-semibold text-sm">
                  Producto agotado actualmente
                </div>
              )}

              {/* Badges de garantía */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 text-center">
                <div className="flex flex-col items-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" className="mb-1">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span className="text-[10px] text-gray-500 font-medium">Garantía oficial</span>
                </div>
                <div className="flex flex-col items-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" className="mb-1">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                  <span className="text-[10px] text-gray-500 font-medium">Envío gratuito</span>
                </div>
                <div className="flex flex-col items-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="mb-1">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span className="text-[10px] text-gray-500 font-medium">Soporte 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

