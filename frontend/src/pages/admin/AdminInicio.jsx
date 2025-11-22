// src/pages/admin/AdminInicio.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getResumenDia } from '../../services/reporteService';
import { motion } from 'framer-motion';
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

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

// 🎨 Colores para gráficos
const COLORS_PAYMENTS = ['#6366F1', '#22C55E']; // QR, efectivo
const COLORS_BARS = ['#0EA5E9', '#6366F1', '#22C55E', '#F97316', '#EC4899'];

// Tarjeta simple de resumen (con animación)
const CardResumen = ({ titulo, valor, subtitulo }) => (
  <motion.div
    className="bg-white rounded-xl shadow p-4 flex flex-col justify-between"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div>
      <p className="text-xs md:text-sm text-slate-500">{titulo}</p>
      <p className="text-2xl md:text-3xl font-bold mt-1">{valor}</p>
    </div>
    {subtitulo && (
      <p className="text-[11px] md:text-xs text-slate-400 mt-2">{subtitulo}</p>
    )}
  </motion.div>
);

// Tarjeta de alerta (stock bajo, etc.)
const CardAlerta = ({ titulo, items }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-xl shadow p-4">
    <p className="text-xs md:text-sm font-semibold text-amber-700">⚠ {titulo}</p>
    {items.length === 0 ? (
      <p className="text-xs md:text-sm text-amber-700 mt-1">
        Todo está bajo control.
      </p>
    ) : (
      <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto text-xs md:text-sm text-amber-800">
        {items.map((plato) => (
          <li key={plato.id_plato} className="flex justify-between gap-2">
            <span className="truncate">{plato.nombre}</span>
            <span className="font-semibold">Stock: {plato.stock_actual}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

// Tabla compacta de pedidos (últimos del día)
const TablaUltimosPedidos = ({ pedidos }) => {
  if (!pedidos || pedidos.length === 0) {
    return (
      <p className="text-xs md:text-sm text-slate-500">
        No hay pedidos registrados hoy.
      </p>
    );
  }

  const formatearHora = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('es-BO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs md:text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b">
            <th className="py-1 pr-2">#</th>
            <th className="py-1 pr-2">Cliente</th>
            <th className="py-1 pr-2">Total</th>
            <th className="py-1 pr-2">Pago</th>
            <th className="py-1 pr-2">Hora</th>
            <th className="py-1 pr-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id_pedido} className="border-b last:border-0">
              <td className="py-1 pr-2">{p.id_pedido}</td>
              <td className="py-1 pr-2">
                {p.cliente_nombre || 'Cliente ocasional'}
              </td>
              <td className="py-1 pr-2 font-semibold">
                Bs. {Number(p.total || 0).toFixed(2)}
              </td>
              <td className="py-1 pr-2">{p.tipo_pago}</td>
              <td className="py-1 pr-2">
                {p.fecha_hora ? formatearHora(p.fecha_hora) : '-'}
              </td>
              <td className="py-1 pr-2">
                <span
                  className={`px-2 py-[2px] rounded-full text-[10px] md:text-[11px] ${
                    p.estado === 'PAGADO'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {p.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Semáforo de rendimiento diario
const SemaforoVentas = ({ ventasHoy, meta }) => {
  const ratio = meta > 0 ? ventasHoy / meta : 0;
  let color = 'bg-red-100 text-red-700 border-red-200';
  let texto = 'Bajas ventas respecto a la meta';

  if (ratio >= 0.7 && ratio < 1) {
    color = 'bg-amber-100 text-amber-700 border-amber-200';
    texto = 'Ventas aceptables, cerca de la meta';
  } else if (ratio >= 1) {
    color = 'bg-emerald-100 text-emerald-700 border-emerald-200';
    texto = '¡Meta superada! Excelente día';
  }

  return (
    <div className={`rounded-xl border px-3 py-2 text-xs md:text-sm ${color}`}>
      <p className="font-semibold mb-1">Semáforo de rendimiento</p>
      <p>
        Ventas de hoy: <strong>Bs. {ventasHoy.toFixed(2)}</strong> / Meta:{' '}
        <strong>Bs. {meta.toFixed(2)}</strong>
      </p>
      <p className="mt-1">{texto}</p>
    </div>
  );
};

// Heatmap simple por hora (lista visual)
const HeatmapHoras = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <p className="text-xs md:text-sm text-slate-500">
        No hay suficientes datos para el mapa de calor.
      </p>
    );
  }

  const maxPedidos = Math.max(...data.map((d) => d.pedidos || 0), 1);

  return (
    <div className="space-y-1 max-h-56 overflow-y-auto">
      {data.map((h) => {
        const ancho = `${(100 * (h.pedidos || 0)) / maxPedidos}%`;
        return (
          <div key={h.hora} className="flex items-center gap-2 text-xs md:text-sm">
            <span className="w-14 text-slate-500">{h.hora}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-4 rounded-full bg-indigo-400"
                style={{ width: ancho }}
              />
            </div>
            <span className="w-10 text-right text-slate-600">
              {h.pedidos || 0}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Insights básicos
const Insights = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow p-4 text-xs md:text-sm">
      <p className="font-semibold mb-2">🧠 Insights del día</p>
      <ul className="space-y-1 list-disc list-inside text-slate-700">
        {insights.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  );
};

const AdminInicio = () => {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pedidosHoy, setPedidosHoy] = useState(0);
  const [ventasHoy, setVentasHoy] = useState(0);
  const [platosActivos, setPlatosActivos] = useState(0);
  const [pedidosEnCurso, setPedidosEnCurso] = useState(0);

  const [totalEfectivo, setTotalEfectivo] = useState(0);
  const [totalQr, setTotalQr] = useState(0);

  const [platosStockCritico, setPlatosStockCritico] = useState([]);
  const [ultimosPedidos, setUltimosPedidos] = useState([]);

  const [ventasUltimos7, setVentasUltimos7] = useState([]);
  const [ventasSemanaActual, setVentasSemanaActual] = useState(0);
  const [ventasSemanaAnterior, setVentasSemanaAnterior] = useState(0);

  const [topPlatosHoy, setTopPlatosHoy] = useState([]);
  const [heatmapHoras, setHeatmapHoras] = useState([]);
  const [insights, setInsights] = useState([]);

  const META_VENTAS_DIA = 1000; // puedes ajustar esta meta

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError('');

        const hoyDate = new Date();
        const hoyStr = hoyDate.toISOString().substring(0, 10); // YYYY-MM-DD

        // 1️⃣ Resumen de HOY
        const dataHoy = await getResumenDia(token, hoyStr);
        console.log('🔍 Resumen HOY (AdminInicio):', dataHoy);

        const resumenHoy = dataHoy.resumen || {};
        const platosHoy = dataHoy.platos || [];

        setPedidosHoy(Number(resumenHoy.total_pedidos || 0));
        setVentasHoy(Number(resumenHoy.total_general || 0));
        setTotalEfectivo(Number(resumenHoy.total_efectivo || 0));
        setTotalQr(Number(resumenHoy.total_qr || 0));

        // Top 5 platos más vendidos del día
        const topPlatos = [...platosHoy]
          .sort(
            (a, b) =>
              Number(b.cantidad_vendida ?? b.cantidad ?? 0) -
              Number(a.cantidad_vendida ?? a.cantidad ?? 0)
          )
          .slice(0, 5)
          .map((p) => ({
            nombre: p.nombre,
            cantidad: Number(p.cantidad_vendida ?? p.cantidad ?? 0),
          }));
        setTopPlatosHoy(topPlatos);

        // 2️⃣ Ventas últimos 7 días (incluye hoy) usando el mismo endpoint
        const ventas7 = [];
        let sumaSemanaActual = 0;
        let sumaSemanaAnterior = 0;

        // Últimos 7 días (semana actual "móvil")
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(hoyDate.getDate() - i);
          const fechaStr = d.toISOString().substring(0, 10);

          const dataDia = await getResumenDia(token, fechaStr);
          const resDia = dataDia.resumen || {};
          const totalDia = Number(resDia.total_general || 0);

          ventas7.push({
            fecha: fechaStr.substring(5), // MM-DD
            total: totalDia,
          });

          sumaSemanaActual += totalDia;
        }

        // Semana anterior (7 días antes de esos)
        for (let i = 7; i <= 13; i++) {
          const d = new Date();
          d.setDate(hoyDate.getDate() - i);
          const fechaStr = d.toISOString().substring(0, 10);

          const dataDia = await getResumenDia(token, fechaStr);
          const resDia = dataDia.resumen || {};
          const totalDia = Number(resDia.total_general || 0);

          sumaSemanaAnterior += totalDia;
        }

        setVentasUltimos7(ventas7);
        setVentasSemanaActual(sumaSemanaActual);
        setVentasSemanaAnterior(sumaSemanaAnterior);

        // 3️⃣ Platos (activos + stock crítico)
        const resPlatos = await fetch(`${API_URL}/api/platos`, {
          headers: getAuthHeaders(token),
        });

        if (!resPlatos.ok) {
          throw new Error('No se pudo obtener la lista de platos');
        }

        const dataPlatos = await resPlatos.json();
        const activos = dataPlatos.filter((p) => p.estado === true);
        setPlatosActivos(activos.length);

        const criticos = activos.filter(
          (p) => typeof p.stock_actual === 'number' && p.stock_actual <= 5
        );
        setPlatosStockCritico(criticos);

        // 4️⃣ Pedidos del día (para ultimos pedidos + heatmap + en curso)
        const resPedidos = await fetch(`${API_URL}/api/pedidos?fecha=${hoyStr}`, {
          headers: getAuthHeaders(token),
        });

        if (resPedidos.ok) {
          const dataPedidos = await resPedidos.json();
          const pedidos = Array.isArray(dataPedidos)
            ? dataPedidos
            : dataPedidos.pedidos || [];

          // ordenar por hora desc
          pedidos.sort(
            (a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora)
          );
          setUltimosPedidos(pedidos.slice(0, 5));

          const enCurso = pedidos.filter(
            (p) => p.estado && p.estado !== 'PAGADO'
          );
          setPedidosEnCurso(enCurso.length);

          // Heatmap por hora
          const mapa = new Map();
          pedidos.forEach((p) => {
            if (!p.fecha_hora) return;
            const d = new Date(p.fecha_hora);
            const h = d.getHours();
            const key = `${String(h).padStart(2, '0')}:00`;
            if (!mapa.has(key)) {
              mapa.set(key, { hora: key, pedidos: 0 });
            }
            mapa.get(key).pedidos += 1;
          });

          const heatmapData = Array.from(mapa.values()).sort((a, b) =>
            a.hora.localeCompare(b.hora)
          );
          setHeatmapHoras(heatmapData);
        } else {
          console.warn('No se pudo obtener los pedidos del día');
        }

        // 5️⃣ Generar insights
        const nuevosInsights = [];

        if (topPlatos.length > 0) {
          nuevosInsights.push(
            `El plato más vendido hoy es "${topPlatos[0].nombre}" con ${topPlatos[0].cantidad} unidades.`
          );
        }

        if (ventasSemanaAnterior > 0) {
          const diff =
            ((ventasSemanaActual - ventasSemanaAnterior) / ventasSemanaAnterior) *
            100;
          const diffRound = Number(diff.toFixed(1));
          if (diffRound > 0) {
            nuevosInsights.push(
              `Las ventas de la semana actual están ${diffRound}% por encima de la semana anterior.`
            );
          } else if (diffRound < 0) {
            nuevosInsights.push(
              `Las ventas de la semana actual están ${Math.abs(
                diffRound
              )}% por debajo de la semana anterior.`
            );
          }
        }

        if (totalEfectivo + totalQr > 0) {
          const pctEfectivo =
            (totalEfectivo / (totalEfectivo + totalQr)) * 100 || 0;
          const pctQr = 100 - pctEfectivo;
          nuevosInsights.push(
            `La distribución de cobros hoy es aproximadamente ${pctEfectivo.toFixed(
              1
            )}% en efectivo y ${pctQr.toFixed(1)}% vía QR.`
          );
        }

        if (criticos.length > 0) {
          nuevosInsights.push(
            `Hay ${criticos.length} platos con stock bajo; conviene revisar inventario o compras.`
          );
        }

        setInsights(nuevosInsights);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Ocurrió un error al cargar el resumen');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      cargarDatos();
    }
  }, [token]);

  // ⏳ Estado de carga
  if (loading) {
    return (
      <>
        <h2 className="text-xl md:text-2xl font-bold mb-2">Resumen general</h2>
        <p className="text-xs md:text-sm text-slate-600 mb-4">
          Cargando datos del día...
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow p-4 animate-pulse"
            >
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-6 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </>
    );
  }

  // 📊 Datos para gráfico de formas de pago
  const dataPagos = [
    { name: 'Efectivo', value: totalEfectivo },
    { name: 'QR', value: totalQr },
  ].filter((d) => d.value > 0);

  const diffSemana =
    ventasSemanaAnterior > 0
      ? ((ventasSemanaActual - ventasSemanaAnterior) / ventasSemanaAnterior) *
        100
      : 0;

  return (
    <>
      <h2 className="text-xl md:text-2xl font-bold mb-2">Resumen general</h2>
      <p className="text-xs md:text-sm text-slate-600 mb-4">
        Panel general del día: pedidos, ventas, formas de pago, platos y
        actividad del local.
      </p>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs md:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        <CardResumen
          titulo="Pedidos de hoy"
          valor={pedidosHoy}
          subtitulo="Total de pedidos registrados"
        />
        <CardResumen
          titulo="Ventas de hoy"
          valor={`Bs. ${ventasHoy.toFixed(2)}`}
          subtitulo="Importe cobrado (todas las formas de pago)"
        />
        <CardResumen
          titulo="Platos activos"
          valor={platosActivos}
          subtitulo="Platos disponibles en carta"
        />
        <CardResumen
          titulo="Pedidos en curso"
          valor={pedidosEnCurso}
          subtitulo="Pendientes de pago o preparación"
        />
      </div>

      {/* Gráficos principales */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ventas últimos 7 días */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm md:text-base font-semibold">
              Ventas de los últimos 7 días
            </h3>
            <span className="text-[11px] md:text-xs text-slate-500">
              Semana móvil (incluye hoy)
            </span>
          </div>
          {ventasUltimos7.length === 0 ? (
            <p className="text-xs md:text-sm text-slate-500">
              No hay datos suficientes para el gráfico.
            </p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ventasUltimos7}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 text-[11px] md:text-xs text-slate-600">
            Ventas semana actual: <strong>Bs. {ventasSemanaActual.toFixed(2)}</strong>{' '}
            | semana anterior:{' '}
            <strong>Bs. {ventasSemanaAnterior.toFixed(2)}</strong>{' '}
            {ventasSemanaAnterior > 0 && (
              <span>
                (
                {diffSemana >= 0 ? '▲' : '▼'} {Math.abs(diffSemana).toFixed(1)}
                %)
              </span>
            )}
          </div>
        </div>

        {/* Formas de pago + semáforo */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-sm md:text-base font-semibold mb-2">
              Formas de pago hoy
            </h3>
            {dataPagos.length === 0 ? (
              <p className="text-xs md:text-sm text-slate-500">
                Aún no se registraron cobros hoy.
              </p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataPagos}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={70}
                      label={(entry) =>
                        `${entry.name} (${entry.value.toFixed(0)})`
                      }
                    >
                      {dataPagos.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS_PAYMENTS[index % COLORS_PAYMENTS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <SemaforoVentas ventasHoy={ventasHoy} meta={META_VENTAS_DIA} />
        </div>
      </div>

      {/* Segunda fila: top platos + heatmap + alerts/insights */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Top platos */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow p-4">
          <h3 className="text-sm md:text-base font-semibold mb-2">
            Top 5 platos más vendidos hoy
          </h3>
          {topPlatosHoy.length === 0 ? (
            <p className="text-xs md:text-sm text-slate-500">
              Aún no hay datos de platos vendidos hoy.
            </p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPlatosHoy} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nombre" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="cantidad">
                    {topPlatosHoy.map((entry, index) => (
                      <Cell
                        key={`cell-bar-${index}`}
                        fill={COLORS_BARS[index % COLORS_BARS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Heatmap de horas */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow p-4">
          <h3 className="text-sm md:text-base font-semibold mb-2">
            Actividad por hora (hoy)
          </h3>
          <HeatmapHoras data={heatmapHoras} />
        </div>

        {/* Alertas + insights */}
        <div className="xl:col-span-1 space-y-3">
          <div>
            <h3 className="text-sm md:text-base font-semibold mb-2">
              Alertas rápidas
            </h3>
            <CardAlerta
              titulo="Platos con stock bajo (≤ 5)"
              items={platosStockCritico}
            />
          </div>
          <Insights insights={insights} />
        </div>
      </div>

      {/* Últimos pedidos */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm md:text-base font-semibold">
            Últimos pedidos de hoy
          </h3>
          <span className="text-[11px] md:text-xs text-slate-500">
            Solo se muestran los 5 más recientes
          </span>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <TablaUltimosPedidos pedidos={ultimosPedidos} />
        </div>
      </div>
    </>
  );
};

export default AdminInicio;
