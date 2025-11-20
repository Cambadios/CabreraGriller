// src/services/compraService.js
const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

// 🔹 Obtener compras por fecha (YYYY-MM-DD)
export const getComprasPorFecha = async (token, fecha) => {
  const res = await fetch(`${API_URL}/api/compras?fecha=${fecha}`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al obtener compras');
  }
  return data; // 👈 lista de compras
};

// 🔹 Crear una nueva compra
export const crearCompra = async (token, compra) => {
  const res = await fetch(`${API_URL}/api/compras`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(compra),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al registrar compra');
  }
  return data;
};
