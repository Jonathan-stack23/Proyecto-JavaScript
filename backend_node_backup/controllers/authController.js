import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const checkEmailDisponiblePublic = async (req, res) => {
  try {
    const { email, excludeId } = req.query;
    if (!email) {
      return res.status(400).json({ ok: false, message: 'El parÃ¡metro email es obligatorio.' });
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
    console.error('Error checkEmailDisponiblePublic:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

export const register = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      tipoDocumento,
      numeroDocumento,
      direccion,
      telefono,
      email,
      password,
    } = req.body;

    const correo = String(email).trim().toLowerCase();

    const [existingEmail] = await pool.query(
      'SELECT id FROM usuarios WHERE LOWER(email) = ?',
      [correo]
    );
    if (existingEmail.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'El correo electrÃ³nico ya estÃ¡ registrado.',
        errors: { email: 'El correo electrÃ³nico ya estÃ¡ registrado. Usa otro o inicia sesiÃ³n.' },
      });
    }

    const [existingDoc] = await pool.query(
      'SELECT id FROM usuarios WHERE numero_documento = ?',
      [numeroDocumento]
    );
    if (existingDoc.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'El nÃºmero de documento ya estÃ¡ registrado.',
        errors: { numeroDocumento: 'El nÃºmero de documento ya estÃ¡ registrado.' },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const clienteRoleId = 3;

    const [result] = await pool.query(
      `INSERT INTO usuarios
       (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
      [
        String(nombre).trim(),
        String(apellido).trim(),
        tipoDocumento,
        String(numeroDocumento).trim(),
        String(direccion).trim(),
        String(telefono).trim(),
        correo,
        hashedPassword,
        clienteRoleId,
      ]
    );

    const [newUserRows] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.rol_id, r.nombre as rol_nombre, u.estado
       FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
      [result.insertId]
    );

    const newUser = newUserRows[0];
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.rol_nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(201).json({
      ok: true,
      message: 'Registro exitoso.',
      token,
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        email: newUser.email,
        rol: newUser.rol_nombre,
        estado: newUser.estado,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno del servidor al registrar usuario.',
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const correo = String(email).trim().toLowerCase();

    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.password, u.rol_id, u.estado, r.nombre as rol_nombre
       FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE LOWER(u.email) = ?`,
      [correo]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        ok: false,
        message: 'Correo o contraseÃ±a incorrectos.',
      });
    }

    const user = rows[0];

    if (user.estado !== 'activo') {
      return res.status(403).json({
        ok: false,
        message: 'Tu cuenta se encuentra inactiva. Contacta al administrador.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        ok: false,
        message: 'Correo o contraseÃ±a incorrectos.',
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.rol_nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      ok: true,
      message: 'Inicio de sesiÃ³n exitoso.',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol_nombre,
        estado: user.estado,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno del servidor al iniciar sesiÃ³n.',
    });
  }
};

