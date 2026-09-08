import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({
        ok: false,
        message: 'Acceso denegado. No se proporcionó token de autenticación.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.rol_id, u.estado, r.nombre as rol_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (rows.length === 0 || rows[0].estado !== 'activo') {
      return res.status(401).json({
        ok: false,
        message: 'Usuario no encontrado o inactivo.',
      });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        message: 'Token expirado. Inicia sesión nuevamente.',
      });
    }
    return res.status(403).json({
      ok: false,
      message: 'Token inválido.',
    });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: 'Autenticación requerida.',
      });
    }

    const userRole = req.user.rol_nombre;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        ok: false,
        message: `Acceso denegado. Se requiere rol de: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
};

export const optionalAuthenticateToken = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.rol_id, u.estado, r.nombre as rol_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (rows.length > 0 && rows[0].estado === 'activo') {
      req.user = rows[0];
    }
    next();
  } catch (_e) {
    next();
  }
};
