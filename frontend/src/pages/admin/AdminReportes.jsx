// src/pages/admin/AdminReportes.jsx
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getResumenDia } from '../../services/reporteService';

const formatearMoneda = (valor) => {
  if (valor == null) return 'Bs 0.00';
  const num = Number(valor) || 0;
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(num);
};

const AdminReportes = () => {
  const { token } = useAuth();

  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().substring(0, 10);
  });

  const [resumen, setResumen] = useState(null);
  const [platos, setPlatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargarDatos = async (f) => {
    try {
      setLoading(true);
      setError('');
      const data = await getResumenDia(token, f);

      console.log('🔍 Datos recibidos del backend:', data);

      setResumen(data.resumen || {});
      setPlatos(data.platos || []);
    } catch (err) {
      console.error('Error al cargar reportes:', err);
      setError(err.message || 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) cargarDatos(fecha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const maxCantidadVendida = useMemo(() => {
    if (!platos.length) return 0;
    return platos.reduce(
      (max, p) => Math.max(max, Number(p.cantidad_vendida || 0)),
      0
    );
  }, [platos]);

  // Como en el resumen no viene total de platos, lo calculamos desde la lista
  const totalPlatosVendidos = useMemo(() => {
    if (!platos.length) return 0;
    return platos.reduce(
      (sum, p) => sum + Number(p.cantidad_vendida || 0),
      0
    );
  }, [platos]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarDatos(fecha);
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold">Reportes</h2>
          <p className="text-sm text-slate-600">
            Resumen de ventas y platos más vendidos por día.
          </p>
        </div>

        <form
          onSubmit={handleBuscar}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <label className="text-sm text-slate-700 flex flex-col">
            <span className="mb-1 font-medium">Seleccionar fecha:</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-purple-200"
            />
          </label>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Ver reporte
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-6 text-slate-600 text-sm">
          Cargando reportes...
        </div>
      )}

      {error && !loading && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && resumen && (
        <>
          {/* ================================
               🔸 RESUMEN NUMÉRICO
             ================================ */}
          <section className="mb-6">
            <h3 className="text-base md:text-lg font-semibold mb-3">
              Resumen del día
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

              {/* Total pedidos */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                <p className="text-xs text-slate-500">Total pedidos</p>
                <p className="text-xl font-bold">
                  {resumen.total_pedidos ?? 0}
                </p>
              </div>

              {/* Total platos vendidos (calculado desde la lista) */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                <p className="text-xs text-slate-500">Total platos vendidos</p>
                <p className="text-xl font-bold">
                  {totalPlatosVendidos}
                </p>
              </div>

              {/* INGRESOS TOTALES = total_general */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                <p className="text-xs text-slate-500">Ingresos totales</p>
                <p className="text-xl font-bold">
                  {formatearMoneda(resumen.total_general)}
                </p>
              </div>

              {/* EFECTIVO = total_efectivo */}
              <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-3">
                <p className="text-xs text-slate-500">Ingresos en efectivo</p>
                <p className="text-xl font-bold">
                  {formatearMoneda(resumen.total_efectivo)}
                </p>
              </div>

              {/* QR = total_qr */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3">
                <p className="text-xs text-slate-500">Ingresos por QR</p>
                <p className="text-xl font-bold">
                  {formatearMoneda(resumen.total_qr)}
                </p>
              </div>

              {/* Pendiente → por ahora 0 (no lo calculas en el backend) */}
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-3">
                <p className="text-xs text-slate-500">Pendiente de pago</p>
                <p className="text-xl font-bold">
                  {formatearMoneda(0)}
                </p>
              </div>
            </div>
          </section>

          {/* ================================
               🔸 TABLA: PLATOS MÁS VENDIDOS
             ================================ */}
          <section>
            <h3 className="text-base md:text-lg font-semibold mb-3">
              Platos más vendidos
            </h3>

            {platos.length === 0 && (
              <p className="text-sm text-slate-500">
                No hay platos vendidos para esta fecha.
              </p>
            )}

            {platos.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">
                        Plato
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-slate-600">
                        Cantidad
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-slate-600">
                        Ingresos
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">
                        % (gráfico)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {platos.map((p) => {
                      const cantidad = Number(p.cantidad_vendida || 0);
                      const ancho = maxCantidadVendida
                        ? Math.max(5, (cantidad / maxCantidadVendida) * 100)
                        : 0;

                      return (
                        <tr
                          key={p.id_plato}
                          className="border-t"
                        >
                          <td className="px-3 py-2">
                            {p.nombre}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {cantidad}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatearMoneda(
                              p.total_vendido ?? 0
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-purple-500"
                                style={{ width: `${ancho}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {!loading && !error && !resumen && (
        <p className="text-sm text-slate-500">
          Selecciona una fecha para ver el reporte.
        </p>
      )}
    </div>
  );
};

export default AdminReportes;
