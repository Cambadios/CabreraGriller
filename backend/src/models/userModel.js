// src/models/userModel.js
import { query } from '../db/db.js';

export const getAllUsers = async () => {
  const { rows } = await query('SELECT id, name, email FROM users ORDER BY id ASC;');
  return rows;
};

export const getUserById = async (id) => {
  const { rows } = await query('SELECT id, name, email FROM users WHERE id = $1;', [id]);
  return rows[0] || null;
};

export const createUser = async ({ name, email }) => {
  const { rows } = await query(
    `INSERT INTO users (name, email)
     VALUES ($1, $2)
     RETURNING id, name, email;`,
    [name, email]
  );
  return rows[0];
};

export const updateUser = async (id, { name, email }) => {
  const { rows } = await query(
    `UPDATE users
     SET name = COALESCE($2, name),
         email = COALESCE($3, email)
     WHERE id = $1
     RETURNING id, name, email;`,
    [id, name, email]
  );
  return rows[0] || null;
};

export const deleteUser = async (id) => {
  const { rowCount } = await query('DELETE FROM users WHERE id = $1;', [id]);
  return rowCount > 0;
};
