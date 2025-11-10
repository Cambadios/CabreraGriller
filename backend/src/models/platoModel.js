// backend/src/models/platoModel.js
import { query } from '../db/db.js';

// 📋 Obtener todos los platos activos
export const getAllPlatos = async () => {
  const { rows } = await query(
    `SELECT 
       id_plato,
       nombre,
       tipo_plato,
       precio,
       stock_actual,
       estado
     FROM platos
     WHERE estado = TRUE
     ORDER BY id_plato;`
  );
  return rows;
};

// 🔎 Obtener un plato por ID
export const getPlatoById = async (id) => {
  const { rows } = await query(
    `SELECT 
       id_plato,
       nombre,
       tipo_plato,
       precio,
       stock_actual,
       estado
     FROM platos
     WHERE id_plato = $1;`,
    [id]
  );
  return rows[0] || null;
};

// ➕ Crear un nuevo plato
export const createPlato = async ({ nombre, tipo_plato, precio, stock_actual }) => {
  const { rows } = await query(
    `INSERT INTO platos (nombre, tipo_plato, precio, stock_actual)
     VALUES ($1, $2, $3, COALESCE($4, 0))
     RETURNING 
       id_plato, nombre, tipo_plato, precio, stock_actual, estado;`,
    [nombre, tipo_plato, precio, stock_actual ?? 0]
  );
  return rows[0];
};

// ✏️ Actualizar un plato existente
export const updatePlato = async (id, { nombre, tipo_plato, precio, stock_actual, estado }) => {
  const { rows } = await query(
    `UPDATE platos
     SET
       nombre = COALESCE($2, nombre),
       tipo_plato = COALESCE($3, tipo_plato),
       precio = COALESCE($4, precio),
       stock_actual = COALESCE($5, stock_actual),
       estado = COALESCE($6, estado)
     WHERE id_plato = $1
     RETURNING 
       id_plato, nombre, tipo_plato, precio, stock_actual, estado;`,
    [id, nombre, tipo_plato, precio, stock_actual, estado]
  );
  return rows[0] || null;
};

// ❌ Eliminar (desactivar) un plato
export const deletePlato = async (id) => {
  const { rows } = await query(
    `UPDATE platos
     SET estado = FALSE
     WHERE id_plato = $1
     RETURNING id_plato;`,
    [id]
  );
  return rows[0] ? true : false;
};
