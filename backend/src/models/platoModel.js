// backend/src/models/platoModel.js
import pool from '../db/db.js';

// 📋 Listar platos
export const getAllPlatos = async () => {
  const sql = `
    SELECT
      id_plato,
      nombre,
      tipo_plato,
      precio,
      stock_actual,
      estado,
      observaciones,
      imagen_url,
      creado_en,
      actualizado_en
    FROM platos
    ORDER BY id_plato DESC;
  `;
  const { rows } = await pool.query(sql);
  return rows;
};

// 🔎 Obtener por ID
export const getPlatoById = async (id) => {
  const sql = `
    SELECT
      id_plato,
      nombre,
      tipo_plato,
      precio,
      stock_actual,
      estado,
      observaciones,
      imagen_url,
      creado_en,
      actualizado_en
    FROM platos
    WHERE id_plato = $1;
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

// ➕ Crear plato
export const createPlato = async ({
  nombre,
  tipo_plato,
  precio,
  stock_actual = 0,
  estado = true,
  observaciones = null,
  imagen_url = null,
}) => {
  const sql = `
    INSERT INTO platos (
      nombre,
      tipo_plato,
      precio,
      stock_actual,
      estado,
      observaciones,
      imagen_url
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id_plato,
      nombre,
      tipo_plato,
      precio,
      stock_actual,
      estado,
      observaciones,
      imagen_url,
      creado_en,
      actualizado_en;
  `;

  const values = [
    nombre,
    tipo_plato,
    precio,
    stock_actual,
    estado,
    observaciones,
    imagen_url,
  ];

  const { rows } = await pool.query(sql, values);
  return rows[0];
};

// ✏️ Actualizar plato
export const updatePlato = async (id_plato, datos) => {
  const campos = [];
  const valores = [];
  let i = 1;

  if (datos.nombre !== undefined) {
    campos.push(`nombre = $${i++}`);
    valores.push(datos.nombre);
  }
  if (datos.tipo_plato !== undefined) {
    campos.push(`tipo_plato = $${i++}`);
    valores.push(datos.tipo_plato);
  }
  if (datos.precio !== undefined) {
    campos.push(`precio = $${i++}`);
    valores.push(datos.precio);
  }
  if (datos.stock_actual !== undefined) {
    campos.push(`stock_actual = $${i++}`);
    valores.push(datos.stock_actual);
  }
  if (datos.estado !== undefined) {
    campos.push(`estado = $${i++}`);
    valores.push(datos.estado);
  }
  if (datos.observaciones !== undefined) {
    campos.push(`observaciones = $${i++}`);
    valores.push(datos.observaciones);
  }
  if (datos.imagen_url !== undefined) {
    campos.push(`imagen_url = $${i++}`);
    valores.push(datos.imagen_url);
  }

  if (campos.length === 0) {
    return null; // Nada que actualizar
  }

  const sql = `
    UPDATE platos
    SET
      ${campos.join(', ')},
      actualizado_en = NOW()
    WHERE id_plato = $${i}
    RETURNING
      id_plato,
      nombre,
      tipo_plato,
      precio,
      stock_actual,
      estado,
      observaciones,
      imagen_url,
      creado_en,
      actualizado_en;
  `;

  valores.push(id_plato);

  const { rows } = await pool.query(sql, valores);
  return rows[0] || null;
};

// ❌ Eliminar plato
export const deletePlato = async (id_plato) => {
  const sql = `
    DELETE FROM platos
    WHERE id_plato = $1
    RETURNING id_plato;
  `;
  const { rows } = await pool.query(sql, [id_plato]);
  return rows[0] || null;
};
