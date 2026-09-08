import { Router } from 'express';
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  toggleEstadoProducto,
  deleteProducto,
} from '../controllers/productosController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', getProductos);
router.get('/:id', getProductoById);

router.use(authenticateToken);

router.post('/', authorizeRoles('Administrador', 'Empleado'), createProducto);
router.put('/:id', authorizeRoles('Administrador', 'Empleado'), updateProducto);
router.patch('/:id/estado', authorizeRoles('Administrador', 'Empleado'), toggleEstadoProducto);
router.delete('/:id', authorizeRoles('Administrador', 'Empleado'), deleteProducto);

export default router;
