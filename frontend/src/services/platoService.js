// src/services/platoService.js

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

// 🔹 GET: lista de platos
export const getPlatos = async (token) => {
  const res = await fetch(`${API_URL}/api/platos`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al obtener platos');
  }
  return data;
};

// 🔹 POST: crear plato (FormData)
export const createPlato = async (token, formData) => {
  const res = await fetch(`${API_URL}/api/platos`, {
    method: 'POST',
    headers: getAuthHeaders(token), // NO ponemos Content-Type, lo gestiona el navegador
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al crear plato');
  }
  return data;
};

// 🔹 PUT: actualizar plato (FormData)
export const updatePlato = async (token, id_plato, formData) => {
  const res = await fetch(`${API_URL}/api/platos/${id_plato}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || 'Error al actualizar plato');
  }
  return data;
};

// 🔹 DELETE: eliminar plato
export const deletePlato = async (token, id_plato) => {
  const res = await fetch(`${API_URL}/api/platos/${id_plato}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensaje || 'Error al eliminar plato');
  }
};