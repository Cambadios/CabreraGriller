// src/services/pedidoService.js

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// 🔹 GET: listar pedidos (por si luego quieres ver el historial)
export const getPedidos = async (token) => {
  const res = await fetch(`${API_URL}/api/pedidos`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al obtener pedidos');
  }
  return data;
};

// 🔹 POST: crear pedido
export const createPedido = async (token, payload) => {
  const res = await fetch(`${API_URL}/api/pedidos`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al crear pedido');
  }
  return data;
};
