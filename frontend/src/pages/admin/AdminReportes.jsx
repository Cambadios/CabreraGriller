// src/pages/admin/AdminReportes.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getResumenDia } from "../../services/reporteService";

// recharts
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

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// icons
import {
  CalendarDays,
  CalendarRange,
  CalendarCheck2,
  TrendingUp,
  Receipt,
  Banknote,
  QrCode,
  UtensilsCrossed,
  RefreshCcw,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
} from "lucide-react";

/* ---------------- helpers ---------------- */
const fmtCurrency = (n) =>
  `Bs. ${Number(n || 0).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatearFechaBonita = (isoDate) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit" });
};

const formatearFechaLarga = (isoDate) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString("es-BO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const generarFechasRango = (tipo, fechaBaseStr) => {
  const base = new Date(fechaBaseStr);
  const fechas = [];

  if (tipo === "dia") return [fechaBaseStr];

  if (tipo === "semana") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      fechas.push(d.toISOString().substring(0, 10));
    }
    return fechas;
  }

  if (tipo === "mes") {
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let current = firstDay;

    while (current <= lastDay) {
      fechas.push(current.toISOString().substring(0, 10));
      current = new Date(current.setDate(current.getDate() + 1));
    }
    return fechas;
  }

  return [fechaBaseStr];
};

// colores pro (manteniendo tu idea)
const COLORS_PAYMENTS = ["#22C55E", "#6366F1"]; // efectivo, qr
const COLORS_BARS = ["#0EA5E9", "#6366F1", "#22C55E", "#F97316", "#EC4899"];

/* ---------------- tooltips ---------------- */
const TooltipDinero = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
      <p className="font-semibold mb-1">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{p.name}</span>
            <span className="font-semibold">{fmtCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminReportes() {
  const { token } = useAuth();
  const hoy = new Date().toISOString().substring(0, 10);

  const [tipoRango, setTipoRango] = useState("dia");
  const [fechaBase, setFechaBase] = useState(hoy);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // [{ fecha, resumen, platos }]
  const [datosDiarios, setDatosDiarios] = useState([]);

  const cargarDatos = useCallback(async () => {
    if (!token || !fechaBase) return;

    try {
      setLoading(true);
      setError("");
      setDatosDiarios([]);

      const fechas = generarFechasRango(tipoRango, fechaBase);

      // ✅ fetch paralelo y tolerante a fallos
      const settled = await Promise.allSettled(
        fechas.map((f) => getResumenDia(token, f).then((data) => ({
          fecha: f,
          resumen: data.resumen || {},
          platos: data.platos || [],
        })))
      );

      const ok = settled
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);

      setDatosDiarios(ok);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar los reportes");
    } finally {
      setLoading(false);
    }
  }, [token, fechaBase, tipoRango]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  /* ---------------- derived data ---------------- */
  const {
    totalVentas,
    totalPedidos,
    totalEfectivo,
    totalQr,
    promedioVentas,
    promedioPedidos,
  } = useMemo(() => {
    const tv = datosDiarios.reduce(
      (acc, d) => acc + Number(d.resumen.total_general || 0),
      0
    );
    const tp = datosDiarios.reduce(
      (acc, d) => acc + Number(d.resumen.total_pedidos || 0),
      0
    );
    const te = datosDiarios.reduce(
      (acc, d) => acc + Number(d.resumen.total_efectivo || 0),
      0
    );
    const tq = datosDiarios.reduce(
      (acc, d) => acc + Number(d.resumen.total_qr || 0),
      0
    );

    const dias = Math.max(datosDiarios.length, 1);
    return {
      totalVentas: tv,
      totalPedidos: tp,
      totalEfectivo: te,
      totalQr: tq,
      promedioVentas: tv / dias,
      promedioPedidos: tp / dias,
    };
  }, [datosDiarios]);

  // ✅ Línea / barras pagos por fecha
  const pagosPorDia = useMemo(
    () =>
      datosDiarios.map((d) => ({
        fecha: formatearFechaBonita(d.fecha),
        fechaLarga: formatearFechaLarga(d.fecha),
        efectivo: Number(d.resumen.total_efectivo || 0),
        qr: Number(d.resumen.total_qr || 0),
        total: Number(d.resumen.total_general || 0),
      })),
    [datosDiarios]
  );

  // ✅ Pie total del rango
  const dataPiePagos = useMemo(
    () =>
      [
        { name: "Efectivo", value: totalEfectivo },
        { name: "QR", value: totalQr },
      ].filter((x) => x.value > 0),
    [totalEfectivo, totalQr]
  );

  // ✅ Top platos del rango
  const topPlatosRango = useMemo(() => {
    const map = new Map();
    datosDiarios.forEach((dia) => {
      (dia.platos || []).forEach((p) => {
        const nombre = p.nombre;
        const cant = Number(p.cantidad_vendida ?? p.cantidad ?? 0);
        map.set(nombre, (map.get(nombre) || 0) + cant);
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
  const descripcionRango = useMemo(() => {
    if (tipoRango === "dia") {
      return `Resumen del día ${formatearFechaBonita(fechaBase)}`;
    }
    if (tipoRango === "semana") {
      const fechas = generarFechasRango(tipoRango, fechaBase);
      if (!fechas.length) return "";
      return `Semana: ${formatearFechaBonita(fechas[0])} → ${formatearFechaBonita(
        fechas[fechas.length - 1]
      )}`;
    }
    if (tipoRango === "mes") {
      const base = new Date(fechaBase);
      return `Mes: ${base.toLocaleDateString("es-BO", {
        month: "long",
        year: "numeric",
      })}`;
    }
    return "";
  }, [tipoRango, fechaBase]);

  const sinDatos = !loading && datosDiarios.length === 0;

  /* ---------------- UI ---------------- */
  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header + quick actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="size-5 sm:size-6 text-primary" />
            Reportes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Analiza ventas, pedidos, pagos y platos por día, semana o mes.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2">
          <Button
            variant={tipoRango === "dia" && fechaBase === hoy ? "default" : "outline"}
            onClick={() => {
              setTipoRango("dia");
              setFechaBase(hoy);
            }}
            className="gap-2"
          >
            <CalendarCheck2 className="size-4" />
            Hoy
          </Button>
          <Button
            variant={tipoRango === "semana" && fechaBase === hoy ? "default" : "outline"}
            onClick={() => {
              setTipoRango("semana");
              setFechaBase(hoy);
            }}
            className="gap-2"
          >
            <CalendarRange className="size-4" />
            Últimos 7 días
          </Button>
          <Button
            variant={tipoRango === "mes" && fechaBase === hoy ? "default" : "outline"}
            onClick={() => {
              setTipoRango("mes");
              setFechaBase(hoy);
            }}
            className="gap-2 col-span-2 sm:col-span-1"
          >
            <CalendarDays className="size-4" />
            Mes actual
          </Button>
          <Button
            variant="ghost"
            onClick={cargarDatos}
            className="gap-2 col-span-2 sm:col-span-1"
          >
            <RefreshCcw className="size-4" />
            Recargar
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Selecciona rango y fecha base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="grid gap-2">
              <label className="text-xs sm:text-sm text-muted-foreground">
                Tipo de rango
              </label>
              <Select value={tipoRango} onValueChange={setTipoRango}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de rango" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dia">Día</SelectItem>
                  <SelectItem value="semana">Semana (7 días)</SelectItem>
                  <SelectItem value="mes">Mes completo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-xs sm:text-sm text-muted-foreground">
                Fecha base
              </label>
              <Input
                type="date"
                value={fechaBase}
                onChange={(e) => setFechaBase(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Día: esa fecha. Semana/Mes: se toma como referencia.
              </p>
            </div>

            <div className="md:text-right text-xs sm:text-sm">
              {descripcionRango && (
                <div className="inline-flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                  <Badge variant="secondary" className="text-[10px]">
                    Rango
                  </Badge>
                  <span>{descripcionRango}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
          <Skeleton className="h-64 rounded-xl sm:col-span-2 lg:col-span-3" />
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        </div>
      )}

      {/* Empty state */}
      {sinDatos && (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center text-muted-foreground text-sm space-y-2">
            <Sparkles className="mx-auto size-8 opacity-50" />
            <p>No se encontraron datos para el rango seleccionado.</p>
            <Button
              variant="outline"
              onClick={() => {
                setTipoRango("dia");
                setFechaBase(hoy);
              }}
            >
              Volver a hoy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CONTENT */}
      {!loading && !sinDatos && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="size-4" /> Ventas totales
                </p>
                <p className="text-2xl font-bold mt-1">{fmtCurrency(totalVentas)}</p>
                <p className="text-[11px] text-muted-foreground">
                  Promedio/día: {fmtCurrency(promedioVentas)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Receipt className="size-4" /> Pedidos totales
                </p>
                <p className="text-2xl font-bold mt-1">{totalPedidos}</p>
                <p className="text-[11px] text-muted-foreground">
                  Promedio/día: {promedioPedidos.toFixed(1)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Banknote className="size-4" /> Efectivo
                </p>
                <p className="text-2xl font-bold mt-1">{fmtCurrency(totalEfectivo)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {totalVentas > 0
                    ? `${((totalEfectivo / totalVentas) * 100).toFixed(1)}% del total`
                    : "0% del total"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <QrCode className="size-4" /> QR
                </p>
                <p className="text-2xl font-bold mt-1">{fmtCurrency(totalQr)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {totalVentas > 0
                    ? `${((totalQr / totalVentas) * 100).toFixed(1)}% del total`
                    : "0% del total"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <UtensilsCrossed className="size-4" /> Plato top
                </p>
                {!platoMasVendido ? (
                  <p className="text-sm text-muted-foreground mt-2">Sin datos</p>
                ) : (
                  <>
                    <p className="font-semibold mt-1 line-clamp-1">
                      {platoMasVendido.nombre}
                    </p>
                    <p className="text-2xl font-bold">
                      {platoMasVendido.cantidad} uds.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Línea pagos por día */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  Pagos por día (QR vs Efectivo)
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Comparación diaria dentro del rango.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {pagosPorDia.length} días
              </Badge>
            </CardHeader>
            <CardContent>
              {pagosPorDia.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay datos suficientes para este gráfico.
                </p>
              ) : (
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pagosPorDia}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip content={<TooltipDinero />} />
                      <Line
                        type="monotone"
                        dataKey="efectivo"
                        stroke="#22C55E"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Efectivo"
                      />
                      <Line
                        type="monotone"
                        dataKey="qr"
                        stroke="#6366F1"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="QR"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Barras apiladas + Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card className="lg:col-span-2 border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Distribución diaria de pagos (apilado)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pagosPorDia.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin datos disponibles.
                  </p>
                ) : (
                  <div className="h-56 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pagosPorDia}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip content={<TooltipDinero />} />
                        <Legend />
                        <Bar dataKey="efectivo" stackId="a" fill="#22C55E" name="Efectivo" />
                        <Bar dataKey="qr" stackId="a" fill="#6366F1" name="QR" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieIcon className="size-4 text-primary" />
                  Total del rango
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dataPiePagos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin cobros en el rango.
                  </p>
                ) : (
                  <div className="h-56 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dataPiePagos}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={80}
                          label={(e) => `${e.name}: ${fmtCurrency(e.value)}`}
                        >
                          {dataPiePagos.map((_, i) => (
                            <Cell
                              key={i}
                              fill={COLORS_PAYMENTS[i % COLORS_PAYMENTS.length]}
                            />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip content={<TooltipDinero />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top platos + destacado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card className="lg:col-span-2 border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Top 5 platos más vendidos del rango
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topPlatosRango.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay datos de platos vendidos.
                  </p>
                ) : (
                  <div className="h-56 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topPlatosRango} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="nombre" type="category" width={120} />
                        <Tooltip />
                        <Bar dataKey="cantidad" name="Cantidad vendida">
                          {topPlatosRango.map((_, i) => (
                            <Cell
                              key={i}
                              fill={COLORS_BARS[i % COLORS_BARS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 flex flex-col justify-center">
              <CardContent className="p-5 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                  <UtensilsCrossed className="size-4" />
                  Plato #1 del rango
                </div>

                {!platoMasVendido ? (
                  <p className="text-sm text-muted-foreground">Sin datos aún.</p>
                ) : (
                  <>
                    <p className="text-lg font-bold text-primary line-clamp-2">
                      {platoMasVendido.nombre}
                    </p>
                    <p className="text-4xl font-extrabold">
                      {platoMasVendido.cantidad}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      unidades vendidas
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detalle diario */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Detalle diario del rango
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Resumen por día (ventas y formas de pago).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop table */}
              <div className="hidden md:block rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Pedidos</TableHead>
                      <TableHead>Ventas</TableHead>
                      <TableHead>Efectivo</TableHead>
                      <TableHead>QR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datosDiarios.map((d) => {
                      const r = d.resumen || {};
                      return (
                        <TableRow key={d.fecha} className="hover:bg-accent/40">
                          <TableCell>{formatearFechaLarga(d.fecha)}</TableCell>
                          <TableCell>{Number(r.total_pedidos || 0)}</TableCell>
                          <TableCell className="font-semibold">
                            {fmtCurrency(r.total_general)}
                          </TableCell>
                          <TableCell>{fmtCurrency(r.total_efectivo)}</TableCell>
                          <TableCell>{fmtCurrency(r.total_qr)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {datosDiarios.map((d) => {
                  const r = d.resumen || {};
                  return (
                    <Card key={d.fecha} className="border-border/60">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">
                            {formatearFechaLarga(d.fecha)}
                          </p>
                          <Badge variant="secondary" className="text-[10px]">
                            {Number(r.total_pedidos || 0)} pedidos
                          </Badge>
                        </div>

                        <Separator />

                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ventas</span>
                            <span className="font-semibold">
                              {fmtCurrency(r.total_general)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Efectivo</span>
                            <span>{fmtCurrency(r.total_efectivo)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">QR</span>
                            <span>{fmtCurrency(r.total_qr)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
