// src/services/clienteService.js

// URL base de la API (ajusta VITE_API_URL en tu .env del frontend)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BASE_URL = `${API_URL}/api/clientes`;

// Construir headers (con o sin token)
const buildHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// 📋 Listar clientes
export const obtenerClientes = async (token) => {
  const resp = await fetch(BASE_URL, {
    headers: buildHeaders(token),
  });
  if (!resp.ok) throw new Error('Error al obtener clientes');
  return await resp.json();
};

// ➕ Crear cliente
export const crearCliente = async (data, token) => {
  const resp = await fetch(BASE_URL, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(data),
  });
  if (!resp.ok) throw new Error('Error al crear cliente');
  return await resp.json();
};

// ✏️ Actualizar cliente
export const actualizarCliente = async (id, data, token) => {
  const resp = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: buildHeaders(token),
    body: JSON.stringify(data),
  });
  if (!resp.ok) throw new Error('Error al actualizar cliente');
  return await resp.json();
};

// ❌ Eliminar cliente
export const eliminarCliente = async (id, token) => {
  const resp = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  });
  if (!resp.ok) throw new Error('Error al eliminar cliente');
  return await resp.json();
};
