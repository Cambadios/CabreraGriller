// backend/src/routes/usuarioRoutes.js
import { Router } from 'express';
import {
  listarUsuarios,
  obtenerUsuario,
  crearUsuarioHandler,
  actualizarUsuarioHandler,
  eliminarUsuarioHandler
} from '../controllers/usuarioController.js';

const router = Router();

// CRUD Usuarios
router.get('/', listarUsuarios);
router.get('/:id', obtenerUsuario);
router.post('/', crearUsuarioHandler);
router.put('/:id', actualizarUsuarioHandler);
router.delete('/:id', eliminarUsuarioHandler);

export default router;
