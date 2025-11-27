// src/services/usuarioService.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL; // https://cabreragriller-backend.onrender.com
const USUARIOS_URL = `${BASE_URL}/api/usuarios`;

// Config general (adjunta token si existe)
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

// 📋 Listar todos (GET /api/usuarios)
export const fetchUsuarios = async () => {
  const res = await axios.get(USUARIOS_URL, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ➕ Crear nuevo (POST /api/usuarios)
export const createUsuario = async (data) => {
  const res = await axios.post(USUARIOS_URL, data, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  return res.data;
};

// ✏️ Actualizar (PUT /api/usuarios/:id)
export const updateUsuario = async (id, data) => {
  const res = await axios.put(`${USUARIOS_URL}/${id}`, data, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  return res.data;
};

// ❌ Eliminar (desactivar) (DELETE /api/usuarios/:id)
export const deleteUsuario = async (id) => {
  const res = await axios.delete(`${USUARIOS_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};
