// src/pages/Login.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await login(alias, password);

      // 👇 OBTENEMOS EL USUARIO (asumiendo que lo guardas en localStorage en el AuthContext)
      const usuario = JSON.parse(localStorage.getItem('usuario'));

      if (usuario?.rol === 'ADMIN') {
        navigate('/admin');
      } else if (usuario?.rol === 'CAJERO') {
        navigate('/cajero');
      } else {
        // Si por alguna razón no hay rol conocido, lo mando al login de nuevo
        navigate('/login');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Sistema Restaurante</h1>
        <h2 className="text-lg font-semibold text-center mb-4">Iniciar sesión</h2>

        {error && (
          <div className="mb-4 bg-red-100 text-red-700 text-sm p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Alias</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring focus:ring-slate-300"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Tu alias de usuario"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring focus:ring-slate-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2 rounded-lg text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
