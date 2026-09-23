import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

export const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.tipo_documento, u.numero_documento, u.direccion,
              u.telefono, u.email, u.rol_id, r.nombre as rol_nombre, u.estado, u.created_at, u.updated_at
       FROM usuarios u JOIN roles r ON u.rol_id = r.id
       ORDER BY u.created_at DESC`
    );

    return res.status(200).json({
      ok: true,
      total: rows.length,
      usuarios: rows,
    });
  } catch (error) {
    console.error('Error getUsuarios:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.tipo_documento, u.numero_documento, u.direccion,
              u.telefono, u.email, u.rol_id, r.nombre as rol_nombre, u.estado, u.created_at
       FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    return res.status(200).json({ ok: true, usuario: rows[0] });
  } catch (error) {
    console.error('Error getUsuarioById:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const checkEmailDisponible = async (req, res) => {
  try {
    const { email, excludeId } = req.query;
    if (!email) {
      return res.status(400).json({ ok: false, message: 'El parámetro email es obligatorio.' });
    }
    const correo = String(email).trim().toLowerCase();
    let sql = 'SELECT id FROM usuarios WHERE LOWER(email) = ?';
    const params = [correo];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    const [rows] = await pool.query(sql, params);
    return res.status(200).json({
      ok: true,
      email: correo,
      disponible: rows.length === 0,
    });
  } catch (error) {
    console.error('Error checkEmailDisponible:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const createUsuario = async (req, res) => {
  try {
    const {
      nombre, apellido, tipo_documento, numero_documento, direccion,
      telefono, email, password, rol_id
    } = req.body;

    const correo = String(email).trim().toLowerCase();

    if (!password) {
      return res.status(400).json({ ok: false, message: 'La contraseña es obligatoria.' });
    }

    const [existingEmail] = await pool.query(
      'SELECT id FROM usuarios WHERE LOWER(email) = ?',
      [correo]
    );
    if (existingEmail.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'El correo electrónico ya está registrado en el sistema.',
        errors: { email: 'El correo electrónico ya está registrado en el sistema.' },
      });
    }

    const [existingDoc] = await pool.query('SELECT id FROM usuarios WHERE numero_documento = ?', [numero_documento]);
    if (existingDoc.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'El documento ya está registrado.',
        errors: { numero_documento: 'El documento ya está registrado.' },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
      [
        String(nombre).trim(),
        String(apellido).trim(),
        tipo_documento,
        String(numero_documento).trim(),
        String(direccion).trim(),
        String(telefono).trim(),
        correo,
        hashedPassword,
        rol_id || 3,
      ]
    );

    const [newUser] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, r.nombre as rol_nombre, u.estado
       FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      ok: true,
      message: 'Usuario creado exitosamente.',
      usuario: newUser[0],
    });
  } catch (error) {
    console.error('Error createUsuario:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre, apellido, tipo_documento, numero_documento, direccion,
      telefono, email, rol_id, password
    } = req.body;

    const [existing] = await pool.query('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    if (email) {
      const correo = String(email).trim().toLowerCase();
      const [existingEmail] = await pool.query(
        'SELECT id FROM usuarios WHERE LOWER(email) = ? AND id != ?',
        [correo, id]
      );
      if (existingEmail.length > 0) {
        return res.status(409).json({
          ok: false,
          message: 'El correo electrónico ya está en uso por otro usuario.',
          errors: { email: 'El correo electrónico ya está en uso por otro usuario.' },
        });
      }
    }

    if (numero_documento) {
      const [existingDoc] = await pool.query(
        'SELECT id FROM usuarios WHERE numero_documento = ? AND id != ?',
        [numero_documento, id]
      );
      if (existingDoc.length > 0) {
        return res.status(409).json({
          ok: false,
          message: 'El documento ya está en uso por otro usuario.',
          errors: { numero_documento: 'El documento ya está en uso por otro usuario.' },
        });
      }
    }

    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const fields = [];
    const values = [];
    if (nombre !== undefined) { fields.push('nombre = ?'); values.push(String(nombre).trim()); }
    if (apellido !== undefined) { fields.push('apellido = ?'); values.push(String(apellido).trim()); }
    if (tipo_documento !== undefined) { fields.push('tipo_documento = ?'); values.push(tipo_documento); }
    if (numero_documento !== undefined) { fields.push('numero_documento = ?'); values.push(String(numero_documento).trim()); }
    if (direccion !== undefined) { fields.push('direccion = ?'); values.push(String(direccion).trim()); }
    if (telefono !== undefined) { fields.push('telefono = ?'); values.push(String(telefono).trim()); }
    if (email !== undefined) { fields.push('email = ?'); values.push(String(email).trim().toLowerCase()); }
    if (rol_id !== undefined) { fields.push('rol_id = ?'); values.push(rol_id); }
    if (hashedPassword) { fields.push('password = ?'); values.push(hashedPassword); }

    if (fields.length === 0) {
      return res.status(400).json({ ok: false, message: 'No hay campos para actualizar.' });
    }

    values.push(id);
    await pool.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, r.nombre as rol_nombre, u.estado
       FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
      [id]
    );

    return res.status(200).json({
      ok: true,
      message: 'Usuario actualizado exitosamente.',
      usuario: updated[0],
    });
  } catch (error) {
    console.error('Error updateUsuario:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const toggleEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      `SELECT u.id, u.estado, u.rol_id, r.nombre as rol_nombre
       FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    const usuario = existing[0];
    if (usuario.rol_nombre === 'Administrador' || usuario.rol_id === 1) {
      return res.status(400).json({
        ok: false,
        message: 'No puedes cambiar el estado de una cuenta de Administrador protegida.',
      });
    }

    const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo';
    await pool.query('UPDATE usuarios SET estado = ? WHERE id = ?', [nuevoEstado, id]);

    return res.status(200).json({
      ok: true,
      message: `Estado del usuario cambiado a: ${nuevoEstado}`,
      estado: nuevoEstado,
    });
  } catch (error) {
    console.error('Error toggleEstado:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      `SELECT u.id, u.rol_id, r.nombre as rol_nombre
       FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    const usuario = existing[0];
    if (usuario.rol_nombre === 'Administrador' || usuario.rol_id === 1) {
      return res.status(400).json({
        ok: false,
        message: 'No puedes eliminar cuentas de Administrador protegidas.',
      });
    }

    await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);

    return res.status(200).json({
      ok: true,
      message: 'Usuario eliminado exitosamente.',
    });
  } catch (error) {
    console.error('Error deleteUsuario:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const getRoles = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, descripcion FROM roles ORDER BY id');
    return res.status(200).json({ ok: true, roles: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};
