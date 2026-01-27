import express from 'express';
import {
  listarPlatos,
  obtenerPlato,
  crearPlatoHandler,
  actualizarPlatoHandler,
  eliminarPlatoHandler,
} from '../controllers/platoController.js';

import uploadPlato from '../middlewares/uploadPlato.js';

const router = express.Router();

// GET /api/platos
router.get('/', listarPlatos);

// GET /api/platos/:id
router.get('/:id', obtenerPlato);

// POST /api/platos (imagen → Cloudinary)
router.post('/', uploadPlato.single('imagen'), crearPlatoHandler);

// PUT /api/platos/:id (imagen opcional → Cloudinary)
router.put('/:id', uploadPlato.single('imagen'), actualizarPlatoHandler);

// DELETE /api/platos/:id
router.delete('/:id', eliminarPlatoHandler);

export default router;