import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { testConnection } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import productosRoutes from './routes/productosRoutes.js';
import serviciosRoutes from './routes/serviciosRoutes.js';
import pedidosRoutes from './routes/pedidosRoutes.js';
import citasRoutes from './routes/citasRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_NAME = process.env.DB_NAME || 'mitienda_db';

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'API MiTienda funcionando correctamente.',
    author: 'Jonathan Martinez',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/citas', citasRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    ok: false,
    message: err.message || 'Error interno del servidor.',
  });
});

const startServer = async () => {
  try {
    const ok = await testConnection();
    if (!ok) {
      console.error('❌ No se pudo establecer conexión con MySQL. Verifica credenciales en .env y que el servidor MySQL esté iniciado.');
      process.exit(1);
    }
    app.listen(PORT, () => {
      console.log('========================================');
      console.log('🚀 Servidor Backend - MiTienda');
      console.log(`📌 Autor: Jonathan Martinez`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`✅ Puerto: ${PORT}`);
      console.log(`🗄️ Base de datos: MySQL (${DB_NAME})`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message || error);
    process.exit(1);
  }
};

startServer();

export default app;
