// backend/src/models/compraModel.js
import { query } from '../db/db.js';

/**
 * Crear una nueva compra
 */
export const createCompra = async (compra) => {
  const {
    id_usuario,
    fecha,
    categoria,
    descripcion,
    proveedor,
    monto,
    observaciones,
  } = compra;

  const result = await query(
    `
    INSERT INTO compras (
      fecha,
      id_usuario,
      categoria,
      descripcion,
      proveedor,
      monto,
      observaciones
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING 
      id_compra,
      fecha,
      id_usuario,
      categoria,
      descripcion,
      proveedor,
      monto,
      observaciones,
      creado_en,
      actualizado_en
    `,
    [fecha, id_usuario, categoria, descripcion, proveedor, monto, observaciones]
  );

  return result.rows[0];
};

/**
 * Obtener compras por fecha exacta (día)
 * @param {string} fecha - 'YYYY-MM-DD'
 */
export const getComprasPorFecha = async (fecha) => {
  const result = await query(
    `
    SELECT
      id_compra,
      fecha,
      categoria,
      descripcion,
      proveedor,
      monto,
      observaciones,
      id_usuario,
      creado_en
    FROM compras
    WHERE fecha = $1
    ORDER BY creado_en ASC
    `,
    [fecha]
  );

  return result.rows;
};
