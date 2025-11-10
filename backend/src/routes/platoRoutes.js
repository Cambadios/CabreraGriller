// backend/src/routes/platoRoutes.js
import { Router } from 'express';
import {
  listarPlatos,
  obtenerPlato,
  crearPlatoHandler,
  actualizarPlatoHandler,
  eliminarPlatoHandler
} from '../controllers/platoController.js';

const router = Router();

// CRUD de platos
router.get('/', listarPlatos);          // GET todos los platos
router.get('/:id', obtenerPlato);       // GET un plato por ID
router.post('/', crearPlatoHandler);    // POST crear nuevo plato
router.put('/:id', actualizarPlatoHandler); // PUT actualizar plato
router.delete('/:id', eliminarPlatoHandler); // DELETE (desactivar) plato

export default router;
