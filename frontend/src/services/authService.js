// src/services/authService.js
export const loginRequest = async (alias, password) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ alias, password }), // 👈 EXACTO como tu backend
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.mensaje || "Credenciales incorrectas");
  }

  return data; // { mensaje, token, usuario }
};
