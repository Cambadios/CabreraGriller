// src/services/pedidoService.js

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// 🔹 GET: listar todos los pedidos (historial completo)
export const getPedidos = async (token) => {
  const res = await fetch(`${API_URL}/api/pedidos`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al obtener pedidos');
  }
  return data; // array
};

// 🔹 GET: listar pedidos por fecha (YYYY-MM-DD)
export const getPedidosPorFecha = async (token, fecha) => {
  const res = await fetch(`${API_URL}/api/pedidos?fecha=${fecha}`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al obtener pedidos por fecha');
  }
  return data; // array
};

// 🔹 GET: listar pedidos de HOY (usa /hoy/lista)
export const getPedidosHoy = async (token) => {
  const res = await fetch(`${API_URL}/api/pedidos/hoy/lista`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al obtener pedidos de hoy');
  }
  // data = { fecha, pedidos }
  return data;
};

// 🔹 GET: obtener un pedido con sus detalles
export const getPedidoById = async (token, id_pedido) => {
  const res = await fetch(`${API_URL}/api/pedidos/${id_pedido}`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al obtener el pedido');
  }
  return data; // { id_pedido, fecha_hora, total, ..., detalles: [] }
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

// 🔹 PUT: actualizar pedido PENDIENTE (agregar más platos)
export const actualizarPedido = async (token, id_pedido, detalles) => {
  const res = await fetch(`${API_URL}/api/pedidos/${id_pedido}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ detalles }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al actualizar el pedido');
  }
  return data;
};

// 🔹 POST: pagar pedido pendiente (cambiar a PAGADO)
export const pagarPedido = async (token, id_pedido, tipo_pago) => {
  const res = await fetch(`${API_URL}/api/pedidos/${id_pedido}/pagar`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ tipo_pago }), // 'EFECTIVO' o 'QR'
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al pagar el pedido');
  }
  return data;
};
