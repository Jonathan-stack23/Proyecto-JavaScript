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

const hash = (pass) => bcrypt.hash(pass, 10);

const ADMIN = {
  nombre: 'Administrador',
  apellido: 'MiTienda',
  tipo_documento: 'CC',
  numero_documento: '1000000001',
  direccion: 'Sede Principal',
  telefono: '3000000001',
  email: 'admin@mitienda.com',
  password: 'Admin1234',
  rol_id: 1,
};

const EMPLEADO = {
  nombre: 'Empleado',
  apellido: 'MiTienda',
  tipo_documento: 'CC',
  numero_documento: '1000000002',
  direccion: 'Sede Principal',
  telefono: '3000000002',
  email: 'empleado@mitienda.com',
  password: 'Empleado1234',
  rol_id: 2,
};

const EMPLEADOS_SERVICIO = [
  { nombre: 'Carlos', apellido: 'Gómez', tipo_documento: 'CC', numero_documento: '1000000010', direccion: 'Calle 45 #12-34', telefono: '3001110001', email: 'carlos.g@mitienda.com', password: 'Empleado1234', rol_id: 2 },
  { nombre: 'Laura', apellido: 'Ramírez', tipo_documento: 'CC', numero_documento: '1000000020', direccion: 'Carrera 10 #20-40', telefono: '3001110002', email: 'laura.r@mitienda.com', password: 'Empleado1234', rol_id: 2 },
  { nombre: 'Andrés', apellido: 'Torres', tipo_documento: 'CC', numero_documento: '1000000030', direccion: 'Avenida 5 #8-15', telefono: '3001110003', email: 'andres.t@mitienda.com', password: 'Empleado1234', rol_id: 2 },
  { nombre: 'Sofía', apellido: 'Hernández', tipo_documento: 'CC', numero_documento: '1000000040', direccion: 'Calle 20 #5-60', telefono: '3001110004', email: 'sofia.h@mitienda.com', password: 'Empleado1234', rol_id: 2 },
];

