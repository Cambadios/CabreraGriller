// backend/src/app.js
import express from 'express';
import cors from 'cors';
import platoRoutes from './routes/platoRoutes.js'; // 👈 importa las rutas de platos

const app = express();

app.use(cors());
app.use(express.json());

// 🔹 Montar las rutas
app.use('/api/platos', platoRoutes);

export default app;
