// backend/src/models/usuarioModel.js
import { query } from '../db/db.js';
import bcrypt from 'bcryptjs';

// 📋 Obtener todos los usuarios
export const getAllUsuarios = async () => {
  const { rows } = await query(
    `SELECT 
       id_usuario,
       nombre_completo,
       alias,
       rol,
       estado,
       creado_en,
       actualizado_en
     FROM usuarios
     ORDER BY id_usuario;`
  );
  return rows;
};

// 🔎 Obtener usuario por ID (sin password_hash)
export const getUsuarioById = async (id) => {
  const { rows } = await query(
    `SELECT 
       id_usuario,
       nombre_completo,
       alias,
       rol,
       estado,
       creado_en,
       actualizado_en
     FROM usuarios
     WHERE id_usuario = $1;`,
    [id]
  );
  return rows[0] || null;
};

// 🔎 Obtener usuario por alias (para login, incluye password_hash)
export const getUsuarioByAlias = async (alias) => {
  const { rows } = await query(
    `SELECT 
       id_usuario,
       nombre_completo,
       alias,
       password_hash,
       rol,
       estado,
       creado_en,
       actualizado_en
     FROM usuarios
     WHERE alias = $1
       AND estado = TRUE;`,
    [alias]
  );
  return rows[0] || null;
};

// ➕ Crear usuario (USO GENERAL - ya encripta la contraseña)
export const createUsuario = async ({ nombre_completo, alias, password, rol }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const { rows } = await query(
    `INSERT INTO usuarios (nombre_completo, alias, password_hash, rol, estado)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING 
       id_usuario,
       nombre_completo,
       alias,
       rol,
       estado,
       creado_en,
       actualizado_en;`,
    [nombre_completo, alias, hashedPassword, rol]
  );
  return rows[0];
};

// ➕ Crear usuario (USO ESPECÍFICO desde authController, por si quieres separar)
export const createUsuarioSeguro = async (datos) => {
  return createUsuario(datos); // reutiliza la lógica de arriba
};

// ✏️ Actualizar usuario
export const updateUsuario = async (
  id,
  { nombre_completo, alias, password, rol, estado }
) => {
  let hashedPassword = null;

  // Si viene un password nuevo, lo encriptamos
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const { rows } = await query(
    `UPDATE usuarios
     SET
       nombre_completo = COALESCE($2, nombre_completo),
       alias           = COALESCE($3, alias),
       password_hash   = COALESCE($4, password_hash),
       rol             = COALESCE($5, rol),
       estado          = COALESCE($6, estado)
     WHERE id_usuario = $1
     RETURNING 
       id_usuario,
       nombre_completo,
       alias,
       rol,
       estado,
       creado_en,
       actualizado_en;`,
    [id, nombre_completo, alias, hashedPassword, rol, estado]
  );
  return rows[0] || null;
};

// ❌ Desactivar usuario (no borramos)
export const deleteUsuario = async (id) => {
  const { rows } = await query(
    `UPDATE usuarios
     SET estado = FALSE
     WHERE id_usuario = $1
     RETURNING id_usuario;`,
    [id]
  );
  return !!rows[0];
};
