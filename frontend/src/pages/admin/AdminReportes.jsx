// src/pages/admin/AdminReportes.jsx
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getResumenDia } from '../../services/reporteService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

const formatearFechaBonita = (isoDate) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
  });
};

const generarFechasRango = (tipo, fechaBaseStr) => {
  const base = new Date(fechaBaseStr);
  const fechas = [];

  if (tipo === 'dia') return [fechaBaseStr];

  if (tipo === 'semana') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      fechas.push(d.toISOString().substring(0, 10));
    }
    return fechas;
  }

  if (tipo === 'mes') {
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let current = firstDay;

    while (current <= lastDay) {
      fechas.push(current.toISOString().substring(0, 10));
      const next = new Date(current);
      next.setDate(current.getDate() + 1);
      current = next;
    }
    return fechas;
  }

  return [fechaBaseStr];
};

const COLORS_PAYMENTS = ['#22C55E', '#6366F1']; // efectivo, qr
const COLORS_BARS = ['#0EA5E9', '#6366F1', '#22C55E', '#F97316', '#EC4899'];

const AdminReportes = () => {
  const { token } = useAuth();
  const hoy = new Date().toISOString().substring(0, 10);

  const [tipoRango, setTipoRango] = useState('dia');
  const [fechaBase, setFechaBase] = useState(hoy);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // [{ fecha, resumen, platos }]
  const [datosDiarios, setDatosDiarios] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!token || !fechaBase) return;

      try {
        setLoading(true);
        setError('');
        setDatosDiarios([]);

        const fechas = generarFechasRango(tipoRango, fechaBase);
        const resultados = [];

        for (const f of fechas) {
          try {
            const data = await getResumenDia(token, f);
            resultados.push({
              fecha: f,
              resumen: data.resumen || {},
              platos: data.platos || [],
            });
          } catch (e) {
            console.warn(`No se pudo obtener resumen para ${f}`, e);
          }
        }

        setDatosDiarios(resultados);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error al cargar los reportes');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [token, tipoRango, fechaBase]);

  // ✅ Totales del rango
  const totalVentas = datosDiarios.reduce(
    (acc, d) => acc + Number(d.resumen.total_general || 0),
    0
  );
  const totalPedidos = datosDiarios.reduce(
    (acc, d) => acc + Number(d.resumen.total_pedidos || 0),
    0
  );
  const totalEfectivo = datosDiarios.reduce(
    (acc, d) => acc + Number(d.resumen.total_efectivo || 0),
    0
  );
  const totalQr = datosDiarios.reduce(
    (acc, d) => acc + Number(d.resumen.total_qr || 0),
    0
  );

  // ✅ Datos para líneas / barras de pagos por fecha
  const pagosPorDia = datosDiarios.map((d) => ({
    fecha: formatearFechaBonita(d.fecha),
    efectivo: Number(d.resumen.total_efectivo || 0),
    qr: Number(d.resumen.total_qr || 0),
    total: Number(d.resumen.total_general || 0),
  }));

  // ✅ Pie total del rango
  const dataPiePagos = [
    { name: 'Efectivo', value: totalEfectivo },
    { name: 'QR', value: totalQr },
  ].filter((x) => x.value > 0);

  // ✅ Top platos del rango (agregando ventas/cantidades de todos los días)
  const topPlatosRango = useMemo(() => {
    const map = new Map();

    datosDiarios.forEach((dia) => {
      (dia.platos || []).forEach((p) => {
        const nombre = p.nombre;
        const cant = Number(p.cantidad_vendida ?? p.cantidad ?? 0);

        if (!map.has(nombre)) {
          map.set(nombre, 0);
        }
        map.set(nombre, map.get(nombre) + cant);
      });
    });

    const arr = Array.from(map.entries()).map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
    }));

    arr.sort((a, b) => b.cantidad - a.cantidad);

    return arr.slice(0, 5);
  }, [datosDiarios]);

  const platoMasVendido = topPlatosRango[0];

  // Texto rango
  const descripcionRango = (() => {
    if (tipoRango === 'dia') {
      return `Resumen del día ${formatearFechaBonita(fechaBase)}`;
    }
    if (tipoRango === 'semana') {
      const fechas = generarFechasRango(tipoRango, fechaBase);
      if (fechas.length === 0) return '';
      return `Semana: del ${formatearFechaBonita(
        fechas[0]
      )} al ${formatearFechaBonita(fechas[fechas.length - 1])}`;
    }
    if (tipoRango === 'mes') {
      const base = new Date(fechaBase);
      return `Mes completo: ${base.toLocaleDateString('es-BO', {
        month: 'long',
        year: 'numeric',
      })}`;
    }
    return '';
  })();

  return (
    <>
      <h2 className="text-xl md:text-2xl font-bold mb-2">Reportes</h2>
      <p className="text-xs md:text-sm text-slate-600 mb-4">
        Filtra por día, semana o mes para analizar ventas, pedidos, pagos y platos.
      </p>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="block text-xs md:text-sm text-slate-600 mb-1">
            Tipo de rango
          </label>
          <select
            value={tipoRango}
            onChange={(e) => setTipoRango(e.target.value)}
            className="border rounded-lg px-2 py-1 text-xs md:text-sm w-full"
          >
            <option value="dia">Día</option>
            <option value="semana">Semana (últimos 7 días desde la fecha)</option>
            <option value="mes">Mes completo</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs md:text-sm text-slate-600 mb-1">
            Fecha base
          </label>
          <input
            type="date"
            value={fechaBase}
            onChange={(e) => setFechaBase(e.target.value)}
            className="border rounded-lg px-2 py-1 text-xs md:text-sm w-full"
          />
          <p className="text-[10px] md:text-[11px] text-slate-400 mt-1">
            Para "día": se usa esta fecha. Para "semana" y "mes": se toma como referencia.
          </p>
        </div>

        <div className="md:w-48 text-xs md:text-sm text-slate-500">
          {descripcionRango && (
            <div className="bg-slate-50 rounded-lg px-2 py-2 border border-slate-200">
              {descripcionRango}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs md:text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs md:text-sm text-slate-600">Cargando reportes...</p>
        </div>
      ) : (
        <>
          {/* Totales del rango */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs md:text-sm text-slate-500">
                Ventas en el rango
              </p>
              <p className="text-2xl md:text-3xl font-bold mt-1">
                Bs. {totalVentas.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs md:text-sm text-slate-500">
                Pedidos en el rango
              </p>
              <p className="text-2xl md:text-3xl font-bold mt-1">
                {totalPedidos}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs md:text-sm text-slate-500">
                Total en efectivo
              </p>
              <p className="text-2xl md:text-3xl font-bold mt-1">
                Bs. {totalEfectivo.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs md:text-sm text-slate-500">
                Total QR
              </p>
              <p className="text-2xl md:text-3xl font-bold mt-1">
                Bs. {totalQr.toFixed(2)}
              </p>
            </div>
          </div>

          {/* ✅ Grafico 1: Lineas QR vs Efectivo */}
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm md:text-base font-semibold">
                Pagos por día (QR vs Efectivo)
              </h3>
              <span className="text-[11px] md:text-xs text-slate-500">
                Comparación diaria en el rango
              </span>
            </div>

            {pagosPorDia.length === 0 ? (
              <p className="text-xs md:text-sm text-slate-500">
                No hay datos suficientes para el gráfico.
              </p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pagosPorDia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="efectivo"
                      stroke="#22C55E"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Efectivo (Bs.)"
                    />
                    <Line
                      type="monotone"
                      dataKey="qr"
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="QR (Bs.)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ✅ Grafico 2 + Pie: barras apiladas + pie total */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2 bg-white rounded-xl shadow p-4">
              <h3 className="text-sm md:text-base font-semibold mb-2">
                Distribución diaria de pagos (apilado)
              </h3>

              {pagosPorDia.length === 0 ? (
                <p className="text-xs md:text-sm text-slate-500">
                  No hay datos suficientes.
                </p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pagosPorDia}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="efectivo" stackId="a" fill="#22C55E" name="Efectivo" />
                      <Bar dataKey="qr" stackId="a" fill="#6366F1" name="QR" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="lg:col-span-1 bg-white rounded-xl shadow p-4">
              <h3 className="text-sm md:text-base font-semibold mb-2">
                Total del rango (QR vs Efectivo)
              </h3>

              {dataPiePagos.length === 0 ? (
                <p className="text-xs md:text-sm text-slate-500">
                  Sin cobros en el rango.
                </p>
              ) : (
                <div className="h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataPiePagos}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={70}
                        label={(e) => `${e.name}: ${e.value.toFixed(0)}`}
                      >
                        {dataPiePagos.map((entry, i) => (
                          <Cell key={i} fill={COLORS_PAYMENTS[i % COLORS_PAYMENTS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Grafico Top platos rango + destacado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2 bg-white rounded-xl shadow p-4">
              <h3 className="text-sm md:text-base font-semibold mb-2">
                Top 5 platos más vendidos del rango
              </h3>

              {topPlatosRango.length === 0 ? (
                <p className="text-xs md:text-sm text-slate-500">
                  No hay datos de platos vendidos en el rango.
                </p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPlatosRango} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="nombre" type="category" width={110} />
                      <Tooltip />
                      <Bar dataKey="cantidad" name="Cantidad vendida">
                        {topPlatosRango.map((_, i) => (
                          <Cell key={i} fill={COLORS_BARS[i % COLORS_BARS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="lg:col-span-1 bg-white rounded-xl shadow p-4 flex flex-col justify-center">
              <h3 className="text-sm md:text-base font-semibold mb-2">
                🏆 Plato #1 del rango
              </h3>

              {!platoMasVendido ? (
                <p className="text-xs md:text-sm text-slate-500">
                  Sin datos aún.
                </p>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-bold text-indigo-700">
                    {platoMasVendido.nombre}
                  </p>
                  <p className="text-3xl font-extrabold mt-1">
                    {platoMasVendido.cantidad}
                  </p>
                  <p className="text-xs text-slate-500">unidades vendidas</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabla detalle */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-sm md:text-base font-semibold mb-2">
              Detalle diario del rango
            </h3>

            {datosDiarios.length === 0 ? (
              <p className="text-xs md:text-sm text-slate-500">
                No se encontraron datos para el rango seleccionado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs md:text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-1 pr-2">Fecha</th>
                      <th className="py-1 pr-2">Pedidos</th>
                      <th className="py-1 pr-2">Ventas (Bs.)</th>
                      <th className="py-1 pr-2">Efectivo (Bs.)</th>
                      <th className="py-1 pr-2">QR (Bs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosDiarios.map((d) => {
                      const r = d.resumen || {};
                      return (
                        <tr key={d.fecha} className="border-b last:border-0">
                          <td className="py-1 pr-2">
                            {formatearFechaBonita(d.fecha)}
                          </td>
                          <td className="py-1 pr-2">
                            {Number(r.total_pedidos || 0)}
                          </td>
                          <td className="py-1 pr-2">
                            Bs. {Number(r.total_general || 0).toFixed(2)}
                          </td>
                          <td className="py-1 pr-2">
                            Bs. {Number(r.total_efectivo || 0).toFixed(2)}
                          </td>
                          <td className="py-1 pr-2">
                            Bs. {Number(r.total_qr || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default AdminReportes;
