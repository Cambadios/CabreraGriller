// src/services/reporteService.js
const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

// Este lo usa CajeroInicio
export const getResumenCajeroHoy = async (token) => {
  // Usamos tu endpoint existente: GET /api/reportes/dia
  const res = await fetch(`${API_URL}/api/reportes/dia`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al obtener resumen del cajero');
  }

  // data = { fecha, resumen, platos }
  const resumen = data.resumen || {};

  // Ajusta los nombres según lo que devuelva getResumenDia(fecha)
  return {
    total_dia: Number(resumen.total_dia ?? 0),
    total_tickets: Number(
      resumen.total_tickets ?? resumen.total_pedidos ?? 0
    ),
    total_efectivo: Number(resumen.total_efectivo ?? 0),
    total_qr: Number(resumen.total_qr ?? 0),

    // Por ahora no tienes "últimos pedidos" en este endpoint,
    // así que lo dejamos vacío. Más adelante lo podemos llenar.
    ultimos_pedidos: data.ultimos_pedidos ?? [],
  };
};
