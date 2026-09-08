import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'mitienda_db';

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

const ADMIN_DATA = {
  nombre: 'Administrador',
  apellido: 'MiTienda',
  tipoDocumento: 'CC',
  numeroDocumento: '1000000001',
  direccion: 'Sede Principal',
  telefono: '3000000001',
  email: 'admin@mitienda.com',
  password: 'Admin1234',
  rolId: 1,
};

const EMPLEADO_DATA = {
  nombre: 'Empleado',
  apellido: 'MiTienda',
  tipoDocumento: 'CC',
  numeroDocumento: '1000000002',
  direccion: 'Sede Principal',
  telefono: '3000000002',
  email: 'empleado@mitienda.com',
  password: 'Empleado1234',
  rolId: 2,
};

const upsertUsuario = async (conn, data) => {
  const [rows] = await conn.query('SELECT id FROM usuarios WHERE email = ?', [data.email]);
  const hashedPassword = await bcrypt.hash(data.password, 10);

  if (rows.length > 0) {
    const id = rows[0].id;
    await conn.query(
      `UPDATE usuarios SET
        nombre = ?, apellido = ?, tipo_documento = ?, numero_documento = ?,
        direccion = ?, telefono = ?, password = ?, rol_id = ?, estado = 'activo'
       WHERE id = ?`,
      [
        data.nombre, data.apellido, data.tipoDocumento, data.numeroDocumento,
        data.direccion, data.telefono, hashedPassword, data.rolId, id,
      ]
    );
    console.log(`🔄  Actualizado: ${data.email} (id=${id})`);
    return 'updated';
  }

  const [result] = await conn.query(
    `INSERT INTO usuarios
      (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
    [
      data.nombre, data.apellido, data.tipoDocumento, data.numeroDocumento,
      data.direccion, data.telefono, data.email, hashedPassword, data.rolId,
    ]
  );
  console.log(`✅  Creado: ${data.email} (id=${result.insertId})`);
  return 'created';
};

const main = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('🔌  Conectado a la base de datos:', DB_NAME);
    console.log('');

    console.log('👤  Procesando usuario ADMINISTRADOR:');
    const resAdmin = await upsertUsuario(conn, ADMIN_DATA);
    console.log(`    Credenciales: admin@mitienda.com / Admin1234`);
    console.log('');

    console.log('👤  Procesando usuario EMPLEADO:');
    const resEmp = await upsertUsuario(conn, EMPLEADO_DATA);
    console.log(`    Credenciales: empleado@mitienda.com / Empleado1234`);
    console.log('');

    console.log('✨  Operación completada exitosamente.');
    console.log('');
    console.log('Resumen:');
    console.log(`   Administrador -> ${resAdmin === 'created' ? 'CREADO' : 'ACTUALIZADO'}`);
    console.log(`   Empleado      -> ${resEmp === 'created' ? 'CREADO' : 'ACTUALIZADO'}`);
  } catch (error) {
    console.error('❌  Error:', error.message);
    process.exitCode = 1;
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
};

main();
