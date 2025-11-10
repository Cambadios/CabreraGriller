// backend/src/routes/reporteRoutes.js
import { Router } from 'express';
import { resumenDiaHandler } from '../controllers/reporteController.js';

const router = Router();

// GET /api/reportes/dia?fecha=YYYY-MM-DD
router.get('/dia', resumenDiaHandler);

export default router;
