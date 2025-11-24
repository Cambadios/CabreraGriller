// src/pages/cajero/CajeroInicio.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getResumenCajeroHoy } from "../../services/reporteService";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "@/components/ui/table";

// icons
import {
  RefreshCw,
  Wallet,
  QrCode,
  ReceiptText,
  TrendingUp,
  Clock3,
  User,
  UtensilsCrossed,
} from "lucide-react";

const formatearHora = (fechaHora) => {
  if (!fechaHora) return "—";
  const d = new Date(fechaHora);
  return d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
};

const CajeroInicio = () => {
  const { usuario, token } = useAuth();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
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
      setError("");
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
      setError(err.message || "No se pudo cargar el resumen del día");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (token) cargarResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const {
    total_dia,
    total_tickets,
    total_efectivo,
    total_qr,
    ultimos_pedidos,
  } = resumen;

  const porcentajeEfectivo = useMemo(() => {
    const total = Number(total_efectivo || 0) + Number(total_qr || 0);
    if (total <= 0) return 0;
    return Math.round((Number(total_efectivo || 0) / total) * 100);
  }, [total_efectivo, total_qr]);

  const porcentajeQr = 100 - porcentajeEfectivo;

  const badgePago = (tipo) => {
    if (tipo === "EFECTIVO")
      return (
        <Badge variant="outline" className="gap-1">
          <Wallet className="size-3" /> Efectivo
        </Badge>
      );
    if (tipo === "QR")
      return (
        <Badge variant="outline" className="gap-1">
          <QrCode className="size-3" /> QR
        </Badge>
      );
    return <Badge variant="secondary">—</Badge>;
  };

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="size-5 sm:size-6 text-primary" />
            Resumen del Cajero
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Ventas y tickets del día de hoy.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="size-3" />
            Cajero:{" "}
            <span className="font-semibold text-foreground">
              {usuario?.nombre_completo || "—"}
            </span>
          </p>
        </div>

        <Button
          onClick={cargarResumen}
          variant="outline"
          size="sm"
          className="gap-2 w-full md:w-auto"
          disabled={cargando}
        >
          <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} />
          {cargando ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cards resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Total del día</CardDescription>
            {cargando ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-300">
                Bs. {Number(total_dia || 0).toFixed(2)}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
            <ReceiptText className="size-4" />
            Ingresos acumulados hoy
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Tickets emitidos</CardDescription>
            {cargando ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <CardTitle className="text-2xl">
                {Number(total_tickets || 0)}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
            <ReceiptText className="size-4" />
            Pedidos registrados
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Cobrado en efectivo</CardDescription>
            {cargando ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-300">
                Bs. {Number(total_efectivo || 0).toFixed(2)}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
            <Wallet className="size-4" />
            {porcentajeEfectivo}% del total
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Cobrado por QR</CardDescription>
            {cargando ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-300">
                Bs. {Number(total_qr || 0).toFixed(2)}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
            <QrCode className="size-4" />
            {porcentajeQr}% del total
          </CardContent>
        </Card>
      </div>

      {/* Distribución Efectivo vs QR */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Distribución de pagos</CardTitle>
          <CardDescription className="text-xs">
            Porcentaje de ventas por método de pago.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {cargando ? (
            <Skeleton className="h-3 w-full" />
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Wallet className="size-3" /> Efectivo
                </span>
                <span className="font-semibold">{porcentajeEfectivo}%</span>
              </div>
              <Progress value={porcentajeEfectivo} />

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="flex items-center gap-1">
                  <QrCode className="size-3" /> QR
                </span>
                <span className="font-semibold">{porcentajeQr}%</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Últimos pedidos */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Últimos pedidos</CardTitle>
            <CardDescription className="text-xs">
              {ultimos_pedidos.length} registro(s)
            </CardDescription>
          </div>

          <Badge variant="secondary" className="text-[11px]">
            Hoy
          </Badge>
        </CardHeader>

        <CardContent>
          {cargando ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : ultimos_pedidos.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No hay pedidos registrados para hoy.
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {ultimos_pedidos.map((p) => (
                  <Card key={p.id_pedido} className="border-border/60">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">
                          Pedido #{p.id_pedido}
                        </p>
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <Clock3 className="size-3" />
                          {formatearHora(p.fecha_hora)}
                        </Badge>
                      </div>

                      <Separator />

                      <div className="text-xs space-y-1">
                        <p>
                          <span className="text-muted-foreground">Cliente: </span>
                          {p.cliente || "Anónimo"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Servicio: </span>
                          {p.tipo_entrega === "MESA"
                            ? "En mesa"
                            : p.tipo_entrega === "LLEVAR"
                            ? "Para llevar"
                            : p.tipo_entrega || "—"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {badgePago(p.tipo_pago)}
                        <p className="text-sm font-semibold">
                          Bs. {Number(p.total || 0).toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-center">Servicio</TableHead>
                      <TableHead className="text-center">Pago</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ultimos_pedidos.map((p) => (
                      <TableRow key={p.id_pedido} className="hover:bg-accent/30">
                        <TableCell>{formatearHora(p.fecha_hora)}</TableCell>
                        <TableCell>{p.cliente || "Anónimo"}</TableCell>
                        <TableCell className="text-center">
                          {p.tipo_entrega === "MESA"
                            ? "En mesa"
                            : p.tipo_entrega === "LLEVAR"
                            ? "Para llevar"
                            : p.tipo_entrega || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {badgePago(p.tipo_pago)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          Bs. {Number(p.total || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CajeroInicio;
