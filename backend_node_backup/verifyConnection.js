import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mitienda_db',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

console.log('========================================================');
console.log('🔌  PRUEBA DE CONEXIÓN: BACKEND NODE.JS + EXPRESS');
console.log('========================================================');
console.log();

let conn;
try {
  conn = await pool.getConnection();
  console.log('✅  Conexión exitosa a MySQL');
  console.log();

  const [now] = await conn.query('SELECT NOW() AS fecha_hora');
  console.log(`🕒  Fecha/hora del servidor: ${now[0].fecha_hora}`);

  const [version] = await conn.query('SELECT VERSION() AS v');
  console.log(`🗄️  Motor: MySQL/MariaDB ${version[0].v}`);
  console.log();

  console.log('📋  Verificación de tablas y datos:');
  const checks = [
    ['roles', 'SELECT COUNT(*) FROM roles'],
    ['permisos', 'SELECT COUNT(*) FROM permisos'],
    ['rol_permisos', 'SELECT COUNT(*) FROM rol_permisos'],
    ['usuarios', 'SELECT COUNT(*) FROM usuarios'],
    ['productos', 'SELECT COUNT(*) FROM productos'],
    ['servicios', 'SELECT COUNT(*) FROM servicios'],
    ['codigos_recuperacion', 'SELECT COUNT(*) FROM codigos_recuperacion'],
  ];

  for (const [tabla, sql] of checks) {
    const [r] = await conn.query(sql);
    const cnt = Object.values(r[0])[0];
    const estado = cnt > 0 ? '✅' : '⚠️ ';
    console.log(`   ${estado} ${tabla.padEnd(22)} ${cnt} registros`);
  }
  console.log();

  console.log('🔐  Verificación de credenciales admin (hash):');
  const [adm] = await conn.query("SELECT id, email, rol_id, LEFT(password, 20) AS pass_preview FROM usuarios WHERE email = 'admin@mitienda.com'");
  if (adm.length > 0) {
    console.log(`   ✅  admin@mitienda.com encontrado (id=${adm[0].id}, rol_id=${adm[0].rol_id})`);
    console.log(`       Hash bcrypt: ${adm[0].pass_preview}...`);
  } else {
    console.log('   ❌  Admin NO encontrado');
  }
  console.log();

  console.log('🛍️  Productos disponibles:');
  const [prods] = await conn.query('SELECT id, nombre, precio, stock FROM productos ORDER BY id');
  for (const p of prods) {
    const precio = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(p.precio));
    console.log(`   [${p.id}] ${p.nombre.padEnd(28)} ${precio.padStart(14)} | Stock: ${p.stock}`);
  }
  console.log();

  console.log('🔧  Servicios disponibles (con empleado asignado):');
  const [servs] = await conn.query(`
    SELECT s.id, s.nombre, s.precio, s.duracion,
           CONCAT(u.nombre, ' ', u.apellido) AS empleado
    FROM servicios s
    LEFT JOIN usuarios u ON u.id = s.usuario_id
    ORDER BY s.id
  `);
  for (const s of servs) {
    const precio = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(s.precio));
    console.log(`   [${s.id}] ${s.nombre.padEnd(26)} ${precio.padStart(14)} | ${s.duracion.padEnd(10)} | ${s.empleado || 'Sin asignar'}`);
  }
  console.log();

  console.log('🎉  BACKEND NODE.JS: CONEXIÓN 100% FUNCIONAL');
  console.log('   Puedes arrancar con: npm run dev   (puerto 3000)');

} catch (e) {
  console.error('❌  ERROR DE CONEXIÓN:', e.message);
  process.exitCode = 1;
} finally {
  if (conn) conn.release();
  await pool.end();
}
