// backend/src/models/pedidoModel.js
import { query } from '../db/db.js';

/**
 * Crear un nuevo pedido con sus detalles
 * @param {Object} pedido - Datos del pedido
 * @param {number|null} pedido.id_cliente
 * @param {number} pedido.id_usuario
 * @param {string} pedido.tipo_entrega - 'MESA' o 'LLEVAR'
 * @param {string} pedido.tipo_pago - 'EFECTIVO' | 'QR' | 'PENDIENTE'
 * @param {Array} pedido.detalles - [{ id_plato, cantidad }]
 */
export const createPedido = async (pedido) => {
  // ⚠️ Esto asume que tu función query maneja transacciones.
  await query('BEGIN'); // inicia transacción

  try {
    // 1️⃣ Calcular total general
    let total = 0;
    for (const d of pedido.detalles) {
      const plato = await query(
        'SELECT precio, stock_actual FROM platos WHERE id_plato = $1',
        [d.id_plato]
      );
      if (plato.rows.length === 0) {
        throw new Error(`Plato con id ${d.id_plato} no existe`);
      }
      const { precio, stock_actual } = plato.rows[0];
      if (stock_actual < d.cantidad) {
        throw new Error(`Stock insuficiente para el plato ${d.id_plato}`);
      }
      total += Number(precio) * d.cantidad;
    }

    // 👉 Estado del pedido según el tipo de pago
    // - EFECTIVO / QR  → PAGADO
    // - PENDIENTE      → PENDIENTE
    const estadoPedido =
      pedido.tipo_pago === 'PENDIENTE' ? 'PENDIENTE' : 'PAGADO';

    // 2️⃣ Insertar pedido principal
    const pedidoInsert = await query(
      `INSERT INTO pedidos (id_cliente, id_usuario, tipo_entrega, tipo_pago, total, estado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_pedido;`,
      [
        pedido.id_cliente || null,
        pedido.id_usuario,
        pedido.tipo_entrega,
        pedido.tipo_pago,
        total,
        estadoPedido,
      ]
    );
    const id_pedido = pedidoInsert.rows[0].id_pedido;

    // 3️⃣ Insertar detalles y descontar stock
    for (const d of pedido.detalles) {
      const platoData = await query(
        'SELECT precio FROM platos WHERE id_plato = $1',
        [d.id_plato]
      );
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
    return { id_pedido, total, estado: estadoPedido };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// 🆕 Actualizar un pedido PENDIENTE añadiendo más platos
export const actualizarPedidoPendiente = async (id_pedido, nuevosDetalles) => {
  await query('BEGIN');

  try {
    // 1️⃣ Verificar que el pedido exista y esté PENDIENTE
    const pedido = await query(
      'SELECT estado FROM pedidos WHERE id_pedido = $1',
      [id_pedido]
    );

    if (pedido.rows.length === 0) {
      throw new Error('Pedido no existe');
    }

    if (pedido.rows[0].estado !== 'PENDIENTE') {
      throw new Error('Solo se pueden modificar pedidos con estado PENDIENTE');
    }

    // 2️⃣ Agregar nuevos detalles
    let incremento_total = 0;

    for (const d of nuevosDetalles) {
      const plato = await query(
        'SELECT precio, stock_actual FROM platos WHERE id_plato = $1',
        [d.id_plato]
      );

      if (plato.rows.length === 0) {
        throw new Error(`Plato ${d.id_plato} no existe`);
      }

      const { precio, stock_actual } = plato.rows[0];

      if (stock_actual < d.cantidad) {
        throw new Error(
          `Stock insuficiente del plato ${d.id_plato}. Stock actual: ${stock_actual}`
        );
      }

      const precio_unitario = Number(precio);
      const subtotal = precio_unitario * d.cantidad;

      // Insertar nuevo detalle
      await query(
        `INSERT INTO pedido_detalle (id_pedido, id_plato, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5);`,
        [id_pedido, d.id_plato, d.cantidad, precio_unitario, subtotal]
      );

      // Descontar stock
      await query(
        `UPDATE platos SET stock_actual = stock_actual - $1 WHERE id_plato = $2;`,
        [d.cantidad, d.id_plato]
      );

      incremento_total += subtotal;
    }

    // 3️⃣ Actualizar total del pedido
    await query(
      `UPDATE pedidos SET total = total + $1 WHERE id_pedido = $2;`,
      [incremento_total, id_pedido]
    );

    await query('COMMIT');

    return {
      mensaje: 'Pedido actualizado correctamente',
      incremento_total,
    };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// 📋 Obtener pedidos (todos o filtrados por fecha)
export const getPedidos = async (fecha = null) => {
  const params = [];
  let where = '';

  // Si envías fecha en formato 'YYYY-MM-DD' filtra por ese día
  if (fecha) {
    params.push(fecha);
    where = 'WHERE DATE(p.fecha_hora) = $1';
  }

  const { rows } = await query(
    `
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
    ${where}
    ORDER BY p.fecha_hora DESC;
    `,
    params
  );

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

// 🆕 Pagar un pedido pendiente (cambiar a PAGADO y actualizar tipo_pago)
export const pagarPedido = async (id_pedido, tipo_pago_real) => {
  await query('BEGIN');

  try {
    const pedido = await query(
      'SELECT estado FROM pedidos WHERE id_pedido = $1',
      [id_pedido]
    );

    if (pedido.rows.length === 0) {
      throw new Error('Pedido no existe');
    }

    if (pedido.rows[0].estado !== 'PENDIENTE') {
      throw new Error('Solo se pueden pagar pedidos en estado PENDIENTE');
    }

    if (!['EFECTIVO', 'QR'].includes(tipo_pago_real)) {
      throw new Error('Tipo de pago no válido para pagar el pedido');
    }

    await query(
      `UPDATE pedidos
       SET tipo_pago = $2,
           estado   = 'PAGADO'
       WHERE id_pedido = $1;`,
      [id_pedido, tipo_pago_real]
    );

    await query('COMMIT');

    return {
      mensaje: 'Pedido pagado correctamente',
      nuevo_estado: 'PAGADO',
      tipo_pago: tipo_pago_real,
    };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};
