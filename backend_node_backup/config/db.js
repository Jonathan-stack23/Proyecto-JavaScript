import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_NAME = process.env.DB_NAME || 'mitienda_db';

const rootPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const runSchemaFile = async (conn) => {
  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');
    sql = sql.replace(/^\uFEFF/, '').trim();
    await conn.query(sql);
    console.log('✅ Schema SQL ejecutado correctamente');
  } catch (e) {
    console.error('❌ Error ejecutando schema.sql:', e.message);
    throw e;
  }
};

const seedDefaultUsers = async (conn) => {
  try {
    const [rows] = await conn.query('SELECT COUNT(*) as total FROM usuarios WHERE rol_id IN (1,2)');
    if (rows[0].total > 0) {
      console.log('ℹ️  Usuarios admin/empleado ya existen — no se hace seed.');
      return;
    }
    const adminPass = await bcrypt.hash('Admin1234', 10);
    const empleadoPass = await bcrypt.hash('Empleado1234', 10);
    await conn.query(`
      INSERT IGNORE INTO usuarios
        (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado)
      VALUES
        ('Administrador', 'MiTienda', 'CC', '1000000001', 'Sede Principal', '3000000001', 'admin@mitienda.com', ?, 1, 'activo'),
        ('Empleado', 'MiTienda', 'CC', '1000000002', 'Sede Principal', '3000000002', 'empleado@mitienda.com', ?, 2, 'activo')
    `, [adminPass, empleadoPass]);
    console.log('✅ Seed completado:');
    console.log('   🟢  admin@mitienda.com / Admin1234 (Rol: Administrador)');
    console.log('   🟢  empleado@mitienda.com / Empleado1234 (Rol: Empleado)');
  } catch (e) {
    console.warn('⚠️  No se pudo ejecutar el seed de usuarios (puede que ya existan):', e.message);
  }
};

const ensureDatabaseAndSchema = async () => {
  let conn;
  try {
    conn = await rootPool.getConnection();
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Base de datos \`${DB_NAME}\` lista`);

    await conn.changeUser({ database: DB_NAME });
    await runSchemaFile(conn);
    await seedDefaultUsers(conn);
    conn.release();
    return true;
  } catch (e) {
    if (conn) conn.release();
    throw e;
  }
};

export const testConnection = async () => {
  try {
    await ensureDatabaseAndSchema();
    const c = await pool.getConnection();
    await c.ping();
    console.log('✅ Conexión a base de datos exitosa');
    c.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
};

export default pool;
