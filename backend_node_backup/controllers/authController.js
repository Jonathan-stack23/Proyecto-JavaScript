import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import pool from '../config/db.js';

const generarCodigo = () => Math.floor(100000 + Math.random() * 900000).toString();

const crearTransporterSmtp = () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  if (!smtpUser || !smtpPass) return null;
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
};

const enviarCorreoRecuperacion = async (destinatario, codigo, nombre) => {
  const transporter = crearTransporterSmtp();
  const remitente = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@mitienda.com';
  const asunto = process.env.SMTP_SUBJECT || 'Código de recuperación - MiTienda';

  const cuerpoHtml = `
  <html>
    <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px;">
        <h2 style="color: #6d28d9; margin-top: 0;">Hola ${nombre || 'usuario'} 👋</h2>
        <p style="color: #374151;">Recibimos una solicitud para recuperar tu contraseña de MiTienda.</p>
        <p style="color: #374151;">Utiliza el siguiente código de verificación:</p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="display: inline-block; padding: 14px 32px; font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #ffffff; background: linear-gradient(90deg, #6d28d9, #a855f7); border-radius: 10px;">
            ${codigo}
          </span>
        </div>
        <p style="color: #374151;">Este código es válido por <strong>15 minutos</strong> y solo puede usarse una vez.</p>
        <p style="color: #9ca3af; font-size: 12px;">Si no solicitaste este cambio, ignora este correo.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px; text-align: center;">© 2026 MiTienda - Tecnología y más</p>
      </div>
    </body>
  </html>`;

  const cuerpoTexto =
    `Hola ${nombre || 'usuario'}!\n\n` +
    `Tu código de recuperación para MiTienda es: ${codigo}\n` +
    `Válido por 15 minutos.\n\n` +
    `Si no solicitaste este cambio, ignora este correo.`;

  let enviado = false;
  let modoDesarrollo = false;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: remitente,
        to: destinatario,
        subject: asunto,
        text: cuerpoTexto,
        html: cuerpoHtml,
      });
      enviado = true;
      console.log(`[EMAIL] Código de recuperación enviado a ${destinatario}.`);
    } catch (e) {
      console.warn(`[EMAIL] Falló el envío SMTP a ${destinatario}:`, e.message);
      enviado = false;
      modoDesarrollo = true;
    }
  } else {
    modoDesarrollo = true;
  }

  if (modoDesarrollo || !enviado) {
    console.log('='.repeat(60));
    console.log(`[MODO DESARROLLO] Código de recuperación para ${destinatario} (${nombre}):`);
    console.log(`         CÓDIGO =>  ${codigo}  (válido 15 min)`);
    console.log('='.repeat(60));
    enviado = true;
    modoDesarrollo = true;
  }

  return { enviado, modoDesarrollo };
};

const validarCodigoActivo = async (email, codigo) => {
  const correo = String(email).trim().toLowerCase();
  const [rows] = await pool.query(
    `SELECT * FROM codigos_recuperacion
     WHERE LOWER(email) = ? AND codigo = ? AND usado = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [correo, String(codigo).trim()]
  );
  if (rows.length === 0) {
    const error = new Error('Código inválido. Verifica e intenta nuevamente.');
    error.statusCode = 400;
    throw error;
  }
  const registro = rows[0];
  const ahora = new Date();
  const expira = new Date(registro.expira_en);
  if (expira < ahora) {
    const error = new Error('El código ha expirado. Solicita uno nuevo.');
    error.statusCode = 400;
    throw error;
  }
  return registro;
};

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
      message: '¡Tu contraseña ha sido actualizada! Ya puedes iniciar sesión con tu nueva contraseña.',
    });
  } catch (error) {
    console.error('Error en recuperación:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno del servidor al actualizar contraseÃ±a.',
    });
  }
};

export const recoverSendCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ ok: false, message: 'El correo es obligatorio.' });
    }
    const correo = String(email).trim().toLowerCase();
    const codigo = generarCodigo();
    const expiraEn = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      `INSERT INTO codigos_recuperacion (email, codigo, expira_en, usado) VALUES (?, ?, ?, FALSE)`,
      [correo, codigo, expiraEn]
    );

    const [userRows] = await pool.query('SELECT nombre FROM usuarios WHERE LOWER(email) = ?', [correo]);
    const nombreUsuario = userRows.length > 0 ? userRows[0].nombre : 'usuario';

    const { enviado } = await enviarCorreoRecuperacion(correo, codigo, nombreUsuario);

    const emailMasked = userRows.length > 0
      ? correo[0] + '***' + correo.split('@')[0].slice(-1) + '@' + correo.split('@').slice(-1)[0]
      : null;

    return res.status(200).json({
      ok: enviado,
      message: enviado
        ? 'Si el correo está registrado, recibirás un código de verificación en breve. Revisa tu bandeja de entrada (y carpeta de spam).'
        : 'No pudimos enviar el correo en este momento. Por favor intenta de nuevo más tarde.',
      email_masked: emailMasked,
    });
  } catch (error) {
    console.error('Error en recoverSendCode:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor al enviar el código.' });
  }
};

export const recoverVerifyCode = async (req, res) => {
  try {
    const { email, codigo } = req.body;
    await validarCodigoActivo(email, codigo);
    return res.status(200).json({
      ok: true,
      message: 'Código verificado correctamente. Ahora puedes establecer tu nueva contraseña.',
    });
  } catch (error) {
    console.error('Error en recoverVerifyCode:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ ok: false, message: error.message || 'Error al verificar el código.' });
  }
};

export const recoverResetPassword = async (req, res) => {
  try {
    const { email, codigo, newPassword } = req.body;
    const correo = String(email).trim().toLowerCase();

    if (!newPassword) {
      return res.status(400).json({ ok: false, message: 'La nueva contraseña es obligatoria.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const [userRows] = await pool.query('SELECT id FROM usuarios WHERE LOWER(email) = ?', [correo]);
    if (userRows.length === 0) {
      return res.status(404).json({ ok: false, message: 'No se encontró ningún usuario con ese correo electrónico.' });
    }

    const registro = await validarCodigoActivo(correo, codigo);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE codigos_recuperacion SET usado = TRUE WHERE id = ?', [registro.id]);
    await pool.query('UPDATE usuarios SET password = ? WHERE LOWER(email) = ?', [hashedPassword, correo]);

    return res.status(200).json({
      ok: true,
      message: '¡Tu contraseña ha sido actualizada! Ya puedes iniciar sesión con tu nueva contraseña.',
    });
  } catch (error) {
    console.error('Error en recoverResetPassword:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ ok: false, message: error.message || 'Error al actualizar la contraseña.' });
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

