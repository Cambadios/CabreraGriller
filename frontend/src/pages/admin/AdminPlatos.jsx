// src/pages/admin/AdminPlatos.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import {
  getPlatos,
  createPlato,
  updatePlato,
  deletePlato,
} from "../../services/platoService";

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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

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
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// AlertDialog
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

// icons
import {
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  RefreshCcw,
  UtensilsCrossed,
  Image as ImageIcon,
  Package,
  Tag,
  DollarSign,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const AdminPlatos = () => {
  const { token } = useAuth();

  const [platos, setPlatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // modal form
  const [formOpen, setFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    id_plato: null,
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: "",
    disponible: true,
    stock_actual: "",
  });

  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // filtros/búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODOS");

  const cargarPlatos = async () => {
    try {
      setCargando(true);
      setError("");
      const data = await getPlatos(token);
      setPlatos(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar platos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (token) cargarPlatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // SOCKET: refresco en vivo
  useSocket(token, {
    "plato:nuevo": () => cargarPlatos(),
    "plato:actualizado": () => cargarPlatos(),
    "plato:eliminado": () => cargarPlatos(),
    "admin:refresh": (p) => {
      if (p?.tipo === "platos" || p?.tipo === "stock") cargarPlatos();
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagenFile(file);
      setImagenPreview(URL.createObjectURL(file));
    } else {
      setImagenFile(null);
      setImagenPreview(null);
    }
  };

  const resetForm = () => {
    setFormData({
      id_plato: null,
      nombre: "",
      descripcion: "",
      precio: "",
      categoria: "",
      disponible: true,
      stock_actual: "",
    });
    setImagenFile(null);
    setImagenPreview(null);
    setIsEditing(false);
    setError("");
  };

  const openNuevo = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("nombre", formData.nombre);
      fd.append("tipo_plato", formData.categoria);
      fd.append("precio", formData.precio || "0");
      fd.append("stock_actual", formData.stock_actual || "0");
      fd.append("estado", formData.disponible ? "true" : "false");
      fd.append("observaciones", formData.descripcion || "");

      if (imagenFile) fd.append("imagen", imagenFile);

      if (isEditing && formData.id_plato != null) {
        await updatePlato(token, formData.id_plato, fd);
      } else {
        await createPlato(token, fd);
      }

      await cargarPlatos();
      resetForm();
      setFormOpen(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al guardar plato");
    } finally {
      setEnviando(false);
    }
  };

  const handleEdit = (plato) => {
    setFormData({
      id_plato: plato.id_plato,
      nombre: plato.nombre || "",
      descripcion: plato.observaciones || "",
      precio: plato.precio != null ? String(plato.precio) : "",
      categoria: plato.tipo_plato || "",
      disponible:
        typeof plato.estado === "boolean"
          ? plato.estado
          : Boolean(plato.estado),
      stock_actual:
        plato.stock_actual != null ? String(plato.stock_actual) : "",
    });

    setImagenFile(null);
    setImagenPreview(plato.imagen_url || null);
    setIsEditing(true);
    setFormOpen(true);
  };

  // confirm delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [platoAEliminar, setPlatoAEliminar] = useState(null);

  const pedirEliminar = (plato) => {
    setPlatoAEliminar(plato);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (!platoAEliminar) return;
    try {
      setError("");
      await deletePlato(token, platoAEliminar.id_plato);
      await cargarPlatos();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al eliminar plato");
    } finally {
      setConfirmOpen(false);
      setPlatoAEliminar(null);
    }
  };

  // categorías dinámicas para filtro
  const categoriasDisponibles = useMemo(() => {
    const setCat = new Set();
    platos.forEach((p) => p.tipo_plato && setCat.add(p.tipo_plato));
    return ["TODOS", ...Array.from(setCat)];
  }, [platos]);

  // lista filtrada
  const platosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return platos.filter((p) => {
      const matchQ =
        !term ||
        (p.nombre || "").toLowerCase().includes(term) ||
        (p.tipo_plato || "").toLowerCase().includes(term) ||
        (p.observaciones || "").toLowerCase().includes(term);

      const matchCat =
        categoriaFiltro === "TODOS" || p.tipo_plato === categoriaFiltro;

      return matchQ && matchCat;
    });
  }, [platos, busqueda, categoriaFiltro]);

  const badgeEstado = (estado) =>
    estado ? (
      <Badge className="bg-emerald-600/10 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 gap-1">
        <CheckCircle2 className="size-3.5" />
        Disponible
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <XCircle className="size-3.5" />
        No disponible
      </Badge>
    );

  const precioFmt = (v) => `Bs. ${Number(v || 0).toFixed(2)}`;

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="size-5 sm:size-6 text-primary" />
            Platos / Menú
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Administra tu menú: imágenes, precios, stock y disponibilidad.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button
            variant="outline"
            onClick={cargarPlatos}
            className="gap-2"
          >
            <RefreshCcw className="size-4" />
            Actualizar
          </Button>
          <Button onClick={openNuevo} className="gap-2">
            <PlusCircle className="size-4" />
            Nuevo plato
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

      {/* Toolbar / filtros */}
      <Card className="border-border/60">
        <CardContent className="pt-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* buscador */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar platos, categorías o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* filtro categoría */}
            <div className="w-full lg:w-72">
              <Select
                value={categoriaFiltro}
                onValueChange={setCategoriaFiltro}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasDisponibles.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "TODOS" ? "Todas las categorías" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:ml-auto text-xs sm:text-sm text-muted-foreground">
              Mostrando{" "}
              <span className="font-semibold text-foreground">
                {platosFiltrados.length}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-foreground">
                {platos.length}
              </span>{" "}
              platos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cards */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            Catálogo de platos
            <Badge variant="outline" className="text-xs">
              {platosFiltrados.length}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Vista tipo catálogo para administración rápida.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {cargando ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/60">
                  <Skeleton className="h-44 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : platosFiltrados.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground text-sm space-y-2">
              <UtensilsCrossed className="mx-auto size-8 opacity-50" />
              <p>No se encontraron platos con esos filtros.</p>
              <Button variant="outline" onClick={() => {
                setBusqueda("");
                setCategoriaFiltro("TODOS");
              }}>
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {platosFiltrados.map((plato) => (
                <Card
                  key={plato.id_plato}
                  className="group overflow-hidden border-border/60 hover:shadow-lg transition-shadow"
                >
                  {/* Imagen */}
                  <div className="relative h-48 w-full bg-muted overflow-hidden">
                    {plato.imagen_url ? (
                      <img
                        src={plato.imagen_url}
                        alt={plato.nombre}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <div className="flex items-center gap-2 text-xs">
                          <ImageIcon className="size-4" />
                          Sin imagen
                        </div>
                      </div>
                    )}

                    {/* Precio flotante */}
                    <div className="absolute top-3 right-3">
                      <Badge className="px-2 py-1 text-sm shadow bg-background/90 text-foreground border border-border/60">
                        {precioFmt(plato.precio)}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Título + categoría */}
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight line-clamp-1">
                          {plato.nombre}
                        </h3>
                        {badgeEstado(plato.estado)}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Tag className="size-3.5" />
                        <span className="line-clamp-1">
                          {plato.tipo_plato || "Sin categoría"}
                        </span>
                      </div>
                    </div>

                    {/* Descripción */}
                    {plato.observaciones && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {plato.observaciones}
                      </p>
                    )}

                    <Separator />

                    {/* Stock */}
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="size-4" />
                        <span>
                          Stock:{" "}
                          <strong className="text-foreground">
                            {plato.stock_actual ?? 0}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="size-4" />
                        <span className="font-semibold text-foreground">
                          {Number(plato.precio || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(plato)}
                        className="gap-1"
                      >
                        <Pencil className="size-4" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => pedirEliminar(plato)}
                        className="gap-1"
                      >
                        <Trash2 className="size-4" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL FORM */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? (
                <Pencil className="size-5" />
              ) : (
                <PlusCircle className="size-5" />
              )}
              {isEditing ? "Editar plato" : "Nuevo plato"}
            </DialogTitle>
            <DialogDescription>
              Completa los datos del plato. La imagen es opcional.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Nombre */}
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Hamburguesa clásica"
                required
                autoFocus
              />
            </div>

            {/* Categoría */}
            <div className="grid gap-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                placeholder="Ej. Almuerzo, Bebidas, Postres"
              />
            </div>

            {/* Precio */}
            <div className="grid gap-2">
              <Label htmlFor="precio">Precio (Bs.) *</Label>
              <Input
                id="precio"
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                min="0"
                step="0.1"
                required
              />
            </div>

            {/* Stock */}
            <div className="grid gap-2">
              <Label htmlFor="stock_actual">Stock actual *</Label>
              <Input
                id="stock_actual"
                type="number"
                name="stock_actual"
                value={formData.stock_actual}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="Ej. 20"
                required
              />
            </div>

            {/* Disponible */}
            <div className="flex items-center gap-2 md:mt-6">
              <input
                id="disponible"
                type="checkbox"
                name="disponible"
                checked={formData.disponible}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <Label htmlFor="disponible" className="cursor-pointer">
                Disponible
              </Label>
            </div>

            {/* Imagen */}
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="imagen">Imagen</Label>

              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="w-full">
                  <Input
                    id="imagen"
                    type="file"
                    name="imagen"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Recomendado: 800x600px o similar.
                  </p>
                </div>

                {imagenPreview && (
                  <div className="flex items-center gap-2">
                    <div className="size-20 rounded-md overflow-hidden border bg-muted">
                      <img
                        src={imagenPreview}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImagenFile(null);
                        setImagenPreview(null);
                      }}
                    >
                      Quitar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Descripción */}
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describe brevemente el plato..."
              />
            </div>

            <DialogFooter className="md:col-span-2 pt-2">
              <div className="flex items-center gap-2">
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

                <Button type="submit" disabled={enviando}>
                  {enviando
                    ? isEditing
                      ? "Guardando..."
                      : "Creando..."
                    : isEditing
                    ? "Guardar cambios"
                    : "Crear plato"}
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
            <AlertDialogTitle>¿Eliminar plato?</AlertDialogTitle>
            <AlertDialogDescription>
              {platoAEliminar
                ? `Se eliminará "${platoAEliminar.nombre}". Esta acción no se puede deshacer.`
                : "Se eliminará el plato seleccionado."}
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

export default AdminPlatos;
