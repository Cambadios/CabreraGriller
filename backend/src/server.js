// src/server.js
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import morgan from 'morgan';

import path from 'path';
import { fileURLToPath } from 'url';

import { pingDB } from './db/db.js';

import platoRoutes from './routes/platoRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import pedidoRoutes from './routes/pedidoRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import reporteRoutes from './routes/reporteRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { verificarToken } from './middlewares/authMiddleware.js';

import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Para poder resolver rutas absolutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// 📂 Servir archivos estáticos de imágenes (subidas)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
// Ojo: esto asume que tu carpeta "uploads" está en la raíz del proyecto, al mismo nivel que "src"

// Variables globales
const PORT = process.env.PORT || 3000;

// ENDPOINT health check
app.get('/health', async (_req, res, next) => {
  try {
    const dbOk = await pingDB();
    res.status(200).json({
      status: 'OK',
      db: dbOk ? 'reachable' : 'down',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (err) {
    next(err);
  }
});

// Rutas MVC
app.use('/api/auth', authRoutes);

// Todas estas rutas requieren token
app.use('/api/platos', verificarToken, platoRoutes);
app.use('/api/clientes', verificarToken, clienteRoutes);
app.use('/api/pedidos', verificarToken, pedidoRoutes);
app.use('/api/tickets', verificarToken, ticketRoutes);
app.use('/api/usuarios', verificarToken, usuarioRoutes);
app.use('/api/reportes', verificarToken, reporteRoutes);

// 404 básico
app.use((req, res) => {
  res
    .status(404)
    .json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Manejo de errores global
app.use(errorHandler);

// INICIO DEL SERVIDOR
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
