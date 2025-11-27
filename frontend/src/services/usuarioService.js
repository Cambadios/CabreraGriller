// src/services/usuarioService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Config general (adjunta token si existe)
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

// 📋 Listar todos
export const fetchUsuarios = async () => {
  const res = await axios.get(API_URL, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ➕ Crear nuevo
export const createUsuario = async (data) => {
  const res = await axios.post(API_URL, data, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  return res.data;
};

// ✏️ Actualizar (PUT /api/usuarios/:id)
export const updateUsuario = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  return res.data;
};

// ❌ Eliminar (desactivar)
export const deleteUsuario = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};
