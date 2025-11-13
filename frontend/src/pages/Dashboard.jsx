// src/pages/Dashboard.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => setMenuAbierto((prev) => !prev);

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* SIDEBAR - fijo en md+, overlay en mobile */}
      {/* Fondo oscuro cuando el menú está abierto en mobile */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={toggleMenu}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30
          w-64 bg-slate-900 text-white flex flex-col
          transform transition-transform duration-200
          ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static
        `}
      >
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">CabreraGriller</h1>
            <p className="text-xs text-slate-300">Panel de administración</p>
          </div>
          {/* Botón para cerrar en mobile */}
          <button
            className="md:hidden text-slate-300 text-xl"
            onClick={toggleMenu}
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 text-sm">
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-800">
            📋 Pedidos
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-800">
            🍽️ Platos
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-800">
            👥 Clientes
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-800">
            💵 Tickets
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-800">
            📊 Reportes
          </button>
        </nav>

        <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-300">
          <p className="font-semibold text-sm">
            {usuario ? usuario.nombre_completo : 'Usuario'}
          </p>
          <p className="mb-2">Rol: {usuario?.rol || '—'}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-xs font-semibold"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        {/* Topbar (solo se ve en mobile) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow">
          <div>
            <p className="text-sm text-slate-500">Bienvenido</p>
            <p className="text-base font-semibold">
              {usuario?.nombre_completo || 'Usuario'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1 rounded-full bg-red-500 text-white"
            >
              Salir
            </button>
            <button
              className="text-2xl"
              onClick={toggleMenu}
            >
              ☰
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold mb-2">Dashboard</h2>
          <p className="mb-2 text-sm md:text-base">
            Bienvenido,{' '}
            <span className="font-semibold">
              {usuario?.nombre_completo || 'Usuario'}
            </span>
          </p>
          <p className="text-xs md:text-sm text-slate-600">
            Aquí luego mostraremos los pedidos del día, resumen de ventas, etc.
          </p>

          {/* Tarjetas de resumen rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs md:text-sm text-slate-500">Pedidos de hoy</p>
              <p className="text-2xl md:text-3xl font-bold">0</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs md:text-sm text-slate-500">Ventas de hoy</p>
              <p className="text-2xl md:text-3xl font-bold">Bs. 0</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs md:text-sm text-slate-500">Platos activos</p>
              <p className="text-2xl md:text-3xl font-bold">0</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
