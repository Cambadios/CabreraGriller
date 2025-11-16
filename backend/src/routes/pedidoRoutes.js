// backend/src/routes/pedidoRoutes.js
import { Router } from 'express';
import {
  listarPedidos,
  listarPedidosHoy,
  obtenerPedido,
  crearPedidoHandler,
  actualizarPedidoHandler,
  pagarPedidoHandler,
} from '../controllers/pedidoController.js';

const router = Router();

// 📋 Pedidos
// GET /api/pedidos           → Todos o por ?fecha=YYYY-MM-DD
router.get('/', listarPedidos);

// GET /api/pedidos/hoy/lista → Solo pedidos del día actual
router.get('/hoy/lista', listarPedidosHoy);

// 🆕 Pagar pedido pendiente (debe ir antes de '/:id')
// POST /api/pedidos/:id/pagar
router.post('/:id/pagar', pagarPedidoHandler);

// PUT /api/pedidos/:id       → Agregar platos a un pedido PENDIENTE
router.put('/:id', actualizarPedidoHandler);

// GET /api/pedidos/:id       → Pedido con sus detalles
router.get('/:id', obtenerPedido);

// POST /api/pedidos          → Crear nuevo pedido
router.post('/', crearPedidoHandler);

export default router;
