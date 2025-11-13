// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { loginRequest } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('usuario');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUsuario(JSON.parse(savedUser));
    }
    setCargando(false);
  }, []);

  const login = async (alias, password) => {
    const data = await loginRequest(alias, password);
    const { token, usuario } = data;

    setToken(token);
    setUsuario(usuario);

    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        cargando,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 👇 ESTE export es el que te faltaba / está mal
export const useAuth = () => useContext(AuthContext);
