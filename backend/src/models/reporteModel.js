// backend/src/models/reporteModel.js
import { query } from '../db/db.js';

// Resumen general del día (totales por forma de pago)
export const getResumenDia = async (fecha) => {
  const { rows } = await query(
    `
    SELECT
      COALESCE(SUM(total), 0)                         AS total_general,
      COALESCE(SUM(CASE WHEN tipo_pago = 'EFECTIVO' THEN total ELSE 0 END), 0) AS total_efectivo,
      COALESCE(SUM(CASE WHEN tipo_pago = 'QR' THEN total ELSE 0 END), 0)       AS total_qr,
      COUNT(*)                                       AS total_pedidos
    FROM pedidos
    WHERE fecha_hora::date = $1
      AND estado = 'PAGADO';
    `,
    [fecha]
  );

  return rows[0];
};

// Platos más vendidos en el día
export const getPlatosMasVendidosDia = async (fecha) => {
  const { rows } = await query(
    `
    SELECT
      d.id_plato,
      p.nombre,
      SUM(d.cantidad)              AS cantidad_vendida,
      SUM(d.subtotal)              AS total_vendido
    FROM pedidos ped
    JOIN pedido_detalle d ON ped.id_pedido = d.id_pedido
    JOIN platos p        ON d.id_plato   = p.id_plato
    WHERE ped.fecha_hora::date = $1
      AND ped.estado = 'PAGADO'
    GROUP BY d.id_plato, p.nombre
    ORDER BY cantidad_vendida DESC;
    `,
    [fecha]
  );

  return rows;
};