const PRODUCTOS = [
  { id: 1, nombre: 'Laptop HP Pavilion', descripcion: 'Laptop HP Pavilion 15" 8GB RAM 256GB SSD', precio: 3599000.0, stock: 15, categoria: 'Computadores', imagen_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', estado: 'activo' },
  { id: 2, nombre: 'Smartphone Samsung', descripcion: 'Samsung Galaxy A54 128GB 6GB RAM', precio: 1899000.0, stock: 25, categoria: 'Celulares', imagen_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80', estado: 'activo' },
  { id: 3, nombre: 'Auriculares Inalámbricos', descripcion: 'Auriculares Bluetooth Noise Cancelling', precio: 299000.0, stock: 50, categoria: 'Accesorios', imagen_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', estado: 'activo' },
  { id: 4, nombre: 'Monitor LG 27"', descripcion: 'Monitor LG 27 pulgadas Full HD IPS', precio: 899000.0, stock: 20, categoria: 'Monitores', imagen_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80', estado: 'activo' },
  { id: 5, nombre: 'Teclado Mecánico', descripcion: 'Teclado mecánico RGB gamer', precio: 459000.0, stock: 30, categoria: 'Accesorios', imagen_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', estado: 'activo' },
  { id: 6, nombre: 'Mouse Gamer', descripcion: 'Mouse gamer RGB 16000 DPI', precio: 249000.0, stock: 40, categoria: 'Accesorios', imagen_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', estado: 'activo' },
];

const SERVICIOS = [
  { id: 1, nombre: 'Mantenimiento de PC', descripcion: 'Limpieza y optimización integral de computadores', precio: 80000.0, duracion: '2 horas', categoria: 'Mantenimiento', imagen_url: 'https://images.unsplash.com/photo-1587202372722-05829e788842?auto=format&fit=crop&w=800&q=80', estado: 'activo', empleado_idx: 0 },
  { id: 2, nombre: 'Instalación de Software', descripcion: 'Instalación y configuración de suites y sistemas operativos', precio: 50000.0, duracion: '1 hora', categoria: 'Soporte', imagen_url: 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&w=800&q=80', estado: 'activo', empleado_idx: 1 },
  { id: 3, nombre: 'Reparación de Celulares', descripcion: 'Diagnóstico, cambio de repuestos y reparación técnica', precio: 100000.0, duracion: '3 días', categoria: 'Reparación', imagen_url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80', estado: 'activo', empleado_idx: 2 },
  { id: 4, nombre: 'Asesoría Técnica', descripcion: 'Asesoría personalizada para optimización tecnológica', precio: 60000.0, duracion: '1 hora', categoria: 'Consultoría', imagen_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80', estado: 'activo', empleado_idx: 3 },
];

const upsertUsuario = async (conn, data) => {
  const [rows] = await conn.query('SELECT id FROM usuarios WHERE email = ? OR numero_documento = ?', [data.email, data.numero_documento]);
  const hashedPassword = await hash(data.password);

  if (rows.length > 0) {
    const id = rows[0].id;
    await conn.query(
      `UPDATE usuarios SET nombre=?, apellido=?, tipo_documento=?, numero_documento=?, direccion=?, telefono=?, password=?, rol_id=?, estado='activo' WHERE id=?`,
      [data.nombre, data.apellido, data.tipo_documento, data.numero_documento, data.direccion, data.telefono, hashedPassword, data.rol_id, id]
    );
    console.log(`   🔄  Actualizado: ${data.email}`);
    return id;
  }

  const [res] = await conn.query(
    `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
    [data.nombre, data.apellido, data.tipo_documento, data.numero_documento, data.direccion, data.telefono, data.email, hashedPassword, data.rol_id]
  );
  console.log(`   ✅  Creado: ${data.email} (id=${res.insertId})`);
  return res.insertId;
};

const upsertProducto = async (conn, data, adminId) => {
  const [rows] = await conn.query('SELECT id FROM productos WHERE id = ?', [data.id]);
  if (rows.length > 0) {
    await conn.query(
      `UPDATE productos SET nombre=?, descripcion=?, precio=?, stock=?, categoria=?, imagen_url=?, estado=?, usuario_id=? WHERE id=?`,
      [data.nombre, data.descripcion, data.precio, data.stock, data.categoria, data.imagen_url, data.estado, adminId, data.id]
    );
    console.log(`   🔄  Actualizado producto: ${data.nombre}`);
    return data.id;
  }
  await conn.query(
    `INSERT INTO productos (id, nombre, descripcion, precio, stock, categoria, imagen_url, estado, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.id, data.nombre, data.descripcion, data.precio, data.stock, data.categoria, data.imagen_url, data.estado, adminId]
  );
  console.log(`   ✅  Creado producto: ${data.nombre}`);
  return data.id;
};

const upsertServicio = async (conn, data, usuarioId) => {
  const [rows] = await conn.query('SELECT id FROM servicios WHERE id = ?', [data.id]);
  if (rows.length > 0) {
    await conn.query(
      `UPDATE servicios SET nombre=?, descripcion=?, precio=?, duracion=?, categoria=?, imagen_url=?, estado=?, usuario_id=? WHERE id=?`,
      [data.nombre, data.descripcion, data.precio, data.duracion, data.categoria, data.imagen_url, data.estado, usuarioId, data.id]
    );
    console.log(`   🔄  Actualizado servicio: ${data.nombre} (asignado a empleado #${usuarioId})`);
    return data.id;
  }
  await conn.query(
    `INSERT INTO servicios (id, nombre, descripcion, precio, duracion, categoria, imagen_url, estado, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.id, data.nombre, data.descripcion, data.precio, data.duracion, data.categoria, data.imagen_url, data.estado, usuarioId]
  );
  console.log(`   ✅  Creado servicio: ${data.nombre} (asignado a empleado #${usuarioId})`);
  return data.id;
};

const main = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('🔌  Conectado a la base de datos:', DB_NAME);
    console.log('');

    console.log('=============================================================');
    console.log('[SEED NODE] POBLANDO DATOS INICIALES - MITIENDA');
    console.log('=============================================================');
    console.log('');

    console.log('1️⃣  Usuarios principales...');
    const adminId = await upsertUsuario(conn, ADMIN);
    console.log('       Credenciales: admin@mitienda.com / Admin1234');
    const _empleadoId = await upsertUsuario(conn, EMPLEADO);
    console.log('       Credenciales: empleado@mitienda.com / Empleado1234');
    console.log('');

    console.log('2️⃣  Empleados especializados (4)...');
    const empIds = [];
    for (const emp of EMPLEADOS_SERVICIO) {
      const id = await upsertUsuario(conn, emp);
      empIds.push(id);
    }
    console.log('       Todos usan contraseña: Empleado1234');
    console.log('');

    console.log('3️⃣  Productos demo (6)...');
    for (const p of PRODUCTOS) {
      await upsertProducto(conn, p, adminId);
    }
    console.log('');

    console.log('4️⃣  Servicios demo (4) con empleados asignados...');
    for (const s of SERVICIOS) {
      const uid = empIds[s.empleado_idx] || adminId;
      await upsertServicio(conn, s, uid);
    }
    console.log('');

    console.log('=============================================================');
    console.log('📊  RESUMEN FINAL:');
    console.log('=============================================================');
    const tablas = ['roles', 'permisos', 'rol_permisos', 'usuarios', 'productos', 'servicios'];
    for (const t of tablas) {
      const [r] = await conn.query(`SELECT COUNT(*) AS c FROM ${t}`);
      console.log(`   ${t.padEnd(15)} ${r[0].c} registros`);
    }
    console.log('');
    console.log('✅  SEED COMPLETADO EXITOSAMENTE');
    console.log('');
    console.log('Credenciales de prueba:');
    console.log('   🟥  Administrador : admin@mitienda.com    / Admin1234');
    console.log('   🟨  Empleado      : empleado@mitienda.com / Empleado1234');
    console.log('   🟩  Clientes      : Regístrate desde el frontend');

  } catch (error) {
    console.error('❌  Error:', error.message);
    process.exitCode = 1;
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
};

main();
