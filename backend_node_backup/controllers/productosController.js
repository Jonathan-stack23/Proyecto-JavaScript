import pool from '../config/db.js';

export const getProductos = async (req, res) => {
  try {
    const soloActivos = req.query.activos === 'true';
    const sql = soloActivos
      ? 'SELECT * FROM productos WHERE estado = ? ORDER BY created_at DESC'
      : 'SELECT * FROM productos ORDER BY created_at DESC';
    const params = soloActivos ? ['activo'] : [];
    const [rows] = await pool.query(sql, params);
    return res.status(200).json({ ok: true, total: rows.length, productos: rows });
  } catch (error) {
    console.error('Error getProductos:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const getProductoById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });
    }
    return res.status(200).json({ ok: true, producto: rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const createProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria, imagen_url, estado } = req.body;
    if (!nombre || !precio || precio < 0) {
      return res.status(400).json({ ok: false, message: 'Nombre y precio son obligatorios (precio debe ser positivo).' });
    }

    const [result] = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url, estado, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion || null, precio, stock || 0, categoria || null, imagen_url || null, estado || 'activo', req.user.id]
    );

    const [newProd] = await pool.query('SELECT * FROM productos WHERE id = ?', [result.insertId]);
    return res.status(201).json({
      ok: true,
      message: 'Producto creado exitosamente.',
      producto: newProd[0],
    });
  } catch (error) {
    console.error('Error createProducto:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria, imagen_url, estado } = req.body;

    const [existing] = await pool.query('SELECT id FROM productos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });
    }

    const fields = [];
    const values = [];
    if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre); }
    if (descripcion !== undefined) { fields.push('descripcion = ?'); values.push(descripcion); }
    if (precio !== undefined) { fields.push('precio = ?'); values.push(precio); }
    if (stock !== undefined) { fields.push('stock = ?'); values.push(stock); }
    if (categoria !== undefined) { fields.push('categoria = ?'); values.push(categoria); }
    if (imagen_url !== undefined) { fields.push('imagen_url = ?'); values.push(imagen_url); }
    if (estado !== undefined) { fields.push('estado = ?'); values.push(estado); }

    if (fields.length === 0) {
      return res.status(400).json({ ok: false, message: 'No hay campos para actualizar.' });
    }

    values.push(id);
    await pool.query(`UPDATE productos SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    return res.status(200).json({
      ok: true,
      message: 'Producto actualizado exitosamente.',
      producto: updated[0],
    });
  } catch (error) {
    console.error('Error updateProducto:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const toggleEstadoProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id, estado FROM productos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });
    }
    const nuevoEstado = existing[0].estado === 'activo' ? 'inactivo' : 'activo';
    await pool.query('UPDATE productos SET estado = ? WHERE id = ?', [nuevoEstado, id]);
    return res.status(200).json({
      ok: true,
      message: `Estado cambiado a: ${nuevoEstado}`,
      estado: nuevoEstado,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM productos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });
    }
    await pool.query('DELETE FROM productos WHERE id = ?', [id]);
    return res.status(200).json({ ok: true, message: 'Producto eliminado exitosamente.' });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};
