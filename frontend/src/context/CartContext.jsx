import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const formatPrice = (value) => {
  if (value === null || value === undefined) return '$0';
  let num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) num = 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(num);
};

export const parseNumericPrice = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('mitienda_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mitienda_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error guardando carrito en localStorage:', e);
    }
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    if (!product) return;
    const numericPrice = parseNumericPrice(product.precio);
    const qty = parseInt(quantity, 10) || 1;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => String(item.id) === String(product.id));
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].cantidad + qty;
        const maxStock = product.stock ? parseInt(product.stock, 10) : 999;
        updated[existingIndex].cantidad = Math.min(newQty, maxStock);
        return updated;
      }
      return [
        ...prev,
        {
          id: product.id,
          nombre: product.nombre,
          precio: numericPrice,
          precioOriginal: product.precio,
          cantidad: qty,
          categoria: product.categoria || '',
          descripcion: product.descripcion || '',
          imagen_url: product.imagen_url || product.imagen || '',
          stock: product.stock !== undefined ? parseInt(product.stock, 10) : 10,
        },
      ];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(productId)) {
          const maxStock = item.stock ? parseInt(item.stock, 10) : 999;
          return { ...item, cantidad: Math.min(qty, maxStock) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => String(item.id) !== String(productId)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((acc, item) => acc + (item.cantidad || 0), 0);

  const subtotal = cart.reduce((acc, item) => {
    const price = typeof item.precio === 'number' ? item.precio : parseNumericPrice(item.precio);
    return acc + price * (item.cantidad || 1);
  }, 0);

  const envio = 0; // Envío gratis
  const total = subtotal + envio;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        envio,
        total,
        formatPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
}

export default CartContext;
