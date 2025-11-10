// backend/src/routes/authRoutes.js
import { Router } from 'express';
import { login, registrar } from '../controllers/authController.js';

const router = Router();

// 🔹 Login
router.post('/login', login);

// 🔹 Registro (solo para pruebas)
router.post('/registro', registrar);

export default router;
