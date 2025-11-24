// src/pages/admin/AdminCompras.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import { getComprasPorFecha, crearCompra } from "../../services/compraService";

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
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// Dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Select
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Table
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
  PlusCircle,
  ShoppingCart,
  Wallet,
  Search,
} from "lucide-react";

const hoyStr = () => new Date().toISOString().substring(0, 10);

const CATEGORIAS = [
  "Verduras",
  "Carnes",
  "Panadería",
  "Bebidas",
  "Lácteos",
  "Otros",
];

const AdminCompras = () => {
  const { token } = useAuth();

  const [fechaFiltro, setFechaFiltro] = useState(hoyStr);
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [totalDia, setTotalDia] = useState(0);

  // modal
  const [formOpen, setFormOpen] = useState(false);

  const [form, setForm] = useState({
    fecha: hoyStr(),
    categoria: "",
    descripcion: "",
    proveedor: "",
    monto: "",
    observaciones: "",
  });
  const [guardando, setGuardando] = useState(false);

  const cargarCompras = async (fecha) => {
    try {
      setCargando(true);
      setError("");
      const data = await getComprasPorFecha(token, fecha);
      const lista = data || [];
      setCompras(lista);

      const suma = lista.reduce((acc, c) => acc + Number(c.monto || 0), 0);
      setTotalDia(suma);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar compras");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCompras(fechaFiltro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SOCKET refresco en vivo
  useSocket(token, {
    "compra:nueva": (compra) => {
      const f = compra?.fecha?.substring(0, 10);
      if (!f || f === fechaFiltro) cargarCompras(fechaFiltro);
    },
    "admin:refresh": (p) => {
      if (p?.tipo === "compras") cargarCompras(fechaFiltro);
    },
  });

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarCompras(fechaFiltro);
  };

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () =>
    setForm({
      fecha: hoyStr(),
      categoria: "",
      descripcion: "",
      proveedor: "",
      monto: "",
      observaciones: "",
    });

  const handleGuardarCompra = async (e) => {
    e.preventDefault();

    if (!form.fecha || !form.descripcion || !form.monto) {
      setError("La fecha, descripción y monto son obligatorios.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      await crearCompra(token, {
        fecha: form.fecha,
        categoria: form.categoria || null,
        descripcion: form.descripcion,
        proveedor: form.proveedor || null,
        monto: Number(form.monto),
        observaciones: form.observaciones || null,
      });

      setFechaFiltro(form.fecha);
      await cargarCompras(form.fecha);

      resetForm();
      setFormOpen(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al registrar compra");
    } finally {
      setGuardando(false);
    }
  };

  const promedio = useMemo(() => {
    if (compras.length === 0) return 0;
    return totalDia / compras.length;
  }, [totalDia, compras.length]);

  const formatearFecha = (f) =>
    f ? new Date(f).toISOString().substring(0, 10) : "-";

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="size-5 sm:size-6 text-primary" />
            Compras / Egresos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Registra insumos (verduras, carne, panes, bebidas, etc.) y controla
            egresos por fecha.
          </p>
        </div>

        <Button onClick={() => setFormOpen(true)} className="gap-2 w-full md:w-auto">
          <PlusCircle className="size-4" />
          Registrar compra
        </Button>
      </div>

      {/* Error global */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtro fecha */}
      <Card className="border-border/60">
        <CardContent className="pt-4">
          <form
            onSubmit={handleBuscar}
            className="flex flex-col sm:flex-row gap-3 sm:items-end"
          >
            <div className="w-full sm:w-auto">
              <Label className="text-xs sm:text-sm flex items-center gap-2 mb-1">
                <CalendarDays className="size-4 text-muted-foreground" />
                Ver compras del día
              </Label>
              <Input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="sm:w-56"
              />
            </div>

            <Button type="submit" className="gap-2 w-full sm:w-auto">
              <Search className="size-4" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Total egresos</CardDescription>
            <CardTitle className="text-2xl">
              Bs. {totalDia.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Compras registradas</CardDescription>
            <CardTitle className="text-2xl">{compras.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Promedio por compra</CardDescription>
            <CardTitle className="text-2xl">
              Bs. {promedio.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Lista */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4 text-primary" />
            Compras del {fechaFiltro}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Detalle de egresos y proveedores.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {cargando ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : compras.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No hay compras registradas para esta fecha.
            </div>
          ) : (
            <>
              {/* ✅ Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {compras.map((c, idx) => (
                  <Card key={c.id_compra || idx} className="border-border/60">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold leading-tight">
                            {c.descripcion}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            #{idx + 1} · {formatearFecha(c.fecha)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold">
                            Bs. {Number(c.monto || 0).toFixed(2)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            monto
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="text-xs sm:text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Categoría:</span>
                          {c.categoria ? (
                            <Badge variant="secondary">{c.categoria}</Badge>
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                        <p>
                          <span className="text-muted-foreground">Proveedor: </span>
                          {c.proveedor || "-"}
                        </p>
                        {c.observaciones && (
                          <p className="text-muted-foreground">
                            Obs: {c.observaciones}
                          </p>
                        )}
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
                      <TableHead className="w-[110px]">Fecha</TableHead>
                      <TableHead className="w-[140px]">Categoría</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="w-[180px]">Proveedor</TableHead>
                      <TableHead className="text-right w-[140px]">
                        Monto (Bs.)
                      </TableHead>
                      <TableHead className="w-[180px]">Obs.</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {compras.map((c, idx) => (
                      <TableRow key={c.id_compra || idx} className="hover:bg-accent/40">
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{formatearFecha(c.fecha)}</TableCell>
                        <TableCell>
                          {c.categoria ? (
                            <Badge variant="secondary">{c.categoria}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {c.descripcion}
                        </TableCell>
                        <TableCell>{c.proveedor || "-"}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {Number(c.monto || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          {c.observaciones || ""}
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

      {/* MODAL NUEVA COMPRA */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="size-5" />
              Registrar nueva compra
            </DialogTitle>
            <DialogDescription>
              Ingresa la compra realizada. Fecha, descripción y monto son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleGuardarCompra}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Fecha */}
            <div className="grid gap-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChangeForm}
              />
            </div>

            {/* Categoría */}
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select
                value={form.categoria}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, categoria: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Proveedor */}
            <div className="grid gap-2">
              <Label htmlFor="proveedor">Proveedor</Label>
              <Input
                id="proveedor"
                type="text"
                name="proveedor"
                value={form.proveedor}
                onChange={handleChangeForm}
                placeholder="Ej: Mercado, Carnicería X..."
              />
            </div>

            {/* Monto */}
            <div className="grid gap-2">
              <Label htmlFor="monto">Monto (Bs.) *</Label>
              <Input
                id="monto"
                type="number"
                name="monto"
                value={form.monto}
                onChange={handleChangeForm}
                min="0"
                step="0.01"
                className="text-right"
                placeholder="0.00"
              />
            </div>

            {/* Descripción */}
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Input
                id="descripcion"
                type="text"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChangeForm}
                placeholder="Ej: 10 kg de tomate, 5 kg de carne..."
              />
            </div>

            {/* Observaciones */}
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Input
                id="observaciones"
                type="text"
                name="observaciones"
                value={form.observaciones}
                onChange={handleChangeForm}
                placeholder="Ej: pago en efectivo, oferta..."
              />
            </div>

            <DialogFooter className="md:col-span-2 pt-2">
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar compra"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    resetForm();
                    setFormOpen(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCompras;
