// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

// ADMIN
import AdminLayout from './pages/admin/AdminLayout';
import AdminInicio from './pages/admin/AdminInicio';
import AdminPedidos from './pages/admin/AdminPedidos';
import AdminPlatos from './pages/admin/AdminPlatos';
import AdminClientes from './pages/admin/AdminClientes';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminTickets from './pages/admin/AdminTickets';
import AdminReportes from './pages/admin/AdminReportes';

// CAJERO
import CajeroLayout from './pages/cajero/CajeroLayout';
import CajeroInicio from './pages/cajero/CajeroInicio';
import CajeroPedidos from './pages/cajero/CajeroPedidos';
import CajeroClientes from './pages/cajero/CajeroClientes'; 
// puedes agregar CajeroTickets luego si quieres

const RutaProtegidaAdmin = ({ children }) => {
  const { usuario, cargando } = useAuth();

  if (cargando) return <p>Cargando...</p>;
  if (!usuario) return <Navigate to="/login" />;

  if (usuario.rol !== 'ADMIN') return <Navigate to="/login" />;

  return children;
};

const RutaProtegidaCajero = ({ children }) => {
  const { usuario, cargando } = useAuth();

  if (cargando) return <p>Cargando...</p>;
  if (!usuario) return <Navigate to="/login" />;

  if (usuario.rol !== 'CAJERO') return <Navigate to="/login" />;

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <RutaProtegidaAdmin>
              <AdminLayout />
            </RutaProtegidaAdmin>
          }
        >
          <Route index element={<AdminInicio />} />
          <Route path="pedidos" element={<AdminPedidos />} />
          <Route path="platos" element={<AdminPlatos />} />
          <Route path="clientes" element={<AdminClientes />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="reportes" element={<AdminReportes />} />
        </Route>

        {/* CAJERO */}
        <Route
          path="/cajero"
          element={
            <RutaProtegidaCajero>
              <CajeroLayout />
            </RutaProtegidaCajero>
          }
        >
          <Route index element={<CajeroInicio />} />
          <Route path="pedidos" element={<CajeroPedidos />} />
          <Route path="clientes" element={<CajeroClientes />} />
        </Route>

        {/* Rutas desconocidas */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
