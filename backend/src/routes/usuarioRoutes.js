// backend/src/routes/usuarioRoutes.js
import { Router } from 'express';
import {
  listarUsuarios,
  obtenerUsuario,
  crearUsuarioHandler,
  actualizarUsuarioHandler,
  eliminarUsuarioHandler
} from '../controllers/usuarioController.js';
// Si ya tienes middleware de auth, lo puedes usar aquí
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// ✅ Si quieres proteger todas las rutas de usuarios con login:
router.use(verificarToken);

// 📋 GET /api/usuarios
router.get('/', listarUsuarios);

// 🔎 GET /api/usuarios/:id
router.get('/:id', obtenerUsuario);

// ➕ POST /api/usuarios
router.post('/', crearUsuarioHandler);

// ✏️ PUT /api/usuarios/:id
router.put('/:id', actualizarUsuarioHandler);

// ❌ DELETE /api/usuarios/:id  (desactiva usuario)
router.delete('/:id', eliminarUsuarioHandler);

export default router;
