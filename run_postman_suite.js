import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8000;
const HEALTH_URL = `http://127.0.0.1:${PORT}/api/health`;

function checkHealth() {
  return new Promise((resolve) => {
    http.get(HEALTH_URL, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function waitForServer(maxAttempts = 50, delayMs = 600) {
  for (let i = 0; i < maxAttempts; i++) {
    const isAlive = await checkHealth();
    if (isAlive) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function main() {
  console.log('================================================================');
  console.log(' 🚀 SUITE DE PRUEBAS Y VERIFICACIONES POSTMAN - MiTienda');
  console.log(' 🐍 Backend: FastAPI (Python) | SENA Ficha 3406204');
  console.log(' 👤 Autor: Jonathan Martinez');
  console.log('================================================================\n');

  let serverProcess = null;
  const alreadyRunning = await checkHealth();

  if (!alreadyRunning) {
    console.log('📡 Iniciando servidor FastAPI en segundo plano...');
    const pythonCmd = process.platform === 'win32'
      ? path.join(__dirname, 'Backend', 'venv', 'Scripts', 'python.exe')
      : 'python';

    serverProcess = spawn(pythonCmd, ['run.py'], {
      cwd: path.join(__dirname, 'Backend'),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    serverProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('Uvicorn running') || msg.includes('Servidor disponible')) {
        process.stdout.write(`   [FastAPI] ${msg.trim()}\n`);
      }
    });

    serverProcess.stderr.on('data', (d) => {
      const errStr = d.toString();
      if (!errStr.includes('WARNING')) {
        process.stderr.write(`   [FastAPI Log] ${errStr}`);
      }
    });

    const ready = await waitForServer();
    if (!ready) {
      console.error('❌ No se pudo inicializar el servidor FastAPI para las pruebas.');
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
    console.log(`✅ Servidor FastAPI respondiendo en http://127.0.0.1:${PORT}/api/health\n`);
  } else {
    console.log(`ℹ️  Servidor FastAPI ya está en ejecución en el puerto ${PORT}.\n`);
  }

  const collectionPath = path.join(__dirname, 'MiTienda_Postman_Collection.json');
  const environmentPath = path.join(__dirname, 'MiTienda_Postman_Environment.json');

  console.log('🧪 Ejecutando colección Postman con Newman...');
  console.log(`📁 Colección : ${collectionPath}`);
  console.log(`📁 Entorno   : ${environmentPath}\n`);

  const newmanCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const newman = spawn(newmanCmd, [
    '-y',
    'newman',
    'run',
    `"${collectionPath}"`,
    '-e',
    `"${environmentPath}"`,
    '--reporters',
    'cli',
    '--color',
    'on'
  ], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });

  newman.on('close', (code) => {
    console.log('\n================================================================');
    if (code === 0) {
      console.log('🎉 ✅ TODAS LAS VERIFICACIONES DE POSTMAN PASARON SATISFACTORIAMENTE');
    } else {
      console.log(`⚠️ Se detectaron fallos en las verificaciones (Código de salida: ${code})`);
    }
    console.log('================================================================\n');

    if (serverProcess) {
      console.log('🛑 Deteniendo servidor de pruebas...');
      serverProcess.kill('SIGTERM');
    }
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error('Error fatal ejecutando suite:', err);
  process.exit(1);
});
