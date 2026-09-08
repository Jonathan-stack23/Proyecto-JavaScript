export const DEFAULT_PRODUCT_IMAGES = {
  laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
  computador: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
  smartphone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
  celular: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
  auricular: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  audifono: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
  pantalla: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
  teclado: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
  mouse: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
  rog: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
  consola: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
};

/**
 * Obtiene la imagen apropiada y diferenciada para cada producto según su URL, nombre o categoría
 */
export const getProductImage = (product) => {
  if (!product) return DEFAULT_PRODUCT_IMAGES.laptop;

  // Si ya tiene una URL válida específica y no es genérica
  if (product.imagen_url && typeof product.imagen_url === 'string' && product.imagen_url.trim().length > 10) {
    return product.imagen_url;
  }
  if (product.imagen && typeof product.imagen === 'string' && product.imagen.trim().length > 10) {
    return product.imagen;
  }

  // Si no tiene imagen_url en la BD, determinar por nombre o categoría
  const texto = `${product.nombre || ''} ${product.categoria || ''}`.toLowerCase();

  if (texto.includes('mouse') || texto.includes('raton')) return DEFAULT_PRODUCT_IMAGES.mouse;
  if (texto.includes('teclado') || texto.includes('keyboard')) return DEFAULT_PRODUCT_IMAGES.teclado;
  if (texto.includes('monitor') || texto.includes('pantalla') || texto.includes('display')) return DEFAULT_PRODUCT_IMAGES.monitor;
  if (texto.includes('auricular') || texto.includes('audifono') || texto.includes('audio') || texto.includes('headphone')) return DEFAULT_PRODUCT_IMAGES.auricular;
  if (texto.includes('smartphone') || texto.includes('celular') || texto.includes('telefono') || texto.includes('galaxy') || texto.includes('iphone')) return DEFAULT_PRODUCT_IMAGES.smartphone;
  if (texto.includes('rog') || texto.includes('consola') || texto.includes('game') || texto.includes('gamer')) return DEFAULT_PRODUCT_IMAGES.rog;
  if (texto.includes('laptop') || texto.includes('computador') || texto.includes('pc') || texto.includes('portatil')) return DEFAULT_PRODUCT_IMAGES.laptop;

  return DEFAULT_PRODUCT_IMAGES.laptop;
};
