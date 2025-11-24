// src/pages/cajero/CajeroPedidosDelDia.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getPedidosPorFecha,
  getPedidoById,
  pagarPedido,
} from "../../services/pedidoService";
import { useNavigate } from "react-router-dom";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

// icons
import {
  CalendarDays,
  Search,
  ClipboardList,
  User,
  Banknote,
  QrCode,
  Clock3,
  Eye,
  ArrowRight,
  ReceiptText,
} from "lucide-react";

const hoyISO = () => new Date().toISOString().slice(0, 10);

const formatearHora = (fechaHora) => {
  if (!fechaHora) return "-";
  const d = new Date(fechaHora);
  return d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
};

const formatearFechaLarga = (fecha) => {
  if (!fecha) return "-";
  const d = new Date(fecha + "T00:00:00");
  return d.toLocaleDateString("es-BO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const CajeroPedidosDelDia = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [fecha, setFecha] = useState(hoyISO());
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");

  // Modal de pago
  const [pagoModalAbierto, setPagoModalAbierto] = useState(false);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO"); // EFECTIVO | QR
  const [montoRecibido, setMontoRecibido] = useState("");
  const [errorPago, setErrorPago] = useState("");
  const [enviandoPago, setEnviandoPago] = useState(false);

  const cargarPedidos = useCallback(
    async (fechaConsulta) => {
      if (!token) return;
      setCargando(true);
      setError("");
      try {
        const data = await getPedidosPorFecha(token, fechaConsulta);
        setPedidos(data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error al cargar pedidos");
        setPedidos([]);
      } finally {
        setCargando(false);
      }
    },
    [token]
  );

  useEffect(() => {
    cargarPedidos(fecha);
  }, [fecha, cargarPedidos]);

  const manejarBuscar = (e) => {
    e.preventDefault();
    const f = fecha || hoyISO();
    setFecha(f);
    cargarPedidos(f);
  };

  const manejarHoy = () => {
    const hoy = hoyISO();
    setFecha(hoy);
    cargarPedidos(hoy);
  };

  const totalDia = useMemo(
    () => pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0),
    [pedidos]
  );

  const abrirDetalle = async (id_pedido) => {
    if (!token) return;
    setCargandoDetalle(true);
    setErrorDetalle("");
    try {
      const data = await getPedidoById(token, id_pedido);
      setPedidoSeleccionado(data);
    } catch (err) {
      console.error(err);
      setErrorDetalle(err.message || "Error al cargar detalle del pedido");
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalle = () => {
    setPedidoSeleccionado(null);
    setErrorDetalle("");
    setPagoModalAbierto(false);
    setErrorPago("");
    setMontoRecibido("");
    setMetodoPago("EFECTIVO");
  };

  const totalPedidoSeleccionado = Number(pedidoSeleccionado?.total || 0);

  const cambio =
    metodoPago === "EFECTIVO"
      ? Math.max(Number(montoRecibido || 0) - totalPedidoSeleccionado, 0)
      : 0;

  const abrirModalPago = () => {
    setErrorPago("");
    setMontoRecibido("");
    setMetodoPago("EFECTIVO");
    setPagoModalAbierto(true);
  };

  const manejarPagarPedido = async () => {
    if (!pedidoSeleccionado) return;

    if (!["EFECTIVO", "QR"].includes(metodoPago)) {
      setErrorPago("Selecciona un método de pago válido");
      return;
    }

    if (metodoPago === "EFECTIVO") {
      const recibido = Number(montoRecibido || 0);
      if (recibido <= 0) {
        setErrorPago("Ingresa el monto recibido en efectivo");
        return;
      }
      if (recibido < totalPedidoSeleccionado) {
        setErrorPago("El monto recibido es menor al total del pedido");
        return;
      }
    }

    try {
      setErrorPago("");
      setEnviandoPago(true);

      await pagarPedido(token, pedidoSeleccionado.id_pedido, metodoPago);
      await cargarPedidos(fecha);

      setPedidoSeleccionado((prev) =>
        prev
          ? { ...prev, estado: "PAGADO", tipo_pago: metodoPago }
          : prev
      );

      setPagoModalAbierto(false);
      setMontoRecibido("");
    } catch (err) {
      console.error(err);
      setErrorPago(err.message || "Error al registrar el pago");
    } finally {
      setEnviandoPago(false);
    }
  };

  const badgeEstado = (estado) => {
    const pagado = estado === "PAGADO";
    return (
      <Badge
        className={
          pagado
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200"
        }
        variant="secondary"
      >
        {estado}
      </Badge>
    );
  };

  const badgePago = (tipoPago) => {
    if (tipoPago === "EFECTIVO")
      return (
        <Badge variant="outline" className="gap-1">
          <Banknote className="size-3" /> Efectivo
        </Badge>
      );
    if (tipoPago === "QR")
      return (
        <Badge variant="outline" className="gap-1">
          <QrCode className="size-3" /> QR
        </Badge>
      );
    return (
      <Badge variant="outline" className="gap-1">
        <Clock3 className="size-3" /> Pendiente
      </Badge>
    );
  };

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-5">
      {/* Header + filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" />
            Pedidos del día
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Fecha seleccionada:{" "}
            <span className="font-medium capitalize">
              {formatearFechaLarga(fecha)}
            </span>
          </p>
        </div>

        <form
          onSubmit={manejarBuscar}
          className="flex flex-col sm:flex-row items-start sm:items-end gap-2"
        >
          <div className="grid gap-1">
            <Label className="text-xs">Fecha</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="pl-9 w-full sm:w-[170px]"
              />
            </div>
          </div>

          <Button type="submit" className="gap-2 w-full sm:w-auto">
            <Search className="size-4" />
            Buscar
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={manejarHoy}
            className="w-full sm:w-auto"
          >
            Hoy
          </Button>
        </form>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Total pedidos</CardDescription>
            <CardTitle className="text-2xl">{pedidos.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Monto total del día</CardDescription>
            <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-300">
              Bs {totalDia.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Estado</CardDescription>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {cargando
                ? "Cargando pedidos..."
                : pedidos.length === 0
                ? "Sin pedidos en esta fecha"
                : "Pedidos cargados"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Listado */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Listado de pedidos</CardTitle>
            <CardDescription className="text-xs">
              {pedidos.length} pedido(s)
            </CardDescription>
          </div>
          {cargando && (
            <span className="text-xs text-muted-foreground">Cargando...</span>
          )}
        </CardHeader>

        <CardContent>
          {cargando ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : pedidos.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No hay pedidos registrados para esta fecha.
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {pedidos.map((p) => (
                  <Card key={p.id_pedido} className="border-border/60">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">
                            Pedido #{p.id_pedido}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatearHora(p.fecha_hora)} ·{" "}
                            {p.tipo_entrega === "MESA"
                              ? "En mesa"
                              : "Para llevar"}
                          </p>
                        </div>
                        {badgeEstado(p.estado)}
                      </div>

                      <Separator />

                      <div className="text-xs space-y-1">
                        <p className="flex items-center gap-1">
                          <User className="size-3 text-muted-foreground" />
                          {p.cliente || "Consumidor final"}
                        </p>
                        <p className="flex items-center gap-1">
                          <ReceiptText className="size-3 text-muted-foreground" />
                          {badgePago(p.tipo_pago)}
                        </p>
                        <p className="font-semibold text-sm text-right">
                          Bs {Number(p.total || 0).toFixed(2)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => abrirDetalle(p.id_pedido)}
                          className="gap-1"
                        >
                          <Eye className="size-4" />
                          Ver detalle
                        </Button>

                        {p.estado === "PENDIENTE" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              navigate(
                                `/cajero/pedidos?pedido=${p.id_pedido}`
                              )
                            }
                            className="gap-1"
                          >
                            <ArrowRight className="size-4" />
                            Continuar
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            Pagado
                          </Button>
                        )}
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
                      <TableHead className="w-[70px]">#</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Cajero</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Entrega</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead className="text-right">
                        Total (Bs)
                      </TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-right pr-3">Acción</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {pedidos.map((p) => (
                      <TableRow key={p.id_pedido} className="hover:bg-accent/30">
                        <TableCell className="font-medium">
                          {p.id_pedido}
                        </TableCell>
                        <TableCell>{formatearHora(p.fecha_hora)}</TableCell>
                        <TableCell>{p.cajero || "-"}</TableCell>
                        <TableCell>{p.cliente || "Consumidor final"}</TableCell>
                        <TableCell>
                          {p.tipo_entrega === "MESA" ? "En mesa" : "Para llevar"}
                        </TableCell>
                        <TableCell>{badgePago(p.tipo_pago)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {Number(p.total || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {badgeEstado(p.estado)}
                        </TableCell>
                        <TableCell className="text-right pr-3">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => abrirDetalle(p.id_pedido)}
                              className="gap-1"
                            >
                              <Eye className="size-4" />
                              Ver detalle
                            </Button>
                            {p.estado === "PENDIENTE" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  navigate(
                                    `/cajero/pedidos?pedido=${p.id_pedido}`
                                  )
                                }
                                className="gap-1"
                              >
                                <ArrowRight className="size-4" />
                                Continuar
                              </Button>
                            )}
                          </div>
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

      {/* DETALLE PEDIDO */}
      <Dialog open={!!pedidoSeleccionado} onOpenChange={(o) => !o && cerrarDetalle()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalle pedido #{pedidoSeleccionado?.id_pedido}
            </DialogTitle>
            <DialogDescription>
              Información general y platos del pedido.
            </DialogDescription>
          </DialogHeader>

          {errorDetalle && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorDetalle}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <Card className="border-border/60">
              <CardContent className="p-3 space-y-1">
                <p>
                  <span className="font-medium">Fecha y hora: </span>
                  {formatearHora(pedidoSeleccionado?.fecha_hora)} (
                  {pedidoSeleccionado?.fecha_hora
                    ? new Date(pedidoSeleccionado.fecha_hora).toLocaleDateString("es-BO")
                    : "-"}
                  )
                </p>
                <p>
                  <span className="font-medium">Cajero: </span>
                  {pedidoSeleccionado?.cajero || "-"}
                </p>
                <p>
                  <span className="font-medium">Cliente: </span>
                  {pedidoSeleccionado?.cliente || "Consumidor final"}
                </p>
                <p>
                  <span className="font-medium">Entrega: </span>
                  {pedidoSeleccionado?.tipo_entrega === "MESA"
                    ? "En mesa"
                    : "Para llevar"}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Pago: </span>
                  {badgePago(pedidoSeleccionado?.tipo_pago)}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Estado: </span>
                  {badgeEstado(pedidoSeleccionado?.estado)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-3 space-y-2">
                <p className="font-medium">Total</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  Bs {totalPedidoSeleccionado.toFixed(2)}
                </p>

                {pedidoSeleccionado?.estado === "PENDIENTE" && (
                  <Button onClick={abrirModalPago} className="gap-2 w-full">
                    <Banknote className="size-4" />
                    Registrar pago
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-semibold mb-2">Platos del pedido</p>

            {cargandoDetalle ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : pedidoSeleccionado?.detalles?.length ? (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Plato</TableHead>
                      <TableHead className="text-right w-[70px]">Cant</TableHead>
                      <TableHead className="text-right w-[100px]">Precio</TableHead>
                      <TableHead className="text-right w-[110px]">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidoSeleccionado.detalles.map((d) => (
                      <TableRow key={d.id_detalle}>
                        <TableCell>{d.plato}</TableCell>
                        <TableCell className="text-right">{d.cantidad}</TableCell>
                        <TableCell className="text-right">
                          {Number(d.precio_unitario || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {Number(d.subtotal || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No hay detalles para este pedido.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={cerrarDetalle}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL PAGO */}
      <Dialog open={pagoModalAbierto} onOpenChange={(o) => !o && setPagoModalAbierto(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Pagar pedido #{pedidoSeleccionado?.id_pedido}
            </DialogTitle>
            <DialogDescription>
              Total a pagar: Bs {totalPedidoSeleccionado.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid gap-2">
              <Label>Método de pago</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={metodoPago === "EFECTIVO" ? "default" : "outline"}
                  onClick={() => setMetodoPago("EFECTIVO")}
                  className="gap-2"
                >
                  <Banknote className="size-4" />
                  Efectivo
                </Button>
                <Button
                  type="button"
                  variant={metodoPago === "QR" ? "default" : "outline"}
                  onClick={() => setMetodoPago("QR")}
                  className="gap-2"
                >
                  <QrCode className="size-4" />
                  QR
                </Button>
              </div>
            </div>

            {metodoPago === "EFECTIVO" && (
              <div className="grid gap-2">
                <Label>Monto recibido (Bs.)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  placeholder="Ej. 100"
                />
                <p className="text-xs text-muted-foreground">
                  Cambio:{" "}
                  <span className="font-semibold text-foreground">
                    Bs {cambio.toFixed(2)}
                  </span>
                </p>
              </div>
            )}

            {errorPago && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorPago}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (!enviandoPago) {
                  setPagoModalAbierto(false);
                  setErrorPago("");
                  setMontoRecibido("");
                  setMetodoPago("EFECTIVO");
                }
              }}
              disabled={enviandoPago}
            >
              Cancelar
            </Button>
            <Button onClick={manejarPagarPedido} disabled={enviandoPago}>
              {enviandoPago ? "Registrando..." : "Confirmar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CajeroPedidosDelDia;
