// backend/src/controllers/ticketController.js
import { generarTicket } from '../services/ticketService.js';

export const generarTicketCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await generarTicket(id, 'cliente');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(ticket);
  } catch (error) {
    console.error('❌ Error al generar ticket cliente:', error);
    res.status(500).json({ mensaje: error.message || 'Error al generar ticket' });
  }
};

export const generarTicketCocina = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await generarTicket(id, 'cocina');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(ticket);
  } catch (error) {
    console.error('❌ Error al generar ticket cocina:', error);
    res.status(500).json({ mensaje: error.message || 'Error al generar ticket' });
  }
};
