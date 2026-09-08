import { Router } from 'express';
import {
  register,
  login,
  recoverPassword,
  getProfile,
  updateProfile,
  checkEmailDisponiblePublic,
} from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middleware/validators.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/check-email', checkEmailDisponiblePublic);
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/recover-password', recoverPassword);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

export default router;
