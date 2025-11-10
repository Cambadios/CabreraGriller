// backend/src/models/clienteModel.js
import { query } from '../db/db.js';

// 📋 Obtener todos los clientes
export const getAllClientes = async () => {
  const { rows } = await query(
    `SELECT 
       id_cliente,
       nombre_completo,
       telefono,
       direccion
     FROM clientes
     ORDER BY id_cliente;`
  );
  return rows;
};

// 🔎 Obtener un cliente por ID
export const getClienteById = async (id) => {
  const { rows } = await query(
    `SELECT 
       id_cliente,
       nombre_completo,
       telefono,
       direccion
     FROM clientes
     WHERE id_cliente = $1;`,
    [id]
  );
  return rows[0] || null;
};

// ➕ Crear un cliente
export const createCliente = async ({ nombre_completo, telefono, direccion }) => {
  const { rows } = await query(
    `INSERT INTO clientes (nombre_completo, telefono, direccion)
     VALUES ($1, $2, $3)
     RETURNING 
       id_cliente, nombre_completo, telefono, direccion;`,
    [nombre_completo, telefono, direccion]
  );
  return rows[0];
};

// ✏️ Actualizar un cliente
export const updateCliente = async (id, { nombre_completo, telefono, direccion }) => {
  const { rows } = await query(
    `UPDATE clientes
     SET
       nombre_completo = COALESCE($2, nombre_completo),
       telefono = COALESCE($3, telefono),
       direccion = COALESCE($4, direccion)
     WHERE id_cliente = $1
     RETURNING 
       id_cliente, nombre_completo, telefono, direccion;`,
    [id, nombre_completo, telefono, direccion]
  );
  return rows[0] || null;
};

// ❌ Eliminar cliente
export const deleteCliente = async (id) => {
  const { rowCount } = await query(`DELETE FROM clientes WHERE id_cliente = $1;`, [id]);
  return rowCount > 0;
};