export const recoverPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email) {
      return res.status(400).json({ ok: false, message: 'El correo es obligatorio.' });
    }
    if (!newPassword) {
      return res.status(400).json({ ok: false, message: 'La nueva contraseÃ±a es obligatoria.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ ok: false, message: 'La contraseÃ±a debe tener al menos 8 caracteres.' });
    }

    const correo = String(email).trim().toLowerCase();

    const [rows] = await pool.query('SELECT id FROM usuarios WHERE LOWER(email) = ?', [correo]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'No existe usuario con ese correo.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE usuarios SET password = ? WHERE LOWER(email) = ?', [hashedPassword, correo]);

    return res.status(200).json({
      ok: true,
      message: 'ContraseÃ±a actualizada exitosamente.',
    });
  } catch (error) {
    console.error('Error en recuperaciÃ³n:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno del servidor al actualizar contraseÃ±a.',
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.tipo_documento, u.numero_documento, u.direccion,
              u.telefono, u.email, u.rol_id, r.nombre as rol_nombre, u.estado
       FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    return res.status(200).json({
      ok: true,
      user: rows[0],
    });
  } catch (error) {
    console.error('Error en getProfile:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno del servidor.',
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      nombre,
      apellido,
      tipo_documento,
      numero_documento,
      direccion,
      telefono,
      email,
      password_actual,
      nueva_password,
    } = req.body;

    // Obtener usuario actual con password
    const [rows] = await pool.query(
      'SELECT id, password, email, numero_documento FROM usuarios WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    const currentUser = rows[0];

    // Si quiere cambiar contraseÃ±a, verificar la actual
    let hashedNewPassword = null;
    if (nueva_password) {
      if (!password_actual) {
        return res.status(400).json({
          ok: false,
          message: 'Debes ingresar tu contraseÃ±a actual para cambiarla.',
          errors: { password_actual: 'La contraseÃ±a actual es requerida.' },
        });
      }
      const isMatch = await bcrypt.compare(password_actual, currentUser.password);
      if (!isMatch) {
        return res.status(400).json({
          ok: false,
          message: 'La contraseÃ±a actual es incorrecta.',
          errors: { password_actual: 'La contraseÃ±a actual no es correcta.' },
        });
      }
      if (nueva_password.length < 8) {
        return res.status(400).json({
          ok: false,
          message: 'La nueva contraseÃ±a debe tener al menos 8 caracteres.',
          errors: { nueva_password: 'La nueva contraseÃ±a debe tener al menos 8 caracteres.' },
        });
      }
      const salt = await bcrypt.genSalt(10);
      hashedNewPassword = await bcrypt.hash(nueva_password, salt);
    }

    // Verificar email Ãºnico (excluyendo el propio)
    if (email) {
      const correo = String(email).trim().toLowerCase();
      const [existingEmail] = await pool.query(
        'SELECT id FROM usuarios WHERE LOWER(email) = ? AND id != ?',
        [correo, userId]
      );
      if (existingEmail.length > 0) {
        return res.status(409).json({
          ok: false,
          message: 'El correo electrÃ³nico ya estÃ¡ en uso.',
          errors: { email: 'El correo electrÃ³nico ya estÃ¡ en uso por otro usuario.' },
        });
      }
    }

    // Verificar documento Ãºnico (excluyendo el propio)
    if (numero_documento) {
      const [existingDoc] = await pool.query(
        'SELECT id FROM usuarios WHERE numero_documento = ? AND id != ?',
        [numero_documento, userId]
      );
      if (existingDoc.length > 0) {
        return res.status(409).json({
          ok: false,
          message: 'El nÃºmero de documento ya estÃ¡ registrado.',
          errors: { numero_documento: 'El documento ya estÃ¡ en uso por otro usuario.' },
        });
      }
    }

    // Construir campos a actualizar
    const fields = [];
    const values = [];
    if (nombre !== undefined) { fields.push('nombre = ?'); values.push(String(nombre).trim()); }
    if (apellido !== undefined) { fields.push('apellido = ?'); values.push(String(apellido).trim()); }
    if (tipo_documento !== undefined) { fields.push('tipo_documento = ?'); values.push(tipo_documento); }
    if (numero_documento !== undefined) { fields.push('numero_documento = ?'); values.push(String(numero_documento).trim()); }
    if (direccion !== undefined) { fields.push('direccion = ?'); values.push(String(direccion).trim()); }
    if (telefono !== undefined) { fields.push('telefono = ?'); values.push(String(telefono).trim()); }
    if (email !== undefined) { fields.push('email = ?'); values.push(String(email).trim().toLowerCase()); }
    if (hashedNewPassword) { fields.push('password = ?'); values.push(hashedNewPassword); }

    if (fields.length === 0) {
      return res.status(400).json({ ok: false, message: 'No hay campos para actualizar.' });
    }

    values.push(userId);
    await pool.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.tipo_documento, u.numero_documento, u.direccion,
              u.telefono, u.email, u.rol_id, r.nombre as rol_nombre, u.estado
       FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
      [userId]
    );

    return res.status(200).json({
      ok: true,
      message: 'Perfil actualizado exitosamente.',
      user: updated[0],
    });
  } catch (error) {
    console.error('Error en updateProfile:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno del servidor.',
    });
  }
};

