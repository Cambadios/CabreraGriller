// src/pages/admin/AdminPedidos.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import { getPedidosPorFecha } from "../../services/pedidoService";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

// Table shadcn
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// utils
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// icons
import {
  CalendarDays,
  ClipboardList,
  Search,
  Receipt,
  Coins,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

const formatearFecha = (date) => date.toISOString().substring(0, 10);

const AdminPedidos = () => {
  const { token } = useAuth();

  const [fecha, setFecha] = useState(() => new Date());
  const [openCalendar, setOpenCalendar] = useState(false);

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [totalDia, setTotalDia] = useState(0);

  const fechaStr = useMemo(() => formatearFecha(fecha), [fecha]);

  const cargarPedidos = async (fStr) => {
    try {
      setCargando(true);
      setError("");
      const data = await getPedidosPorFecha(token, fStr);
      const lista = data || [];
      setPedidos(lista);

      const suma = lista.reduce((acc, p) => acc + Number(p.total || 0), 0);
      setTotalDia(suma);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar pedidos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos(fechaStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSocket(token, {
    "pedido:nuevo": () => cargarPedidos(fechaStr),
    "pedido:actualizado": () => cargarPedidos(fechaStr),
    "pedido:pagado": () => cargarPedidos(fechaStr),
    "admin:refresh": (p) => {
      if (p?.tipo === "pedidos" || p?.tipo === "resumenDia") {
        cargarPedidos(fechaStr);
      }
    },
  });

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarPedidos(fechaStr);
  };

  const pedidosCount = pedidos.length;

  const promedioPedido = useMemo(() => {
    if (pedidosCount === 0) return 0;
    return totalDia / pedidosCount;
  }, [totalDia, pedidosCount]);

  const formatearHora = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toTimeString().substring(0, 5);
  };

  const badgeEntrega = (tipo) => {
    const base = "rounded-md px-2 py-0.5 text-xs font-medium";
    if (tipo === "MESA") return <Badge className={base}>Mesa</Badge>;
    if (tipo === "LLEVAR")
      return (
        <Badge variant="secondary" className={base}>
          Llevar
        </Badge>
      );
    return (
      <Badge variant="outline" className={base}>
        {tipo}
      </Badge>
    );
  };

  const badgePago = (tipo) => {
    const base = "rounded-md px-2 py-0.5 text-xs font-medium";
    if (tipo === "EFECTIVO")
      return (
        <Badge
          className={cn(
            base,
            "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
          )}
        >
          Efectivo
        </Badge>
      );
    if (tipo === "QR")
      return (
        <Badge
          className={cn(
            base,
            "bg-indigo-600/10 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
          )}
        >
          QR
        </Badge>
      );
    return (
      <Badge variant="outline" className={base}>
        {tipo}
      </Badge>
    );
  };

  // ✅ Presets rápidos
  const setPresetHoy = () => setFecha(new Date());

  const setPresetAyer = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setFecha(d);
  };

  const setPresetUltimos7 = () => {
    const d = new Date();
    d.setDate(d.getDate() - 6); // incluye hoy = 7 días
    setFecha(d);
  };

  const setPresetInicioMes = () => {
    const d = new Date();
    d.setDate(1);
    setFecha(d);
  };

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="size-5 sm:size-6 text-primary" />
            Pedidos por fecha
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Revisa el detalle de pedidos y ventas de cualquier día.
          </p>
        </div>
      </div>

      {/* Filtro */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-4">
          <form
            onSubmit={handleBuscar}
            className="flex flex-col sm:flex-row gap-3 sm:items-end"
          >
            <div className="w-full sm:w-auto">
              <label className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-1">
                <CalendarDays className="size-4 text-muted-foreground" />
                Fecha
              </label>

              {/* ✅ DatePicker SHADCN mejorado */}
              <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-64 justify-start text-left font-normal",
                      "bg-background hover:bg-accent/40 shadow-sm",
                      !fecha && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 size-4 opacity-70" />
                    {fecha ? (
                      <span className="truncate">
                        {format(fecha, "PPP", { locale: es })}
                      </span>
                    ) : (
                      <span>Selecciona fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-auto p-3 space-y-3"
                  align="start"
                >
                  {/* Presets */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={setPresetHoy}
                    >
                      Hoy
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={setPresetAyer}
                    >
                      Ayer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={setPresetUltimos7}
                    >
                      Últimos 7 días
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={setPresetInicioMes}
                    >
                      Inicio de mes
                    </Button>
                  </div>

                  <Separator />

                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={(d) => {
                      if (d) {
                        setFecha(d);
                        setOpenCalendar(false); // ✅ auto-cierra
                      }
                    }}
                    initialFocus
                    locale={es}
                    disabled={(date) => date > new Date()} // ✅ no futuro
                    captionLayout="dropdown-buttons"       // ✅ mes/año dropdown
                    fromYear={2020}
                    toYear={new Date().getFullYear()}
                    className="rounded-md border"
                  />

                  <div className="text-[11px] text-muted-foreground">
                    Formato interno:{" "}
                    <span className="font-medium">{fechaStr}</span>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button type="submit" className="gap-2 w-full sm:w-auto">
              <Search className="size-4" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar pedidos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resumen del día */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 space-y-1">
            <CardDescription className="flex items-center gap-2">
              <Coins className="size-4 text-muted-foreground" />
              Total del día
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              Bs. {totalDia.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 space-y-1">
            <CardDescription className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-muted-foreground" />
              Pedidos encontrados
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {pedidosCount}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 space-y-1">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              Promedio por pedido
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              Bs. {promedioPedido.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Lista / Tabla */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-4 text-primary" />
            Lista de pedidos
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Fecha seleccionada:{" "}
            <strong className="text-foreground">{fechaStr}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {cargando ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : pedidos.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No hay pedidos para esta fecha.
            </div>
          ) : (
            <>
              {/* ✅ Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {pedidos.map((p, idx) => (
                  <Card key={p.id_pedido} className="border-border/60">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">
                            Pedido #{p.id_pedido}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            #{idx + 1} · {formatearHora(p.fecha_hora)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            Bs. {Number(p.total || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Total
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="text-xs sm:text-sm space-y-1">
                        <p>
                          <span className="text-muted-foreground">Cliente: </span>
                          {p.cliente_nombre || "Sin cliente"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Entrega:</span>
                          {badgeEntrega(p.tipo_entrega)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Pago:</span>
                          {badgePago(p.tipo_pago)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ✅ Desktop table */}
              <div className="hidden md:block rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[60px]">#</TableHead>
                      <TableHead className="w-[90px]">Hora</TableHead>
                      <TableHead className="w-[110px]">N° Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Entrega</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead className="text-right">Total (Bs.)</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {pedidos.map((p, idx) => (
                      <TableRow
                        key={p.id_pedido}
                        className="hover:bg-accent/40 transition-colors"
                      >
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{formatearHora(p.fecha_hora)}</TableCell>
                        <TableCell className="font-medium">
                          #{p.id_pedido}
                        </TableCell>
                        <TableCell>
                          {p.cliente_nombre || "Sin cliente"}
                        </TableCell>
                        <TableCell>{badgeEntrega(p.tipo_entrega)}</TableCell>
                        <TableCell>{badgePago(p.tipo_pago)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {Number(p.total || 0).toFixed(2)}
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

export default AdminPedidos;
