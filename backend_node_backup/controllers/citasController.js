import pool from '../config/db.js';

/**
 * Agendar una nueva cita para un servicio técnico
 */
export const createCita = async (req, res) => {
  try {
    const {
      servicio_id,
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      fecha_cita,
      hora_cita,
      direccion = '',
      notas = '',
    } = req.body;

    if (!servicio_id || !cliente_nombre || !cliente_email || !cliente_telefono || !fecha_cita || !hora_cita) {
      return res.status(400).json({
        ok: false,
        message: 'Servicio, nombre, email, teléfono, fecha y hora son obligatorios para agendar.',
      });
    }

    // Verificar que el servicio exista
    const [servicios] = await pool.query('SELECT id, nombre, precio, duracion FROM servicios WHERE id = ?', [servicio_id]);
    if (servicios.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'El servicio seleccionado no existe.',
      });
    }

    let usuario_id = req.user ? req.user.id : null;
    if (!usuario_id && cliente_email) {
      try {
        const [uRows] = await pool.query('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?)', [cliente_email.trim()]);
        if (uRows.length > 0) usuario_id = uRows[0].id;
      } catch {}
    }

    const [result] = await pool.query(
      `INSERT INTO citas_servicios (
        servicio_id, usuario_id, cliente_nombre, cliente_email, cliente_telefono,
        fecha_cita, hora_cita, direccion, notas, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'en revision')`,
      [
        servicio_id,
        usuario_id,
        cliente_nombre.trim(),
        cliente_email.trim(),
        cliente_telefono.trim(),
        fecha_cita,
        hora_cita,
        direccion ? direccion.trim() : null,
        notas ? notas.trim() : null,
      ]
    );

    return res.status(201).json({
      ok: true,
      message: '¡Servicio agendado exitosamente!',
      cita: {
        id: result.insertId,
        servicio: servicios[0].nombre,
        fecha_cita,
        hora_cita,
        cliente_nombre,
        estado: 'en revision',
      },
    });
  } catch (error) {
    console.error('Error createCita:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al agendar la cita. Inténtalo más tarde.',
    });
  }
};

/**
 * Obtener todas las citas (Para Empleado y Administrador)
 */
export const getCitas = async (req, res) => {
  try {
    const { estado, q } = req.query;
    let sql = `
      SELECT cs.*,
             s.nombre as servicio_nombre,
             s.precio as servicio_precio,
             s.duracion as servicio_duracion,
             s.categoria as servicio_categoria,
             s.imagen_url as servicio_imagen
      FROM citas_servicios cs
      JOIN servicios s ON cs.servicio_id = s.id
    `;

    const whereConditions = [];
    const params = [];

    if (estado && estado !== 'todos') {
      whereConditions.push('cs.estado = ?');
      params.push(estado);
    }

    if (q) {
      whereConditions.push('(cs.cliente_nombre LIKE ? OR cs.cliente_email LIKE ? OR s.nombre LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    sql += ' ORDER BY cs.fecha_cita DESC, cs.hora_cita DESC';

    const [rows] = await pool.query(sql, params);

    return res.status(200).json({
      ok: true,
      total: rows.length,
      citas: rows,
    });
  } catch (error) {
    console.error('Error getCitas:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener las citas.',
    });
  }
};

/**
 * Obtener citas del cliente autenticado
 */
export const getMisCitas = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const sql = `
      SELECT cs.*,
             s.nombre as servicio_nombre,
             s.precio as servicio_precio,
             s.duracion as servicio_duracion,
             s.categoria as servicio_categoria,
             s.imagen_url as servicio_imagen
      FROM citas_servicios cs
      JOIN servicios s ON cs.servicio_id = s.id
      WHERE cs.usuario_id = ? OR cs.cliente_email = ?
      ORDER BY cs.fecha_cita DESC, cs.hora_cita DESC
    `;

    const [rows] = await pool.query(sql, [userId, userEmail]);

    return res.status(200).json({
      ok: true,
      total: rows.length,
      citas: rows,
    });
  } catch (error) {
    console.error('Error getMisCitas:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener tus citas agendadas.',
    });
  }
};

/**
 * Actualizar estado de una cita (en revision, revisado, hecho, cancelado)
 * Accesible por Administrador y Empleado
 */
export const updateEstadoCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['en revision', 'revisado', 'hecho', 'cancelado'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        ok: false,
        message: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`,
      });
    }

    const [existing] = await pool.query('SELECT id FROM citas_servicios WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Cita no encontrada.',
      });
    }

    await pool.query('UPDATE citas_servicios SET estado = ? WHERE id = ?', [estado, id]);

    return res.status(200).json({
      ok: true,
      message: `Estado de la cita #${id} actualizado a "${estado}".`,
      estado,
    });
  } catch (error) {
    console.error('Error updateEstadoCita:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar el estado de la cita.',
    });
  }
};

