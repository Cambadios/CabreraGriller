// src/pages/admin/AdminLayout.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const AdminLayout = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuAbierto, setMenuAbierto] = useState(false);

  const rol = usuario?.rol || 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => setMenuAbierto((prev) => !prev);

  const tituloPanel = 'Panel de administración';

  const menuItems = [
    { label: '🏠 Resumen', key: 'resumen', path: '/admin' },
    { label: '📋 Pedidos', key: 'pedidos', path: '/admin/pedidos' },
    { label: '🍽️ Platos', key: 'platos', path: '/admin/platos' },
    { label: '👥 Clientes', key: 'clientes', path: '/admin/clientes' },
    { label: '👤 Usuarios', key: 'usuarios', path: '/admin/usuarios' },
    { label: '💵 Tickets', key: 'tickets', path: '/admin/tickets' },
    { label: '📊 Reportes', key: 'reportes', path: '/admin/reportes' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Overlay móvil */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={toggleMenu}
        />
      )}

      {/* SIDEBAR */}
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
            <p className="text-xs text-slate-300">{tituloPanel}</p>
          </div>
          <button
            className="md:hidden text-slate-300 text-xl"
            onClick={toggleMenu}
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 text-sm">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`
                w-full text-left px-3 py-2 rounded-md
                hover:bg-slate-800
                ${isActive(item.path) ? 'bg-slate-800' : ''}
              `}
              onClick={() => {
                navigate(item.path);
                setMenuAbierto(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-300">
          <p className="font-semibold text-sm">
            {usuario ? usuario.nombre_completo : 'Usuario'}
          </p>
          <p className="mb-2">Rol: {rol}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-xs font-semibold"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-h-screen ">
        {/* Topbar móvil */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow">
          <div>
            <p className="text-sm text-slate-500">Bienvenido</p>
            <p className="text-base font-semibold">
              {usuario?.nombre_completo || 'Usuario'}
            </p>
            <p className="text-xs text-slate-400 capitalize">
              Rol: {rol}
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

        {/* Aquí se renderiza cada página específica del admin */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
