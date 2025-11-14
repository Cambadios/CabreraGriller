// backend/src/routes/platoRoutes.js
import express from 'express';
import multer from 'multer';
import {
  listarPlatos,
  obtenerPlato,
  crearPlatoHandler,
  actualizarPlatoHandler,
  eliminarPlatoHandler,
} from '../controllers/platoController.js';

const router = express.Router();

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: 'uploads/platos', // carpeta donde se guardan las imágenes
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    const nombreArchivo = `plato_${Date.now()}.${ext}`;
    cb(null, nombreArchivo);
  },
});

const upload = multer({ storage });

// GET /api/platos
router.get('/', listarPlatos);

// GET /api/platos/:id
router.get('/:id', obtenerPlato);

// POST /api/platos  (con imagen opcional)
router.post('/', upload.single('imagen'), crearPlatoHandler);

// PUT /api/platos/:id (con posible nueva imagen)
router.put('/:id', upload.single('imagen'), actualizarPlatoHandler);

// DELETE /api/platos/:id
router.delete('/:id', eliminarPlatoHandler);

export default router;
