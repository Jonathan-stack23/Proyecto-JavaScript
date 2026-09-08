import { Router } from 'express';
import {
  createCita,
  getCitas,
  getMisCitas,
  updateEstadoCita,
} from '../controllers/citasController.js';
import { authenticateToken, authorizeRoles, optionalAuthenticateToken } from '../middleware/auth.js';

const router = Router();

// Agendar servicio (Público o cliente autenticado)
router.post('/', optionalAuthenticateToken, createCita);

// Citas del cliente autenticado
router.get('/mis-citas', authenticateToken, getMisCitas);

// Todas las citas (Admin y Empleado)
router.get('/', authenticateToken, authorizeRoles('Administrador', 'Empleado'), getCitas);

// Actualizar estado de cita (Admin y Empleado: 'en revision', 'revisado', 'hecho', 'cancelado')
router.patch('/:id/estado', authenticateToken, authorizeRoles('Administrador', 'Empleado'), updateEstadoCita);

export default router;
