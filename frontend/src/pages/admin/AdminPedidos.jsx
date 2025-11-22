// src/pages/admin/AdminPedidos.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { getPedidosPorFecha } from '../../services/pedidoService';

const formatearFecha = (date) => date.toISOString().substring(0, 10);

const AdminPedidos = () => {
  const { token } = useAuth();

  const [fecha, setFecha] = useState(() => formatearFecha(new Date()));
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [totalDia, setTotalDia] = useState(0);

  const cargarPedidos = async (f) => {
    try {
      setCargando(true);
      setError('');
      const data = await getPedidosPorFecha(token, f);
      setPedidos(data || []);

      const suma = (data || []).reduce(
        (acc, p) => acc + Number(p.total || 0),
        0
      );
      setTotalDia(suma);
    } catch (err) {
      setError(err.message || 'Error al cargar pedidos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos(fecha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ SOCKET: refresco en vivo
  useSocket(token, {
    'pedido:nuevo': () => cargarPedidos(fecha),
    'pedido:actualizado': () => cargarPedidos(fecha),
    'pedido:pagado': () => cargarPedidos(fecha),
    'admin:refresh': (p) => {
      if (p?.tipo === 'pedidos' || p?.tipo === 'resumenDia') {
        cargarPedidos(fecha);
      }
    },
  });

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarPedidos(fecha);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">📋 Pedidos del día (Admin)</h1>

      <form
        onSubmit={handleBuscar}
        className="flex flex-col md:flex-row gap-3 items-start md:items-end mb-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
        >
          Buscar
        </button>
      </form>

      {cargando && <p>Cargando pedidos...</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="mb-4">
        <p className="font-medium">
          Total del día:{' '}
          <span className="font-bold">Bs. {totalDia.toFixed(2)}</span>
        </p>
        <p className="text-sm text-gray-600">
          Pedidos encontrados: {pedidos.length}
        </p>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Hora</th>
              <th className="px-3 py-2 text-left">N° Pedido</th>
              <th className="px-3 py-2 text-left">Cliente</th>
              <th className="px-3 py-2 text-left">Entrega</th>
              <th className="px-3 py-2 text-left">Pago</th>
              <th className="px-3 py-2 text-right">Total (Bs.)</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 && !cargando && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-gray-500">
                  No hay pedidos para esta fecha.
                </td>
              </tr>
            )}

            {pedidos.map((p, idx) => {
              const fechaHora = p.fecha_hora ? new Date(p.fecha_hora) : null;
              const horaStr = fechaHora
                ? fechaHora.toTimeString().substring(0, 5)
                : '-';

              return (
                <tr key={p.id_pedido} className="border-t">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2">{horaStr}</td>
                  <td className="px-3 py-2">#{p.id_pedido}</td>
                  <td className="px-3 py-2">{p.cliente_nombre || 'Sin cliente'}</td>
                  <td className="px-3 py-2">{p.tipo_entrega}</td>
                  <td className="px-3 py-2">{p.tipo_pago}</td>
                  <td className="px-3 py-2 text-right">
                    {Number(p.total || 0).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPedidos;
