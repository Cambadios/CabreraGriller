// src/pages/cajero/CajeroInicio.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getResumenCajeroHoy } from '../../services/reporteService';

const CajeroInicio = () => {
  const { usuario, token } = useAuth();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState({
    total_dia: 0,
    total_tickets: 0,
    total_efectivo: 0,
    total_qr: 0,
    ultimos_pedidos: [],
  });

  const cargarResumen = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await getResumenCajeroHoy(token);
      setResumen({
        total_dia: data.total_dia ?? 0,
        total_tickets: data.total_tickets ?? 0,
        total_efectivo: data.total_efectivo ?? 0,
        total_qr: data.total_qr ?? 0,
        ultimos_pedidos: data.ultimos_pedidos ?? [],
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo cargar el resumen del día');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (token) {
      cargarResumen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const { total_dia, total_tickets, total_efectivo, total_qr, ultimos_pedidos } =
    resumen;

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold mb-1">Resumen del Cajero</h1>
          <p className="text-sm text-slate-600">
            Resumen de ventas y tickets del día de hoy.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Cajero:{' '}
            <span className="font-semibold">
              {usuario?.nombre_completo || '—'}
            </span>
          </p>
        </div>
        <button
          onClick={cargarResumen}
          className="self-start md:self-auto inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Estado / errores */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow p-3 border border-slate-100">
          <p className="text-xs text-slate-500">Total del día</p>
          <p className="text-lg font-bold text-emerald-700">
            Bs. {total_dia.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-3 border border-slate-100">
          <p className="text-xs text-slate-500">Tickets emitidos</p>
          <p className="text-lg font-bold text-slate-800">
            {total_tickets}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-3 border border-slate-100">
          <p className="text-xs text-slate-500">Cobrado en efectivo</p>
          <p className="text-lg font-bold text-emerald-700">
            Bs. {total_efectivo.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-3 border border-slate-100">
          <p className="text-xs text-slate-500">Cobrado por QR</p>
          <p className="text-lg font-bold text-emerald-700">
            Bs. {total_qr.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Cargando */}
      {cargando && (
        <p className="text-sm text-slate-500">Cargando datos del día...</p>
      )}

      {/* Últimos pedidos */}
      <div className="bg-white rounded-xl shadow p-4 border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Últimos pedidos del día</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
            {ultimos_pedidos.length} registro(s)
          </span>
        </div>

        {ultimos_pedidos.length === 0 ? (
          <p className="text-xs text-slate-500">
            No hay pedidos registrados para hoy.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[11px] border border-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-2 py-2 border text-left">Hora</th>
                  <th className="px-2 py-2 border text-left">Cliente</th>
                  <th className="px-2 py-2 border text-center">Servicio</th>
                  <th className="px-2 py-2 border text-center">Pago</th>
                  <th className="px-2 py-2 border text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {ultimos_pedidos.map((p) => (
                  <tr key={p.id_pedido} className="hover:bg-slate-50">
                    <td className="px-2 py-1.5 border">
                      {p.fecha_hora
                        ? new Date(p.fecha_hora).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-2 py-1.5 border">
                      {p.cliente || 'Anónimo'}
                    </td>
                    <td className="px-2 py-1.5 border text-center">
                      {p.tipo_entrega === 'MESA'
                        ? 'En mesa'
                        : p.tipo_entrega === 'LLEVAR'
                        ? 'Para llevar'
                        : p.tipo_entrega || '—'}
                    </td>
                    <td className="px-2 py-1.5 border text-center">
                      {p.tipo_pago === 'EFECTIVO' ? 'Efectivo' : 'QR'}
                    </td>
                    <td className="px-2 py-1.5 border text-right">
                      Bs. {Number(p.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CajeroInicio;
