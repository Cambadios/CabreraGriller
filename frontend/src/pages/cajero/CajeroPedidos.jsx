// src/pages/cajero/CajeroPedidos.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { obtenerClientes } from "../../services/clienteService";
import { getPlatos } from "../../services/platoService";
import { createPedido, actualizarPedido } from "../../services/pedidoService";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// icons
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  Clock3,
  UtensilsCrossed,
  Truck,
  Store,
  HandCoins,
  Printer,
} from "lucide-react";

const CajeroPedidos = () => {
  const { token, usuario } = useAuth();
  const [searchParams] = useSearchParams();

  // ?pedido=123 => continuación
  const pedidoExistenteId = searchParams.get("pedido");
  const esContinuacion = !!pedidoExistenteId;

  const [clientes, setClientes] = useState([]);
  const [platos, setPlatos] = useState([]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // servicio
  const [tipoServicio, setTipoServicio] = useState("MESA"); // MESA | PARA_LLEVAR | RECOJO | DOMICILIO

  // carrito
  const [items, setItems] = useState([]);

  // filtros catálogo
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("TODOS");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensajeOk, setMensajeOk] = useState("");
  const [enviando, setEnviando] = useState(false);

  // modal pago
  const [pagoModalAbierto, setPagoModalAbierto] = useState(false);
  const [metodoPagoModal, setMetodoPagoModal] = useState("EFECTIVO"); // EFECTIVO | QR | PENDIENTE
  const [montoRecibido, setMontoRecibido] = useState("");

  // 🔢 Número de ticket local (se muestra en vista previa y ticket)
  const [numeroTicket, setNumeroTicket] = useState(1);

  // Al montar, leemos el último número de ticket usado en esta PC
  useEffect(() => {
    const last = Number(localStorage.getItem("cgr_ultimo_ticket") || "0");
    setNumeroTicket(last + 1); // el siguiente a usar
  }, []);

  useEffect(() => {
    if (esContinuacion) setMetodoPagoModal("PENDIENTE");
  }, [esContinuacion]);

  // cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError("");
        const [clientesData, platosData] = await Promise.all([
          obtenerClientes(token),
          getPlatos(token),
        ]);
        setClientes(clientesData || []);
        setPlatos(platosData || []);
      } catch (err) {
        console.error(err);
        setError("Error al cargar clientes o platos");
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // tipos para filtro
  const tiposPlato = useMemo(() => {
    const setTipos = new Set();
    platos.forEach((p) => p?.tipo_plato && setTipos.add(p.tipo_plato));
    return ["TODOS", ...Array.from(setTipos)];
  }, [platos]);

  // catálogo filtrado
  const platosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return platos.filter((p) => {
      const coincideTipo =
        tipoFiltro === "TODOS" || p.tipo_plato === tipoFiltro;
      const coincideTexto =
        !term ||
        (p.nombre || "").toLowerCase().includes(term) ||
        (p.tipo_plato || "").toLowerCase().includes(term);
      return coincideTipo && coincideTexto;
    });
  }, [platos, busqueda, tipoFiltro]);

  const total = useMemo(
    () =>
      items.reduce(
        (acc, it) => acc + (Number(it.precio) || 0) * it.cantidad,
        0
      ),
    [items]
  );

  const cambio = useMemo(() => {
    if (metodoPagoModal !== "EFECTIVO") return 0;
    const recibido = Number(montoRecibido || 0);
    const diff = recibido - total;
    return diff > 0 ? diff : 0;
  }, [metodoPagoModal, montoRecibido, total]);

  const clienteObj = useMemo(
    () =>
      clientes.find(
        (c) => String(c.id_cliente) === String(clienteSeleccionado)
      ),
    [clientes, clienteSeleccionado]
  );

  // =========================
  //  HELPERS PARA EL TICKET
  // =========================

  const buildTicketData = useCallback(() => {
    const servicioTexto =
      tipoServicio === "MESA"
        ? "En mesa"
        : tipoServicio === "PARA_LLEVAR"
        ? "Para llevar"
        : tipoServicio === "RECOJO"
        ? "Para recoger"
        : "Domicilio";

    const pagoTexto = esContinuacion
      ? "PENDIENTE / NO PAGADO"
      : metodoPagoModal === "EFECTIVO"
      ? "Efectivo"
      : metodoPagoModal === "QR"
      ? "QR"
      : "PENDIENTE / NO PAGADO";

    const cajeroNombre =
      usuario?.nombre ||
      usuario?.nombre_completo ||
      usuario?.username ||
      "";

    return {
      fecha: new Date().toLocaleString("es-BO"),
      clienteNombre: !esContinuacion ? clienteObj?.nombre_completo || null : null,
      servicioTexto,
      pagoTexto,
      total,
      items: items.map((it) => ({ ...it })), // copia
      observaciones,
      esContinuacion,
      cajeroNombre,
      numeroPedido: numeroTicket, // 🔹 este es el que mostramos
    };
  }, [
    esContinuacion,
    tipoServicio,
    metodoPagoModal,
    total,
    items,
    observaciones,
    clienteObj,
    usuario,
    numeroTicket,
  ]);

  const imprimirTicket = useCallback((ticketData) => {
    if (!ticketData || !ticketData.items || ticketData.items.length === 0) {
      return;
    }

    const {
      fecha,
      clienteNombre,
      servicioTexto,
      pagoTexto,
      total,
      items,
      observaciones,
      esContinuacion,
      cajeroNombre,
      numeroPedido,
    } = ticketData;

    const lineas = [];

    lineas.push("       CABRERAGRILLER");
    lineas.push("   ----------------------");
    if (numeroPedido) {
      lineas.push(`Pedido N°: ${numeroPedido}`);
    }
    lineas.push(`Fecha:   ${fecha}`);
    if (cajeroNombre) lineas.push(`Cajero:  ${cajeroNombre}`);
    if (clienteNombre) lineas.push(`Cliente: ${clienteNombre}`);
    lineas.push(`Servicio: ${servicioTexto}`);
    lineas.push(`Pago:     ${pagoTexto}`);
    lineas.push("   ----------------------");
    lineas.push(esContinuacion ? "Nuevos platos:" : "Detalle del pedido:");

    items.forEach((it) => {
      const sub = (Number(it.precio) * it.cantidad).toFixed(2);
      lineas.push(
        `${it.cantidad} x ${it.nombre} @ ${Number(it.precio).toFixed(
          2
        )} = ${sub} Bs`
      );
    });

    lineas.push("   ----------------------");
    lineas.push(
      `${esContinuacion ? "SUBTOTAL A AGREGAR" : "TOTAL"}: ${total.toFixed(
        2
      )} Bs`
    );

    if (!esContinuacion && pagoTexto.includes("PENDIENTE")) {
      lineas.push("");
      lineas.push("*** PENDIENTE DE PAGO ***");
    }

    if (observaciones) {
      lineas.push("");
      lineas.push(`Obs: ${observaciones}`);
    }

    lineas.push("");
    lineas.push("Gracias por su preferencia ♥");

    const ticketTexto = lineas.join("\n");

    const safeText = ticketTexto
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Ticket</title>
          <style>
            body {
              font-family: monospace;
              font-size: 12px;
              padding: 8px;
              white-space: pre-wrap;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${safeText}
          <script>
            window.print();
          </script>
        </body>
      </html>
    `);
    win.document.close();
  }, []);

  // agregar desde catálogo (respeta stock)
  const handleAgregarDesdeCatalogo = (plato) => {
    setMensajeOk("");
    setError("");

    const stock = plato.stock_actual ?? Infinity;

    setItems((prev) => {
      const existe = prev.find((it) => it.id_plato === plato.id_plato);
      const cantidadActual = existe ? existe.cantidad : 0;

      if (cantidadActual + 1 > stock) {
        setError(
          `No hay más stock de "${plato.nombre}". Stock actual: ${stock}`
        );
        return prev;
      }

      if (existe) {
        return prev.map((it) =>
          it.id_plato === plato.id_plato
            ? { ...it, cantidad: it.cantidad + 1 }
            : it
        );
      }

      return [
        ...prev,
        {
          id_plato: plato.id_plato,
          nombre: plato.nombre,
          precio: Number(plato.precio),
          cantidad: 1,
          stock_actual: plato.stock_actual,
        },
      ];
    });
  };

  const handleQuitarItem = (id_plato) => {
    setItems((prev) => prev.filter((it) => it.id_plato !== id_plato));
  };

  const handleCambiarCantidadItem = (id_plato, nuevaCantidad) => {
    const cant = Number(nuevaCantidad) || 0;

    if (cant <= 0) {
      setItems((prev) => prev.filter((it) => it.id_plato !== id_plato));
      return;
    }

    const plato = platos.find((p) => p.id_plato === id_plato);
    const stock = plato?.stock_actual ?? Infinity;

    if (cant > stock) {
      setError(`No puedes poner más de ${stock} unidades (stock disponible).`);
      return;
    }

    setItems((prev) =>
      prev.map((it) =>
        it.id_plato === id_plato ? { ...it, cantidad: cant } : it
      )
    );
  };

  // abrir pago
  const handleAbrirModalPago = () => {
    if (!usuario?.id_usuario) {
      setError("No se encontró id_usuario del cajero. Revisa AuthContext.");
      return;
    }
    if (items.length === 0) {
      setError("Debes agregar al menos un plato");
      return;
    }

    setError("");
    setMensajeOk("");
    setPagoModalAbierto(true);
  };

  // confirmar (nuevo o continuación)
  const handleConfirmarPagoYCrearPedido = async () => {
    const ticketDataSnapshot = buildTicketData(); // incluye numeroTicket actual

    // NUEVO PEDIDO
    if (!esContinuacion) {
      if (metodoPagoModal === "EFECTIVO") {
        const recibido = Number(montoRecibido || 0);
        if (recibido <= 0) {
          setError("Debes indicar el monto recibido en efectivo");
          return;
        }
        if (recibido < total) {
          setError("El monto recibido es menor al total a pagar");
          return;
        }
      }

      try {
        setError("");
        setMensajeOk("");
        setEnviando(true);

        const infoServicioTexto = (() => {
          switch (tipoServicio) {
            case "MESA":
              return "SERVICIO: En mesa";
            case "PARA_LLEVAR":
              return "SERVICIO: Para llevar (mostrador)";
            case "RECOJO":
              return "SERVICIO: Pedido para recoger";
            case "DOMICILIO":
              return "SERVICIO: Envío a domicilio";
            default:
              return "SERVICIO: No especificado";
          }
        })();

        const infoPagoTexto =
          metodoPagoModal === "EFECTIVO"
            ? `PAGO: Efectivo (recibido Bs. ${Number(
                montoRecibido || 0
              ).toFixed(2)}, cambio Bs. ${cambio.toFixed(2)})`
            : metodoPagoModal === "QR"
            ? "PAGO: QR"
            : "PAGO: PENDIENTE (NO PAGADO)";

        const observacionesFinal = [
          infoServicioTexto,
          infoPagoTexto,
          observaciones,
        ]
          .filter(Boolean)
          .join(" | ");

        const tipo_entrega = tipoServicio === "MESA" ? "MESA" : "LLEVAR";
        const tipo_pago = metodoPagoModal;

        const detalles = items.map((it) => ({
          id_plato: it.id_plato,
          cantidad: it.cantidad,
        }));

        const payload = {
          id_usuario: usuario.id_usuario,
          tipo_entrega,
          tipo_pago,
          detalles,
          observaciones: observacionesFinal || null,
        };

        if (clienteSeleccionado)
          payload.id_cliente = Number(clienteSeleccionado);

        await createPedido(token, payload);

        // imprime ticket con este número
        imprimirTicket(ticketDataSnapshot);

        // guardamos que este número ya se usó, y preparamos el siguiente
        localStorage.setItem(
          "cgr_ultimo_ticket",
          String(numeroTicket)
        );
        setNumeroTicket((prev) => prev + 1);

        setMensajeOk(`✅ Pedido ${ticketDataSnapshot.numeroPedido} creado`);
        setItems([]);
        setObservaciones("");
        setClienteSeleccionado("");
        setMetodoPagoModal("EFECTIVO");
        setMontoRecibido("");
        setPagoModalAbierto(false);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error al crear el pedido");
      } finally {
        setEnviando(false);
      }
      return;
    }

    // CONTINUACIÓN
    if (esContinuacion) {
      if (items.length === 0) {
        setError("Debes agregar al menos un plato para actualizar");
        return;
      }

      try {
        setError("");
        setMensajeOk("");
        setEnviando(true);

        const detalles = items.map((it) => ({
          id_plato: it.id_plato,
          cantidad: it.cantidad,
        }));

        await actualizarPedido(token, Number(pedidoExistenteId), detalles);

        imprimirTicket(ticketDataSnapshot);

        localStorage.setItem(
          "cgr_ultimo_ticket",
          String(numeroTicket)
        );
        setNumeroTicket((prev) => prev + 1);

        setMensajeOk(
          `✅ Pedido pendiente actualizado (Ticket ${ticketDataSnapshot.numeroPedido})`
        );
        setItems([]);
        setPagoModalAbierto(false);
        setMontoRecibido("");
      } catch (err) {
        console.error(err);
        setError(err.message || "Error al actualizar el pedido");
      } finally {
        setEnviando(false);
      }
    }
  };

  // ---------- UI ----------
  if (cargando) {
    return (
      <div className="p-3 md:p-6 space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <div className="grid gap-3 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  const servicioBtn = (key, label, Icon) => {
    const active = tipoServicio === key;
    return (
      <Button
        key={key}
        type="button"
        variant={active ? "default" : "outline"}
        className="justify-start gap-2"
        onClick={() => setTipoServicio(key)}
      >
        <Icon className="size-4" />
        {label}
      </Button>
    );
  };

  const pagoBtn = (key, label, Icon, color = "default") => {
    const active = metodoPagoModal === key;
    return (
      <Button
        key={key}
        type="button"
        variant={active ? color : "outline"}
        className="gap-2"
        onClick={() => setMetodoPagoModal(key)}
        disabled={esContinuacion}
      >
        <Icon className="size-4" />
        {label}
      </Button>
    );
  };

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="size-5 sm:size-6 text-primary" />
            Cajero · Tomar pedido
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Agrega platos, elige servicio y confirma el pago al final.
          </p>

          {esContinuacion && (
            <Badge variant="secondary" className="mt-2 w-fit">
              Continuando pedido pendiente #{pedidoExistenteId} (solo se suman
              nuevos platos)
            </Badge>
          )}
        </div>

        <Card className="border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30 w-fit">
          <CardContent className="px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-medium uppercase text-emerald-700 dark:text-emerald-300">
              Total
            </span>
            <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
              Bs. {total.toFixed(2)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {mensajeOk && (
        <Alert className="border-emerald-200 text-emerald-800 dark:text-emerald-200">
          <AlertTitle>Listo</AlertTitle>
          <AlertDescription>{mensajeOk}</AlertDescription>
        </Alert>
      )}

      {/* Layout principal */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Columna izquierda */}
        <div className="space-y-4 lg:col-span-1">
          {/* Tipo de servicio */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tipo de servicio</CardTitle>
              <CardDescription className="text-xs">
                Define cómo se entrega el pedido.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {servicioBtn("MESA", "En mesa", UtensilsCrossed)}
              {servicioBtn("PARA_LLEVAR", "Para llevar", Store)}
              {servicioBtn("RECOJO", "Para recoger", HandCoins)}
              {servicioBtn("DOMICILIO", "Domicilio", Truck)}
            </CardContent>
          </Card>

          {/* Cliente + observaciones */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cliente (opcional)</CardTitle>
              <CardDescription className="text-xs">
                Puedes dejar sin cliente y registrar igual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <Label>Cliente registrado</Label>

                <Select
                  value={clienteSeleccionado || "ANONIMO"}
                  onValueChange={(val) =>
                    setClienteSeleccionado(val === "ANONIMO" ? "" : val)
                  }
                  disabled={esContinuacion}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin cliente (anónimo)" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ANONIMO">
                      Sin cliente (anónimo)
                    </SelectItem>

                    {clientes.map((c) => (
                      <SelectItem
                        key={c.id_cliente}
                        value={String(c.id_cliente)}
                      >
                        {c.nombre_completo}{" "}
                        {c.telefono ? `- ${c.telefono}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {esContinuacion && (
                  <p className="text-[11px] text-muted-foreground">
                    El cliente no se modifica al continuar un pedido.
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Observaciones</Label>
                <textarea
                  className="w-full min-h-[64px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm 
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej. sin cebolla, poco picante..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Detalle pedido */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Detalle del pedido</CardTitle>
                <CardDescription className="text-xs">
                  {items.length} ítem(s)
                </CardDescription>
              </div>
              <Badge variant="outline">Bs. {total.toFixed(2)}</Badge>
            </CardHeader>

            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  Aún no hay platos en el pedido.
                </div>
              ) : (
                <>
                  {/* Mobile list */}
                  <div className="space-y-2 md:hidden">
                    {items.map((it) => (
                      <div
                        key={it.id_plato}
                        className="rounded-lg border bg-card p-3 flex items-start justify-between gap-2"
                      >
                        <div>
                          <p className="font-semibold text-sm">{it.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            Bs. {it.precio.toFixed(2)} c/u
                          </p>
                          {typeof it.stock_actual !== "undefined" && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Stock: {it.stock_actual}
                            </p>
                          )}
                          <p className="text-xs font-medium mt-1">
                            Subtotal: Bs.{" "}
                            {(it.precio * it.cantidad).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                handleCambiarCantidadItem(
                                  it.id_plato,
                                  it.cantidad - 1
                                )
                              }
                            >
                              <Minus className="size-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              className="w-14 h-9 text-center"
                              value={it.cantidad}
                              onChange={(e) =>
                                handleCambiarCantidadItem(
                                  it.id_plato,
                                  e.target.value
                                )
                              }
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                handleCambiarCantidadItem(
                                  it.id_plato,
                                  it.cantidad + 1
                                )
                              }
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>

                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleQuitarItem(it.id_plato)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead>Plato</TableHead>
                          <TableHead className="w-[120px] text-center">
                            Cant.
                          </TableHead>
                          <TableHead className="text-right w-[120px]">
                            Subt.
                          </TableHead>
                          <TableHead className="text-right w-[90px]">
                            Acción
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((it) => (
                          <TableRow key={it.id_plato}>
                            <TableCell>
                              <div className="space-y-0.5">
                                <p className="font-medium">{it.nombre}</p>
                                <p className="text-xs text-muted-foreground">
                                  Bs. {it.precio.toFixed(2)} c/u
                                </p>
                                {typeof it.stock_actual !== "undefined" && (
                                  <p className="text-[10px] text-muted-foreground">
                                    Stock disp.: {it.stock_actual}
                                  </p>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-center">
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() =>
                                    handleCambiarCantidadItem(
                                      it.id_plato,
                                      it.cantidad - 1
                                    )
                                  }
                                >
                                  <Minus className="size-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  className="w-16 h-9 text-center"
                                  value={it.cantidad}
                                  onChange={(e) =>
                                    handleCambiarCantidadItem(
                                      it.id_plato,
                                      e.target.value
                                    )
                                  }
                                />
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() =>
                                    handleCambiarCantidadItem(
                                      it.id_plato,
                                      it.cantidad + 1
                                    )
                                  }
                                >
                                  <Plus className="size-3" />
                                </Button>
                              </div>
                            </TableCell>

                            <TableCell className="text-right font-medium">
                              Bs. {(it.precio * it.cantidad).toFixed(2)}
                            </TableCell>

                            <TableCell className="text-right">
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => handleQuitarItem(it.id_plato)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}

                        <TableRow className="bg-muted/30">
                          <TableCell
                            colSpan={2}
                            className="text-right font-semibold"
                          >
                            Total
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            Bs. {total.toFixed(2)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              <Separator />

              <Button
                type="button"
                onClick={handleAbrirModalPago}
                disabled={enviando || items.length === 0}
                className="w-full gap-2"
              >
                {enviando
                  ? esContinuacion
                    ? "Actualizando pedido..."
                    : "Procesando..."
                  : esContinuacion
                  ? "Agregar al pedido pendiente"
                  : "Confirmar pedido"}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                Revisa el detalle antes de registrar.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Catálogo */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <CardTitle className="text-base">Catálogo de platos</CardTitle>
                <CardDescription className="text-xs">
                  Toca un plato para agregar 1 unidad al pedido.
                </CardDescription>
              </div>

              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o tipo..."
                    className="pl-9 md:w-64"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>

                <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                  <SelectTrigger className="md:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposPlato.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t === "TODOS" ? "Todos los tipos" : t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {platosFiltrados.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No se encontraron platos con ese filtro.
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {platosFiltrados.map((p) => {
                  const imgUrl = p.imagen_url || p.imagen || null;
                  const sinStock = (p.stock_actual ?? 0) <= 0;

                  return (
                    <button
                      key={p.id_plato}
                      type="button"
                      onClick={() => handleAgregarDesdeCatalogo(p)}
                      disabled={sinStock}
                      className={[
                        "group text-left rounded-xl border bg-card overflow-hidden shadow-sm transition-all flex flex-col",
                        "hover:border-primary/60 hover:shadow-md",
                        sinStock ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      <div className="relative h-24 w-full bg-muted overflow-hidden">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={p.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-[11px] text-muted-foreground">
                            Sin imagen
                          </div>
                        )}

                        {sinStock && (
                          <span className="absolute inset-0 grid place-items-center bg-black/40 text-white text-xs font-semibold">
                            Sin stock
                          </span>
                        )}
                      </div>

                      <div className="p-2 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">
                            {p.tipo_plato || "Plato"}
                          </p>
                          <p className="text-sm font-semibold line-clamp-2">
                            {p.nombre}
                          </p>
                        </div>

                        <div className="mt-1 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-primary">
                              Bs. {Number(p.precio).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Stock: {p.stock_actual ?? 0}
                            </span>
                          </div>

                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1"
                          >
                            <Plus className="size-3" />
                            Agregar
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL PAGO + TICKET (shadcn Dialog) */}
      <Dialog open={pagoModalAbierto} onOpenChange={setPagoModalAbierto}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {esContinuacion
                ? `Agregar al pedido pendiente`
                : "Pago y ticket"}
            </DialogTitle>
            <DialogDescription>
              {esContinuacion
                ? "Solo se sumarán estos platos al pedido pendiente."
                : "Selecciona método de pago y confirma el pedido."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pago */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {esContinuacion ? "Subtotal a agregar" : "Total a pagar"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    Bs. {total.toFixed(2)}
                  </span>
                </div>

                {!esContinuacion && (
                  <div className="space-y-2">
                    <Label>Método de pago</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {pagoBtn("EFECTIVO", "Efectivo", CreditCard)}
                      {pagoBtn("QR", "QR", QrCode)}
                      {pagoBtn("PENDIENTE", "Pendiente", Clock3, "secondary")}
                    </div>
                  </div>
                )}

                {!esContinuacion && metodoPagoModal === "EFECTIVO" && (
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
                        Bs. {cambio.toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}

                {esContinuacion && (
                  <Alert>
                    <AlertTitle>Pedido pendiente</AlertTitle>
                    <AlertDescription className="text-xs">
                      Este pedido seguirá en estado <b>PENDIENTE</b>. Solo se
                      añade el subtotal.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Ticket preview */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Vista previa ticket</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72 rounded-lg border bg-muted/30 p-3 text-xs font-mono">
                  <div className="text-center mb-2">
                    <p className="font-bold text-sm">CabreraGriller</p>
                    <p className="text-[11px] font-semibold">
                      Pedido N°: {numeroTicket}
                    </p>
                    {usuario && (
                      <p className="text-[11px]">
                        Cajero:{" "}
                        {usuario.nombre ||
                          usuario.nombre_completo ||
                          usuario.username ||
                          "—"}
                      </p>
                    )}
                    <p className="text-[11px]">
                      {new Date().toLocaleString("es-BO")}
                    </p>
                  </div>

                  {clienteObj && !esContinuacion && (
                    <p>
                      Cliente:{" "}
                      <span className="font-semibold">
                        {clienteObj.nombre_completo}
                      </span>
                    </p>
                  )}

                  <p>
                    Servicio:{" "}
                    <span className="font-semibold">
                      {tipoServicio === "MESA"
                        ? "En mesa"
                        : tipoServicio === "PARA_LLEVAR"
                        ? "Para llevar"
                        : tipoServicio === "RECOJO"
                        ? "Para recoger"
                        : "Domicilio"}
                    </span>
                  </p>

                  <p>
                    Pago:{" "}
                    <span className="font-semibold">
                      {esContinuacion
                        ? "PENDIENTE / NO PAGADO"
                        : metodoPagoModal === "EFECTIVO"
                        ? "Efectivo"
                        : metodoPagoModal === "QR"
                        ? "QR"
                        : "PENDIENTE / NO PAGADO"}
                    </span>
                  </p>

                  <hr className="my-2 border-border" />
                  <p className="font-semibold mb-1">
                    {esContinuacion ? "Nuevos platos:" : "Detalle:"}
                  </p>

                  {items.map((it) => (
                    <p key={it.id_plato}>
                      {it.cantidad} x {it.nombre} @ Bs.{" "}
                      {it.precio.toFixed(2)} = Bs.{" "}
                      {(it.precio * it.cantidad).toFixed(2)}
                    </p>
                  ))}

                  <hr className="my-2 border-border" />
                  <p>
                    {esContinuacion ? "SUBTOTAL A AGREGAR:" : "TOTAL:"}{" "}
                    <span className="font-bold">
                      Bs. {total.toFixed(2)}
                    </span>
                  </p>

                  {!esContinuacion && metodoPagoModal === "PENDIENTE" && (
                    <p className="mt-1 text-red-600 font-bold text-center">
                      *** PENDIENTE DE PAGO ***
                    </p>
                  )}

                  {observaciones && (
                    <>
                      <hr className="my-2 border-border" />
                      <p>Obs: {observaciones}</p>
                    </>
                  )}

                  <div className="mt-2 text-center text-[10px] text-muted-foreground">
                    ¡Gracias por su preferencia!
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!enviando) {
                  setPagoModalAbierto(false);
                  if (!esContinuacion) {
                    setMontoRecibido("");
                    setMetodoPagoModal("EFECTIVO");
                  }
                }
              }}
              disabled={enviando}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => imprimirTicket(buildTicketData())}
              disabled={items.length === 0}
            >
              <Printer className="size-4" />
              Imprimir ticket
            </Button>

            <Button
              type="button"
              onClick={handleConfirmarPagoYCrearPedido}
              disabled={enviando}
              className="gap-2"
            >
              {enviando
                ? esContinuacion
                  ? "Actualizando..."
                  : "Registrando..."
                : esContinuacion
                ? "Confirmar y agregar"
                : "Confirmar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CajeroPedidos;
