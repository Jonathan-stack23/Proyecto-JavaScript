import { Router } from 'express';
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  toggleEstadoUsuario,
  deleteUsuario,
  getRoles,
  checkEmailDisponible,
} from '../controllers/usuariosController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateCreateUsuario, validateUpdateUsuario } from '../middleware/validators.js';

const router = Router();

router.use(authenticateToken);

router.get('/check-email', authorizeRoles('Administrador', 'Empleado'), checkEmailDisponible);
router.get('/', authorizeRoles('Administrador'), getUsuarios);
router.get('/roles', authorizeRoles('Administrador', 'Empleado'), getRoles);
router.get('/:id', authorizeRoles('Administrador'), getUsuarioById);
router.post('/', authorizeRoles('Administrador'), validateCreateUsuario, createUsuario);
router.put('/:id', authorizeRoles('Administrador'), validateUpdateUsuario, updateUsuario);
router.patch('/:id/estado', authorizeRoles('Administrador'), toggleEstadoUsuario);
router.delete('/:id', authorizeRoles('Administrador'), deleteUsuario);

export default router;
