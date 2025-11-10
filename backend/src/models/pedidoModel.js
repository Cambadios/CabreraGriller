// backend/src/models/pedidoModel.js
import { query } from '../db/db.js';

/**
 * Crear un nuevo pedido con sus detalles
 * @param {Object} pedido - Datos del pedido
 * @param {number|null} pedido.id_cliente
 * @param {number} pedido.id_usuario
 * @param {string} pedido.tipo_entrega - 'MESA' o 'LLEVAR'
 * @param {string} pedido.tipo_pago - 'EFECTIVO' o 'QR'
 * @param {Array} pedido.detalles - [{ id_plato, cantidad }]
 */
export const createPedido = async (pedido) => {
  const client = await query('BEGIN'); // inicia transacción

  try {
    // 1️⃣ Calcular total general
    let total = 0;
    for (const d of pedido.detalles) {
      const plato = await query('SELECT precio, stock_actual FROM platos WHERE id_plato = $1', [d.id_plato]);
      if (plato.rows.length === 0) throw new Error(`Plato con id ${d.id_plato} no existe`);
      const { precio, stock_actual } = plato.rows[0];
      if (stock_actual < d.cantidad) throw new Error(`Stock insuficiente para el plato ${d.id_plato}`);
      total += Number(precio) * d.cantidad;
    }

    // 2️⃣ Insertar pedido principal
    const pedidoInsert = await query(
      `INSERT INTO pedidos (id_cliente, id_usuario, tipo_entrega, tipo_pago, total, estado)
       VALUES ($1, $2, $3, $4, $5, 'PAGADO')
       RETURNING id_pedido;`,
      [pedido.id_cliente || null, pedido.id_usuario, pedido.tipo_entrega, pedido.tipo_pago, total]
    );
    const id_pedido = pedidoInsert.rows[0].id_pedido;

    // 3️⃣ Insertar detalles y descontar stock
    for (const d of pedido.detalles) {
      const platoData = await query('SELECT precio FROM platos WHERE id_plato = $1', [d.id_plato]);
      const precio_unitario = Number(platoData.rows[0].precio);
      const subtotal = precio_unitario * d.cantidad;

      await query(
        `INSERT INTO pedido_detalle (id_pedido, id_plato, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5);`,
        [id_pedido, d.id_plato, d.cantidad, precio_unitario, subtotal]
      );

      await query(
        `UPDATE platos SET stock_actual = stock_actual - $1 WHERE id_plato = $2;`,
        [d.cantidad, d.id_plato]
      );
    }

    // 4️⃣ Confirmar transacción
    await query('COMMIT');
    return { id_pedido, total };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// 📋 Obtener todos los pedidos (resumen)
export const getAllPedidos = async () => {
  const { rows } = await query(`
    SELECT 
      p.id_pedido,
      p.fecha_hora,
      p.total,
      p.tipo_entrega,
      p.tipo_pago,
      p.estado,
      u.nombre_completo AS cajero,
      c.nombre_completo AS cliente
    FROM pedidos p
    JOIN usuarios u ON p.id_usuario = u.id_usuario
    LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
    ORDER BY p.id_pedido DESC;
  `);
  return rows;
};

// 🔎 Obtener un pedido con sus detalles
export const getPedidoById = async (id) => {
  const pedido = await query(
    `SELECT 
       p.id_pedido,
       p.fecha_hora,
       p.total,
       p.tipo_entrega,
       p.tipo_pago,
       p.estado,
       u.nombre_completo AS cajero,
       c.nombre_completo AS cliente
     FROM pedidos p
     JOIN usuarios u ON p.id_usuario = u.id_usuario
     LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
     WHERE p.id_pedido = $1;`,
    [id]
  );

  const detalles = await query(
    `SELECT 
       d.id_detalle,
       pl.nombre AS plato,
       d.cantidad,
       d.precio_unitario,
       d.subtotal
     FROM pedido_detalle d
     JOIN platos pl ON d.id_plato = pl.id_plato
     WHERE d.id_pedido = $1;`,
    [id]
  );

  if (pedido.rows.length === 0) return null;
  return { ...pedido.rows[0], detalles: detalles.rows };
};
