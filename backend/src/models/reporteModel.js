// backend/src/models/reporteModel.js
import { query } from '../db/db.js';

// Resumen general del día (ingresos, formas de pago, egresos y ganancia neta)
export const getResumenDia = async (fecha) => {
  const { rows } = await query(
    `
    WITH ventas AS (
      SELECT
        COALESCE(SUM(total), 0) AS total_general,
        COALESCE(SUM(CASE WHEN tipo_pago = 'EFECTIVO' THEN total ELSE 0 END), 0) AS total_efectivo,
        COALESCE(SUM(CASE WHEN tipo_pago = 'QR' THEN total ELSE 0 END), 0)       AS total_qr,
        COUNT(*) AS total_pedidos
      FROM pedidos
      WHERE fecha_hora::date = $1
        AND estado = 'PAGADO'
    ),
    egresos AS (
      SELECT
        COALESCE(SUM(monto), 0) AS total_egresos
      FROM compras
      WHERE fecha::date = $1
    )
    SELECT
      v.total_general,
      v.total_efectivo,
      v.total_qr,
      v.total_pedidos,
      e.total_egresos,
      (v.total_general - e.total_egresos) AS ganancia_neta
    FROM ventas v
    CROSS JOIN egresos e;
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
