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
});

const ROL_EMPLEADO = 2;

const EMPLEADOS = [
  {
    nombre: 'Carlos',
    apellido: 'Gómez',
    tipo_documento: 'CC',
    numero_documento: '1000000010',
    direccion: 'Calle 45 #12-34',
    telefono: '3001110001',
    email: 'carlos.g@mitienda.com',
    password: 'Empleado1234',
    servicioId: 1,
    servicioImagen: 'https://images.unsplash.com/photo-1587202372722-05829e788842?auto=format&fit=crop&w=800&q=80',
  },
  {
    nombre: 'Laura',
    apellido: 'Ramírez',
    tipo_documento: 'CC',
    numero_documento: '1000000020',
    direccion: 'Carrera 10 #20-40',
    telefono: '3001110002',
    email: 'laura.r@mitienda.com',
    password: 'Empleado1234',
    servicioId: 2,
    servicioImagen: 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&w=800&q=80',
  },
  {
    nombre: 'Andrés',
    apellido: 'Torres',
    tipo_documento: 'CC',
    numero_documento: '1000000030',
    direccion: 'Avenida 5 #8-15',
    telefono: '3001110003',
    email: 'andres.t@mitienda.com',
    password: 'Empleado1234',
    servicioId: 3,
    servicioImagen: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80',
  },
  {
    nombre: 'Sofía',
    apellido: 'Hernández',
    tipo_documento: 'CC',
    numero_documento: '1000000040',
    direccion: 'Calle 20 #5-60',
    telefono: '3001110004',
    email: 'sofia.h@mitienda.com',
    password: 'Empleado1234',
    servicioId: 4,
    servicioImagen: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
  },
];

const NOMBRES_SERVICIOS = {
  1: 'Mantenimiento de PC',
  2: 'Instalación de Software',
  3: 'Reparación de Celulares',
  4: 'Asesoría Técnica',
};

const insertarEmpleado = async (conn, emp) => {
  const [rows] = await conn.query('SELECT id FROM usuarios WHERE email = ? OR numero_documento = ?', [emp.email, emp.numero_documento]);
  let userId;

  if (rows.length > 0) {
    userId = rows[0].id;
    const hash = await bcrypt.hash(emp.password, 10);
    await conn.query(
      `UPDATE usuarios SET nombre=?, apellido=?, tipo_documento=?, numero_documento=?, direccion=?, telefono=?, password=?, rol_id=?, estado='activo' WHERE id=?`,
      [emp.nombre, emp.apellido, emp.tipo_documento, emp.numero_documento, emp.direccion, emp.telefono, hash, ROL_EMPLEADO, userId]
    );
    console.log(`🔄  Actualizado empleado: ${emp.email}`);
  } else {
    const hash = await bcrypt.hash(emp.password, 10);
    const [res] = await conn.query(
      `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
      [emp.nombre, emp.apellido, emp.tipo_documento, emp.numero_documento, emp.direccion, emp.telefono, emp.email, hash, ROL_EMPLEADO]
    );
    userId = res.insertId;
    console.log(`✅  Creado empleado: ${emp.email} (id=${userId})`);
  }

  await conn.query(
    `UPDATE servicios SET usuario_id = ?, imagen_url = ? WHERE id = ?`,
    [userId, emp.servicioImagen, emp.servicioId]
  );
  console.log(`    → Asignado a servicio: ${NOMBRES_SERVICIOS[emp.servicioId]}`);

  return userId;
};

const main = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('🔌  Conectado a:', DB_NAME);
    console.log('');

    for (const emp of EMPLEADOS) {
      await insertarEmpleado(conn, emp);
      console.log('');
    }

    console.log('✨  Finalizado. Todos los servicios tienen empleado asignado.');
    console.log('');
    console.log('Credenciales de empleados (todos usan la misma contraseña):');
    console.log('   Contraseña común: Empleado1234');
    EMPLEADOS.forEach((e) => {
      console.log(`   - ${e.email} → ${NOMBRES_SERVICIOS[e.servicioId]}`);
    });
  } catch (e) {
    console.error('❌  Error:', e.message);
    process.exitCode = 1;
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
};

main();
