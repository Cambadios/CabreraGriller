// src/pages/admin/AdminInicio.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getResumenDia } from "../../services/reporteService";
import { motion } from "framer-motion";

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
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

// shadcn/ui
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// icons (lucide)
import {
  TrendingUp,
  UtensilsCrossed,
  ShoppingBag,
  Timer,
  AlertTriangle,
} from "lucide-react";

// 🎨 Colores para gráficos
const COLORS_PAYMENTS = ["#6366F1", "#22C55E"]; // QR, efectivo
const COLORS_BARS = ["#0EA5E9", "#6366F1", "#22C55E", "#F97316", "#EC4899"];

// KPI Card shadcn + animación
const CardResumen = ({ titulo, valor, subtitulo, icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
  >
    <Card className="border-border/60">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardDescription className="text-xs sm:text-sm">
          {titulo}
        </CardDescription>
        {Icon && (
          <div className="rounded-lg bg-muted p-2">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight">
          {valor}
        </div>
        {subtitulo && (
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            {subtitulo}
          </p>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

// Alertas stock bajo
const CardAlerta = ({ titulo, items }) => (
  <Card className="border-amber-200/50 bg-amber-50/40 dark:bg-amber-950/20">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
        <AlertTriangle className="size-4" />
        {titulo}
      </CardTitle>
      <CardDescription className="text-xs text-amber-700/80 dark:text-amber-200/70">
        Revisa inventario para evitar quiebres de stock.
      </CardDescription>
    </CardHeader>

    <CardContent>
      {items.length === 0 ? (
        <p className="text-xs text-amber-700 dark:text-amber-200">
          Todo está bajo control.
        </p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto text-xs sm:text-sm">
          {items.map((plato) => (
            <li key={plato.id_plato} className="flex justify-between gap-2">
              <span className="truncate text-amber-900 dark:text-amber-100">
                {plato.nombre}
              </span>
              <Badge variant="secondary" className="bg-amber-200/60 dark:bg-amber-900/50">
                Stock: {plato.stock_actual}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);

// Tabla compacta últimos pedidos
const TablaUltimosPedidos = ({ pedidos }) => {
  if (!pedidos || pedidos.length === 0) {
    return (
      <p className="text-xs sm:text-sm text-muted-foreground">
        No hay pedidos registrados hoy.
      </p>
    );
  }

  const formatearHora = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs sm:text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border">
            <th className="py-2 pr-3">#</th>
            <th className="py-2 pr-3">Cliente</th>
            <th className="py-2 pr-3">Total</th>
            <th className="py-2 pr-3">Pago</th>
            <th className="py-2 pr-3">Hora</th>
            <th className="py-2 pr-3">Estado</th>
          </tr>
        </thead>

        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id_pedido} className="border-b border-border last:border-0">
              <td className="py-2 pr-3 font-medium">#{p.id_pedido}</td>
              <td className="py-2 pr-3">
                {p.cliente_nombre || "Cliente ocasional"}
              </td>
              <td className="py-2 pr-3 font-semibold">
                Bs. {Number(p.total || 0).toFixed(2)}
              </td>
              <td className="py-2 pr-3">{p.tipo_pago}</td>
              <td className="py-2 pr-3">
                {p.fecha_hora ? formatearHora(p.fecha_hora) : "-"}
              </td>
              <td className="py-2 pr-3">
                <Badge
                  variant="secondary"
                  className={
                    p.estado === "PAGADO"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                      : "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200"
                  }
                >
                  {p.estado}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Semáforo ventas
const SemaforoVentas = ({ ventasHoy, meta }) => {
  const ratio = meta > 0 ? ventasHoy / meta : 0;
  let cls =
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-900/50";
  let texto = "Bajas ventas respecto a la meta";

  if (ratio >= 0.7 && ratio < 1) {
    cls =
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/50";
    texto = "Ventas aceptables, cerca de la meta";
  } else if (ratio >= 1) {
    cls =
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/50";
    texto = "¡Meta superada! Excelente día";
  }

  return (
    <Card className={`border ${cls}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Semáforo de rendimiento
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs sm:text-sm space-y-1">
        <p>
          Ventas hoy: <strong>Bs. {ventasHoy.toFixed(2)}</strong>
        </p>
        <p>
          Meta: <strong>Bs. {meta.toFixed(2)}</strong>
        </p>
        <p className="pt-1">{texto}</p>
      </CardContent>
    </Card>
  );
};

// Heatmap por hora
const HeatmapHoras = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <p className="text-xs sm:text-sm text-muted-foreground">
        No hay suficientes datos para el mapa de calor.
      </p>
    );
  }

  const maxPedidos = Math.max(...data.map((d) => d.pedidos || 0), 1);

  return (
    <div className="space-y-2 max-h-56 overflow-y-auto">
      {data.map((h) => {
        const ancho = `${(100 * (h.pedidos || 0)) / maxPedidos}%`;
        return (
          <div key={h.hora} className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="w-14 text-muted-foreground">{h.hora}</span>
            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="h-4 rounded-full bg-primary/70"
                style={{ width: ancho }}
              />
            </div>
            <span className="w-10 text-right text-muted-foreground">
              {h.pedidos || 0}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Insights
const Insights = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">🧠 Insights del día</CardTitle>
      </CardHeader>
      <CardContent className="text-xs sm:text-sm">
        <ul className="space-y-1 list-disc list-inside text-foreground/90">
          {insights.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

const AdminInicio = () => {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const META_VENTAS_DIA = 1000;

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError("");

        const hoyDate = new Date();
        const hoyStr = hoyDate.toISOString().substring(0, 10);

        // 1) Resumen HOY
        const dataHoy = await getResumenDia(token, hoyStr);
        const resumenHoy = dataHoy.resumen || {};
        const platosHoy = dataHoy.platos || [];

        setPedidosHoy(Number(resumenHoy.total_pedidos || 0));
        setVentasHoy(Number(resumenHoy.total_general || 0));
        setTotalEfectivo(Number(resumenHoy.total_efectivo || 0));
        setTotalQr(Number(resumenHoy.total_qr || 0));

        // Top 5 platos
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

        // 2) Ventas últimos 7 días
        const ventas7 = [];
        let sumaSemanaActual = 0;
        let sumaSemanaAnterior = 0;

        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(hoyDate.getDate() - i);
          const fechaStr = d.toISOString().substring(0, 10);

          const dataDia = await getResumenDia(token, fechaStr);
          const resDia = dataDia.resumen || {};
          const totalDia = Number(resDia.total_general || 0);

          ventas7.push({
            fecha: fechaStr.substring(5),
            total: totalDia,
          });

          sumaSemanaActual += totalDia;
        }

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

        // 3) Platos activos + críticos
        const resPlatos = await fetch(`${API_URL}/api/platos`, {
          headers: getAuthHeaders(token),
        });
        if (!resPlatos.ok) throw new Error("No se pudo obtener la lista de platos");

        const dataPlatos = await resPlatos.json();
        const activos = dataPlatos.filter((p) => p.estado === true);
        setPlatosActivos(activos.length);

        const criticos = activos.filter(
          (p) => typeof p.stock_actual === "number" && p.stock_actual <= 5
        );
        setPlatosStockCritico(criticos);

        // 4) Pedidos del día
        const resPedidos = await fetch(`${API_URL}/api/pedidos?fecha=${hoyStr}`, {
          headers: getAuthHeaders(token),
        });

        if (resPedidos.ok) {
          const dataPedidos = await resPedidos.json();
          const pedidos = Array.isArray(dataPedidos)
            ? dataPedidos
            : dataPedidos.pedidos || [];

          pedidos.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
          setUltimosPedidos(pedidos.slice(0, 5));

          const enCurso = pedidos.filter((p) => p.estado && p.estado !== "PAGADO");
          setPedidosEnCurso(enCurso.length);

          const mapa = new Map();
          pedidos.forEach((p) => {
            if (!p.fecha_hora) return;
            const d = new Date(p.fecha_hora);
            const h = d.getHours();
            const key = `${String(h).padStart(2, "0")}:00`;
            if (!mapa.has(key)) mapa.set(key, { hora: key, pedidos: 0 });
            mapa.get(key).pedidos += 1;
          });

          const heatmapData = Array.from(mapa.values()).sort((a, b) =>
            a.hora.localeCompare(b.hora)
          );
          setHeatmapHoras(heatmapData);
        }

        // 5) Insights
        const nuevosInsights = [];

        if (topPlatos.length > 0) {
          nuevosInsights.push(
            `El plato más vendido hoy es "${topPlatos[0].nombre}" con ${topPlatos[0].cantidad} unidades.`
          );
        }

        if (sumaSemanaAnterior > 0) {
          const diff =
            ((sumaSemanaActual - sumaSemanaAnterior) / sumaSemanaAnterior) * 100;
          const diffRound = Number(diff.toFixed(1));
          nuevosInsights.push(
            diffRound >= 0
              ? `Las ventas de la semana actual están ${diffRound}% por encima de la semana anterior.`
              : `Las ventas de la semana actual están ${Math.abs(diffRound)}% por debajo de la semana anterior.`
          );
        }

        if (totalEfectivo + totalQr > 0) {
          const pctEfectivo =
            (totalEfectivo / (totalEfectivo + totalQr)) * 100 || 0;
          const pctQr = 100 - pctEfectivo;
          nuevosInsights.push(
            `La distribución de cobros hoy es aprox. ${pctEfectivo.toFixed(
              1
            )}% en efectivo y ${pctQr.toFixed(1)}% vía QR.`
          );
        }

        if (criticos.length > 0) {
          nuevosInsights.push(
            `Hay ${criticos.length} platos con stock bajo; conviene revisar inventario.`
          );
        }

        setInsights(nuevosInsights);
      } catch (err) {
        console.error(err);
        setError(err.message || "Ocurrió un error al cargar el resumen");
      } finally {
        setLoading(false);
      }
    };

    if (token) cargarDatos();
  }, [token]);

  const dataPagos = useMemo(() => {
    return [
      { name: "Efectivo", value: totalEfectivo },
      { name: "QR", value: totalQr },
    ].filter((d) => d.value > 0);
  }, [totalEfectivo, totalQr]);

  const diffSemana =
    ventasSemanaAnterior > 0
      ? ((ventasSemanaActual - ventasSemanaAnterior) / ventasSemanaAnterior) * 100
      : 0;

  // ⏳ Loading skeleton
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold">Resumen general</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Cargando datos del día...
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">
          Resumen general
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Panel del día: pedidos, ventas, pagos, platos y actividad.
        </p>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <CardResumen
          titulo="Pedidos de hoy"
          valor={pedidosHoy}
          subtitulo="Total registrados"
          icon={ShoppingBag}
        />
        <CardResumen
          titulo="Ventas de hoy"
          valor={`Bs. ${ventasHoy.toFixed(2)}`}
          subtitulo="Importe cobrado"
          icon={TrendingUp}
        />
        <CardResumen
          titulo="Platos activos"
          valor={platosActivos}
          subtitulo="Disponibles en carta"
          icon={UtensilsCrossed}
        />
        <CardResumen
          titulo="Pedidos en curso"
          valor={pedidosEnCurso}
          subtitulo="Pendientes o preparando"
          icon={Timer}
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ventas 7 días */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">
              Ventas últimos 7 días
            </CardTitle>
            <CardDescription className="text-xs">
              Semana móvil (incluye hoy)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ventasUltimos7.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground">
                No hay datos suficientes.
              </p>
            ) : (
              <div className="h-48 sm:h-56 md:h-64">
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

            <Separator className="my-3" />

            <div className="text-[11px] sm:text-xs text-muted-foreground">
              Semana actual:{" "}
              <strong className="text-foreground">
                Bs. {ventasSemanaActual.toFixed(2)}
              </strong>{" "}
              · Semana anterior:{" "}
              <strong className="text-foreground">
                Bs. {ventasSemanaAnterior.toFixed(2)}
              </strong>{" "}
              {ventasSemanaAnterior > 0 && (
                <span className="ml-1">
                  ({diffSemana >= 0 ? "▲" : "▼"}{" "}
                  {Math.abs(diffSemana).toFixed(1)}%)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagos + semáforo */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">
                Formas de pago hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataPagos.length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Aún no se registraron cobros.
                </p>
              ) : (
                <div className="h-40 sm:h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataPagos}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={65}
                        label={(entry) =>
                          `${entry.name} (${entry.value.toFixed(0)})`
                        }
                      >
                        {dataPagos.map((_, index) => (
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
            </CardContent>
          </Card>

          <SemaforoVentas ventasHoy={ventasHoy} meta={META_VENTAS_DIA} />
        </div>
      </div>

      {/* Segunda fila */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Top platos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">
              Top 5 platos más vendidos
            </CardTitle>
            <CardDescription className="text-xs">
              Ranking del día
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topPlatosHoy.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Aún no hay datos.
              </p>
            ) : (
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPlatosHoy} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nombre" type="category" width={110} />
                    <Tooltip />
                    <Bar dataKey="cantidad">
                      {topPlatosHoy.map((_, index) => (
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
          </CardContent>
        </Card>

        {/* Heatmap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">
              Actividad por hora
            </CardTitle>
            <CardDescription className="text-xs">
              Pedidos de hoy agrupados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HeatmapHoras data={heatmapHoras} />
          </CardContent>
        </Card>

        {/* Alertas + insights */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Alertas rápidas
            </h3>
            <CardAlerta
              titulo="Stock bajo (≤ 5)"
              items={platosStockCritico}
            />
          </div>

          <Insights insights={insights} />
        </div>
      </div>

      {/* Últimos pedidos */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base">
              Últimos pedidos de hoy
            </CardTitle>
            <CardDescription className="text-xs">
              Se muestran los 5 más recientes
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <TablaUltimosPedidos pedidos={ultimosPedidos} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInicio;
