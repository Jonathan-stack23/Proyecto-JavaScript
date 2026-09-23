import { Router } from 'express';
import {
  register,
  login,
  recoverPassword,
  recoverSendCode,
  recoverVerifyCode,
  recoverResetPassword,
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
router.post('/recover/send-code', recoverSendCode);
router.post('/recover/verify-code', recoverVerifyCode);
router.post('/recover/reset-password', recoverResetPassword);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

export default router;
