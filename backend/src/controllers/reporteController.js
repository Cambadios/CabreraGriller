// backend/src/controllers/reporteController.js
import { getResumenDia, getPlatosMasVendidosDia } from '../models/reporteModel.js';

export const resumenDiaHandler = async (req, res) => {
  try {
    // Si no mandan fecha → usamos la de hoy (formato YYYY-MM-DD)
    const hoy = new Date();
    const defaultFecha = hoy.toISOString().substring(0, 10); // '2025-11-10'
    const fecha = req.query.fecha || defaultFecha;

    const resumen = await getResumenDia(fecha);
    const platos = await getPlatosMasVendidosDia(fecha);

    res.status(200).json({
      fecha,
      resumen,
      platos
    });
  } catch (error) {
    console.error('❌ Error al obtener resumen del día:', error);
    res.status(500).json({ mensaje: 'Error al obtener el resumen diario' });
  }
};
