import { Router } from 'express';
import {
  getServicios,
  getServicioById,
  createServicio,
  updateServicio,
  toggleEstadoServicio,
  deleteServicio,
} from '../controllers/serviciosController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', getServicios);
router.get('/:id', getServicioById);

router.use(authenticateToken);

router.post('/', authorizeRoles('Administrador', 'Empleado'), createServicio);
router.put('/:id', authorizeRoles('Administrador', 'Empleado'), updateServicio);
router.patch('/:id/estado', authorizeRoles('Administrador', 'Empleado'), toggleEstadoServicio);
router.delete('/:id', authorizeRoles('Administrador', 'Empleado'), deleteServicio);

export default router;
