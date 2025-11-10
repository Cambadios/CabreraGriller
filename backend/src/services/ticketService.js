// backend/src/services/ticketService.js
import { getPedidoById } from '../models/pedidoModel.js';

/**
 * Genera el ticket del cliente o cocina según tipo
 * @param {number} id_pedido
 * @param {'cliente'|'cocina'} tipo
 * @returns {string} ticket en formato texto
 */
export const generarTicket = async (id_pedido, tipo = 'cliente') => {
  const pedido = await getPedidoById(id_pedido);
  if (!pedido) throw new Error('Pedido no encontrado');

  const line = '---------------------------------------------';

  let ticket = '';
  ticket += tipo === 'cliente'
    ? '🧾 TICKET DE CLIENTE\n'
    : '👨‍🍳 ORDEN DE COCINA\n';
  ticket += line + '\n';
  ticket += `Fecha: ${pedido.fecha_hora}\n`;
  ticket += `Pedido #: ${pedido.id_pedido}\n`;
  if (pedido.cliente) ticket += `Cliente: ${pedido.cliente}\n`;
  ticket += `Cajero: ${pedido.cajero}\n`;
  ticket += `Tipo entrega: ${pedido.tipo_entrega}\n`;
  if (tipo === 'cliente') ticket += `Forma de pago: ${pedido.tipo_pago}\n`;
  ticket += line + '\n';

  // Detalles
  for (const d of pedido.detalles) {
    ticket += `${d.cantidad}x ${d.plato}`;
    if (tipo === 'cliente') ticket += ` - ${d.subtotal.toFixed(2)} Bs.`;
    ticket += '\n';
  }

  ticket += line + '\n';
  if (tipo === 'cliente') {
    ticket += `TOTAL: ${pedido.total.toFixed(2)} Bs.\n`;
    ticket += line + '\n';
    ticket += 'Gracias por su compra 💚\n';
  } else {
    ticket += 'Preparar con prioridad según orden\n';
  }

  return ticket;
};
