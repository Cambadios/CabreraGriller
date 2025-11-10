// backend/src/routes/pedidoRoutes.js
import { Router } from 'express';
import {
  listarPedidos,
  obtenerPedido,
  crearPedidoHandler
} from '../controllers/pedidoController.js';

const router = Router();

// Pedidos
router.get('/', listarPedidos);
router.get('/:id', obtenerPedido);
router.post('/', crearPedidoHandler);

export default router;
