// backend/src/routes/clienteRoutes.js
import { Router } from 'express';
import {
  listarClientes,
  obtenerCliente,
  crearClienteHandler,
  actualizarClienteHandler,
  eliminarClienteHandler
} from '../controllers/clienteController.js';

const router = Router();

// CRUD Clientes
router.get('/', listarClientes);
router.get('/:id', obtenerCliente);
router.post('/', crearClienteHandler);
router.put('/:id', actualizarClienteHandler);
router.delete('/:id', eliminarClienteHandler);

export default router;
