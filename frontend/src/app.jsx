// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { useAuth } from './context/AuthContext';

const RutasProtegidas = ({ children }) => {
  const { isAuthenticated, cargando } = useAuth();

  if (cargando) return <p>Cargando...</p>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <RutasProtegidas>
              <Dashboard />
            </RutasProtegidas>
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
