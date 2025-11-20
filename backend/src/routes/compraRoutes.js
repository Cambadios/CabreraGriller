// backend/src/routes/compraRoutes.js
import { Router } from 'express';
import {
  crearCompraHandler,
  listarComprasPorFechaHandler,
} from '../controllers/compraController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Registrar nueva compra
router.post('/', verificarToken, crearCompraHandler);

// Listar compras por fecha (?fecha=YYYY-MM-DD)
router.get('/', verificarToken, listarComprasPorFechaHandler);

export default router;
