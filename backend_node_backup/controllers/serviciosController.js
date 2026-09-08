import pool from '../config/db.js';

export const getServicios = async (req, res) => {
  try {
    const soloActivos = req.query.activos === 'true';
    const sql = soloActivos
      ? `SELECT s.*, u.nombre as empleado_nombre, u.apellido as empleado_apellido,
                u.email as empleado_email, u.telefono as empleado_telefono,
                u.tipo_documento as empleado_tipo_doc, u.numero_documento as empleado_num_doc
         FROM servicios s
         LEFT JOIN usuarios u ON s.usuario_id = u.id
         WHERE s.estado = ?
         ORDER BY s.created_at DESC`
      : `SELECT s.*, u.nombre as empleado_nombre, u.apellido as empleado_apellido,
                u.email as empleado_email, u.telefono as empleado_telefono,
                u.tipo_documento as empleado_tipo_doc, u.numero_documento as empleado_num_doc
         FROM servicios s
         LEFT JOIN usuarios u ON s.usuario_id = u.id
         ORDER BY s.created_at DESC`;
    const params = soloActivos ? ['activo'] : [];
    const [rows] = await pool.query(sql, params);
    return res.status(200).json({ ok: true, total: rows.length, servicios: rows });
  } catch (error) {
    console.error('Error getServicios:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const getServicioById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.nombre as empleado_nombre, u.apellido as empleado_apellido,
              u.email as empleado_email, u.telefono as empleado_telefono
       FROM servicios s
       LEFT JOIN usuarios u ON s.usuario_id = u.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Servicio no encontrado.' });
    }
    return res.status(200).json({ ok: true, servicio: rows[0] });
  } catch (error) {
    console.error('Error getServicioById:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const createServicio = async (req, res) => {
  try {
    const { nombre, descripcion, precio, duracion, categoria, imagen_url, estado } = req.body;
    if (!nombre || !precio || precio < 0) {
      return res.status(400).json({ ok: false, message: 'Nombre y precio son obligatorios.' });
    }

    const [result] = await pool.query(
      `INSERT INTO servicios (nombre, descripcion, precio, duracion, categoria, imagen_url, estado, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion || null, precio, duracion || null, categoria || null, imagen_url || null, estado || 'activo', req.user.id]
    );

    const [newSvc] = await pool.query('SELECT * FROM servicios WHERE id = ?', [result.insertId]);
    return res.status(201).json({
      ok: true,
      message: 'Servicio creado exitosamente.',
      servicio: newSvc[0],
    });
  } catch (error) {
    console.error('Error createServicio:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const updateServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, duracion, categoria, imagen_url, estado } = req.body;

    const [existing] = await pool.query('SELECT id FROM servicios WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ ok: false, message: 'Servicio no encontrado.' });
    }

    const fields = [];
    const values = [];
    if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre); }
    if (descripcion !== undefined) { fields.push('descripcion = ?'); values.push(descripcion); }
    if (precio !== undefined) { fields.push('precio = ?'); values.push(precio); }
    if (duracion !== undefined) { fields.push('duracion = ?'); values.push(duracion); }
    if (categoria !== undefined) { fields.push('categoria = ?'); values.push(categoria); }
    if (imagen_url !== undefined) { fields.push('imagen_url = ?'); values.push(imagen_url); }
    if (estado !== undefined) { fields.push('estado = ?'); values.push(estado); }

    if (fields.length === 0) {
      return res.status(400).json({ ok: false, message: 'No hay campos para actualizar.' });
    }

    values.push(id);
    await pool.query(`UPDATE servicios SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query('SELECT * FROM servicios WHERE id = ?', [id]);
    return res.status(200).json({
      ok: true,
      message: 'Servicio actualizado exitosamente.',
      servicio: updated[0],
    });
  } catch (error) {
    console.error('Error updateServicio:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const toggleEstadoServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id, estado FROM servicios WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ ok: false, message: 'Servicio no encontrado.' });
    }
    const nuevoEstado = existing[0].estado === 'activo' ? 'inactivo' : 'activo';
    await pool.query('UPDATE servicios SET estado = ? WHERE id = ?', [nuevoEstado, id]);
    return res.status(200).json({
      ok: true,
      message: `Estado cambiado a: ${nuevoEstado}`,
      estado: nuevoEstado,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const deleteServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM servicios WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ ok: false, message: 'Servicio no encontrado.' });
    }
    await pool.query('DELETE FROM servicios WHERE id = ?', [id]);
    return res.status(200).json({ ok: true, message: 'Servicio eliminado exitosamente.' });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};
