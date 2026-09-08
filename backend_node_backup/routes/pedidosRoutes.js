import { Router } from 'express';
import {
  createPedido,
  getPedidos,
  getMisPedidos,
  getPedidoById,
  updateEstadoPedido,
} from '../controllers/pedidosController.js';
import { authenticateToken, authorizeRoles, optionalAuthenticateToken } from '../middleware/auth.js';

const router = Router();

// Crear pedido (Público o cliente autenticado)
router.post('/', optionalAuthenticateToken, createPedido);

// Obtener pedidos del cliente autenticado
router.get('/mis-pedidos', authenticateToken, getMisPedidos);

// Obtener todos los pedidos (Admin y Empleado)
router.get('/', authenticateToken, authorizeRoles('Administrador', 'Empleado'), getPedidos);

// Obtener detalle de pedido por ID
router.get('/:id', authenticateToken, getPedidoById);

// Actualizar estado del pedido (Admin y Empleado: 'en revision', 'revisado', 'hecho', 'cancelado')
router.patch('/:id/estado', authenticateToken, authorizeRoles('Administrador', 'Empleado'), updateEstadoPedido);

export default router;
