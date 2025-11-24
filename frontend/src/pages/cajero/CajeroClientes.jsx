// src/pages/cajero/CajeroClientes.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import {
  obtenerClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from "../../services/clienteService";

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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Table
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// AlertDialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// icons
import {
  UserPlus,
  Pencil,
  Trash2,
  Search,
  Users,
  Phone,
  MapPin,
  RefreshCw,
} from "lucide-react";

const CajeroClientes = () => {
  const { token } = useAuth();

  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // modal form
  const [formOpen, setFormOpen] = useState(false);

  const [modoEdicion, setModoEdicion] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);

  const [form, setForm] = useState({
    nombre_completo: "",
    telefono: "",
    direccion: "",
  });

  // búsqueda
  const [q, setQ] = useState("");

  // confirm delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState(null);

  // refrescando manual
  const [refrescando, setRefrescando] = useState(false);

  const resetForm = () => {
    setForm({ nombre_completo: "", telefono: "", direccion: "" });
    setModoEdicion(false);
    setClienteEditando(null);
    setError("");
  };

  const cargarClientes = async (opts = { silent: false }) => {
    try {
      if (!opts.silent) setCargando(true);
      setError("");
      const data = await obtenerClientes(token);
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron obtener los clientes");
    } finally {
      if (!opts.silent) setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ SOCKET: clientes en vivo
  useSocket(token, {
    "cliente:nuevo": () => cargarClientes({ silent: true }),
    "cliente:actualizado": () => cargarClientes({ silent: true }),
    "cliente:eliminado": () => cargarClientes({ silent: true }),
    "admin:refresh": (p) => {
      if (p?.tipo === "clientes") cargarClientes({ silent: true });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openNuevo = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEditar = (cliente) => {
    setModoEdicion(true);
    setClienteEditando(cliente);
    setForm({
      nombre_completo: cliente?.nombre_completo || "",
      telefono: cliente?.telefono || "",
      direccion: cliente?.direccion || "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre_completo.trim()) {
      setError("El nombre completo es obligatorio");
      return;
    }

    try {
      setError("");
      if (modoEdicion && clienteEditando) {
        await actualizarCliente(clienteEditando.id_cliente, form, token);
      } else {
        await crearCliente(form, token);
      }
      resetForm();
      setFormOpen(false);
      cargarClientes({ silent: true });
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al guardar el cliente");
    }
  };

  const pedirEliminar = (cliente) => {
    setClienteAEliminar(cliente);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (!clienteAEliminar) return;
    try {
      setError("");
      await eliminarCliente(clienteAEliminar.id_cliente, token);
      cargarClientes({ silent: true });
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el cliente");
    } finally {
      setConfirmOpen(false);
      setClienteAEliminar(null);
    }
  };

  const onRefresh = async () => {
    try {
      setRefrescando(true);
      await cargarClientes({ silent: true });
    } finally {
      setRefrescando(false);
    }
  };

  // lista filtrada
  const clientesFiltrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return clientes;

    return clientes.filter(
      (c) =>
        (c?.nombre_completo || "").toLowerCase().includes(term) ||
        (c?.telefono || "").toLowerCase().includes(term) ||
        (c?.direccion || "").toLowerCase().includes(term)
    );
  }, [clientes, q]);

  // KPIs rápidos
  const kpis = useMemo(() => {
    const total = clientes.length;
    const conTelefono = clientes.filter((c) => (c?.telefono || "").trim()).length;
    const conDireccion = clientes.filter((c) => (c?.direccion || "").trim()).length;
    return { total, conTelefono, conDireccion };
  }, [clientes]);

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="size-5 sm:size-6 text-primary" />
            Clientes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gestiona clientes rápidamente desde caja.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={onRefresh}
            className="gap-2 flex-1 md:flex-none"
            disabled={refrescando}
          >
            <RefreshCw className={`size-4 ${refrescando ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={openNuevo} className="gap-2 flex-1 md:flex-none">
            <UserPlus className="size-4" />
            Nuevo
          </Button>
        </div>
      </div>

      {/* Error global */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 grid place-items-center">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total clientes</p>
              <p className="text-xl font-bold">{kpis.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-secondary/10 grid place-items-center">
              <Phone className="size-5 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Con teléfono</p>
              <p className="text-xl font-bold">{kpis.conTelefono}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-accent grid place-items-center">
              <MapPin className="size-5 text-foreground/70" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Con dirección</p>
              <p className="text-xl font-bold">{kpis.conDireccion}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar búsqueda */}
      <Card className="border-border/60">
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono o dirección..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Listado</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {clientesFiltrados.length} de {clientes.length} cliente(s)
            </CardDescription>
          </div>
          {cargando && (
            <span className="text-xs sm:text-sm text-muted-foreground">
              Cargando...
            </span>
          )}
        </CardHeader>

        <CardContent>
          {cargando ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No hay clientes registrados.
            </div>
          ) : (
            <>
              {/* ✅ Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {clientesFiltrados.map((c) => (
                  <Card key={c.id_cliente} className="border-border/60">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="font-semibold leading-tight">
                            {c.nombre_completo}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              ID #{c.id_cliente}
                            </Badge>
                            {c.telefono && (
                              <Badge variant="outline" className="text-[10px]">
                                {c.telefono}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="text-xs sm:text-sm space-y-1">
                        <p>
                          <span className="text-muted-foreground">Teléfono: </span>
                          {c.telefono || "-"}
                        </p>
                        <p className="line-clamp-2">
                          <span className="text-muted-foreground">Dirección: </span>
                          {c.direccion || "-"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditar(c)}
                          className="gap-1 w-full"
                        >
                          <Pencil className="size-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => pedirEliminar(c)}
                          className="gap-1 w-full"
                        >
                          <Trash2 className="size-4" />
                          Eliminar
                        </Button>
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
                      <TableHead className="w-[70px]">ID</TableHead>
                      <TableHead>Nombre completo</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead className="text-right pr-3">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {clientesFiltrados.map((c) => (
                      <TableRow key={c.id_cliente} className="hover:bg-accent/40">
                        <TableCell className="font-medium">
                          #{c.id_cliente}
                        </TableCell>
                        <TableCell className="font-medium">
                          {c.nombre_completo}
                        </TableCell>
                        <TableCell>{c.telefono || "-"}</TableCell>
                        <TableCell className="max-w-[380px] truncate">
                          {c.direccion || "-"}
                        </TableCell>
                        <TableCell className="text-right pr-3">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditar(c)}
                              className="gap-1"
                            >
                              <Pencil className="size-4" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => pedirEliminar(c)}
                              className="gap-1"
                            >
                              <Trash2 className="size-4" />
                              Eliminar
                            </Button>
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

      {/* MODAL FORM */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {modoEdicion ? "Editar cliente" : "Registrar nuevo cliente"}
            </DialogTitle>
            <DialogDescription>
              Completa los datos del cliente. El nombre es obligatorio.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre_completo">
                Nombre completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre_completo"
                name="nombre_completo"
                value={form.nombre_completo}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Ej. 77777777"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Ej. Zona Central"
              />
            </div>

            <DialogFooter className="pt-2">
              <div className="flex items-center gap-2">
                <Button type="submit">
                  {modoEdicion ? "Actualizar" : "Guardar"}
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

      {/* CONFIRM DELETE */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {clienteAEliminar
                ? `Se eliminará a "${clienteAEliminar.nombre_completo}". Esta acción no se puede deshacer.`
                : "Se eliminará el cliente seleccionado."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarEliminar}>
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CajeroClientes;
