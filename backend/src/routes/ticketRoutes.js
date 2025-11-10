// backend/src/routes/ticketRoutes.js
import { Router } from 'express';
import { generarTicketCliente, generarTicketCocina } from '../controllers/ticketController.js';

const router = Router();

// Rutas para generar tickets
router.get('/:id/cliente', generarTicketCliente);
router.get('/:id/cocina', generarTicketCocina);

export default router;
