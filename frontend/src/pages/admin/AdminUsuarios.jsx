// src/pages/admin/Usuarios.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import {
  fetchUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "../../services/usuarioService";

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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Skeleton } from "@/components/ui/skeleton";

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

// icons
import {
  UserPlus,
  Pencil,
  UserX,
  ShieldCheck,
  Users,
  UserCheck,
  UserMinus,
  Search,
  Filter,
} from "lucide-react";

const ROLES = ["ADMIN", "MOZO", "COCINA", "CAJERO"];

export default function UsuariosPage() {
  const { token } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    nombre_completo: "",
    alias: "",
    password: "",
    rol: "",
    estado: true,
  });

  const [editId, setEditId] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  const [q, setQ] = useState("");
  const [rolFiltro, setRolFiltro] = useState("TODOS");
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS");

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchUsuarios(token);
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useSocket(token, {
    "usuario:nuevo": () => cargarUsuarios(),
    "usuario:actualizado": () => cargarUsuarios(),
    "usuario:eliminado": () => cargarUsuarios(),
    "admin:refresh": (p) => {
      if (p?.tipo === "usuarios") cargarUsuarios();
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      nombre_completo: "",
      alias: "",
      password: "",
      rol: "",
      estado: true,
    });
    setError("");
  };

  const openNuevo = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditar = (usuario) => {
    setEditId(usuario.id_usuario);
    setFormData({
      nombre_completo: usuario.nombre_completo,
      alias: usuario.alias,
      password: "",
      rol: usuario.rol,
      estado: usuario.estado,
    });
    setError("");
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");

      if (!formData.nombre_completo || !formData.alias || !formData.rol) {
        setError("Nombre, alias y rol son obligatorios");
        return;
      }

      if (!editId && !formData.password) {
        setError("La contraseña es obligatoria al crear un usuario");
        return;
      }

      if (editId) {
        const payload = {
          nombre_completo: formData.nombre_completo,
          alias: formData.alias,
          rol: formData.rol,
          estado: formData.estado,
        };
        if (formData.password.trim() !== "") payload.password = formData.password;
        await updateUsuario(editId, payload);
      } else {
        await createUsuario({
          nombre_completo: formData.nombre_completo,
          alias: formData.alias,
          password: formData.password,
          rol: formData.rol,
        });
      }

      resetForm();
      setFormOpen(false);
      cargarUsuarios();
    } catch (err) {
      console.error(err);
      setError("Error al guardar el usuario");
    }
  };

  const pedirConfirmacionEliminar = (usuario) => {
    setUsuarioAEliminar(usuario);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (!usuarioAEliminar) return;
    try {
      await deleteUsuario(token, usuarioAEliminar.id_usuario);
      cargarUsuarios();
    } catch (err) {
      console.error(err);
      setError("Error al desactivar el usuario");
    } finally {
      setConfirmOpen(false);
      setUsuarioAEliminar(null);
    }
  };

  const tituloForm = editId ? "Editar usuario" : "Nuevo usuario";

  const stats = useMemo(() => {
    const activos = usuarios.filter((u) => u.estado).length;
    const inactivos = usuarios.length - activos;
    const admins = usuarios.filter((u) => u.rol === "ADMIN").length;
    return { total: usuarios.length, activos, inactivos, admins };
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const term = q.trim().toLowerCase();

    return usuarios.filter((u) => {
      const matchQ =
        !term ||
        u.nombre_completo.toLowerCase().includes(term) ||
        u.alias.toLowerCase().includes(term);

      const matchRol = rolFiltro === "TODOS" || u.rol === rolFiltro;

      const matchEstado =
        estadoFiltro === "TODOS" ||
        (estadoFiltro === "ACTIVOS" && u.estado) ||
        (estadoFiltro === "INACTIVOS" && !u.estado);

      return matchQ && matchRol && matchEstado;
    });
  }, [usuarios, q, rolFiltro, estadoFiltro]);

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header + action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="size-5 sm:size-6 text-primary" />
            Gestión de Usuarios
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Crea, actualiza y desactiva accesos al sistema.
          </p>
        </div>

        <Button onClick={openNuevo} className="gap-2 w-full md:w-auto">
          <UserPlus className="size-4" />
          Nuevo usuario
        </Button>
      </div>

      {/* Stats responsive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-muted/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
              <Users className="size-4" /> Total
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-muted/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
              <UserCheck className="size-4 text-emerald-600" /> Activos
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-emerald-600">
              {stats.activos}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-muted/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
              <UserMinus className="size-4 text-destructive" /> Inactivos
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-destructive">
              {stats.inactivos}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-muted/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
              <ShieldCheck className="size-4 text-primary" /> Admins
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl">{stats.admins}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Error global */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Toolbar responsive */}
      <Card className="border-muted/60">
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-[1fr,220px,220px,auto] md:items-center">
            {/* buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o alias..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* filtro rol */}
            <Select value={rolFiltro} onValueChange={setRolFiltro}>
              <SelectTrigger className="gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <SelectValue placeholder="Filtrar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* filtro estado */}
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <SelectValue placeholder="Filtrar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="ACTIVOS">Activos</SelectItem>
                <SelectItem value="INACTIVOS">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            {/* reset */}
            {(q || rolFiltro !== "TODOS" || estadoFiltro !== "TODOS") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setQ("");
                  setRolFiltro("TODOS");
                  setEstadoFiltro("TODOS");
                }}
                className="justify-start md:justify-center"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista / tabla */}
      <Card className="border-muted/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {usuariosFiltrados.length} de {usuarios.length} usuario(s)
            </CardDescription>
          </div>
          {loading && (
            <span className="text-sm text-muted-foreground">Cargando...</span>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Users className="mx-auto mb-2 size-8 opacity-60" />
              No se encontraron usuarios con esos filtros.
            </div>
          ) : (
            <>
              {/* ✅ Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {usuariosFiltrados.map((u) => (
                  <Card key={u.id_usuario} className="border-muted/60">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold leading-tight">
                            {u.nombre_completo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{u.alias} · #{u.id_usuario}
                          </p>
                        </div>

                        <Badge variant="secondary" className="shrink-0">
                          {u.rol}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Estado
                        </span>
                        {u.estado ? (
                          <Badge className="bg-emerald-600/10 text-emerald-700">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Inactivo</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditar(u)}
                          className="gap-1 w-full"
                        >
                          <Pencil className="size-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => pedirConfirmacionEliminar(u)}
                          className="gap-1 w-full"
                        >
                          <UserX className="size-4" />
                          Desactivar
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
                      <TableHead>Alias</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right pr-3">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {usuariosFiltrados.map((u) => (
                      <TableRow key={u.id_usuario} className="hover:bg-accent/40">
                        <TableCell className="font-medium">
                          #{u.id_usuario}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{u.nombre_completo}</span>
                            <span className="text-xs text-muted-foreground">
                              @{u.alias}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {u.alias}
                        </TableCell>

                        <TableCell>
                          <Badge variant="secondary" className="rounded-md px-2 py-1">
                            {u.rol}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {u.estado ? (
                            <Badge className="bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/15">
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Inactivo</Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right pr-3">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditar(u)}
                              className="gap-1"
                            >
                              <Pencil className="size-4" />
                              Editar
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => pedirConfirmacionEliminar(u)}
                              className="gap-1"
                            >
                              <UserX className="size-4" />
                              Desactivar
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editId ? <Pencil className="size-5" /> : <UserPlus className="size-5" />}
              {tituloForm}
            </DialogTitle>
            <DialogDescription>
              {editId
                ? "Actualiza los datos del usuario seleccionado."
                : "Registra un nuevo usuario para el sistema."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="nombre_completo">Nombre completo</Label>
              <Input
                id="nombre_completo"
                name="nombre_completo"
                placeholder="Ej. Juan Pérez"
                value={formData.nombre_completo}
                onChange={handleChange}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="alias">Alias (usuario)</Label>
              <Input
                id="alias"
                name="alias"
                placeholder="Ej. jperez"
                value={formData.alias}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label>Rol</Label>
              <Select
                value={formData.rol}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, rol: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="password">
                Contraseña{" "}
                {editId && (
                  <span className="text-xs text-muted-foreground">
                    (dejar vacío para no cambiar)
                  </span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder={editId ? "••••••••" : "Mínimo 6 caracteres"}
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {editId && (
              <div className="flex items-center gap-3 md:col-span-2 pt-1">
                <Switch
                  checked={formData.estado}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, estado: checked }))
                  }
                />
                <Label className="cursor-pointer">Usuario activo</Label>
              </div>
            )}

            <DialogFooter className="md:col-span-2 pt-2">
              <div className="flex items-center gap-2">
                <Button type="submit">
                  {editId ? "Actualizar" : "Crear"}
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

      {/* CONFIRMAR DESACTIVAR */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              {usuarioAEliminar
                ? `Se desactivará a "${usuarioAEliminar.nombre_completo}" (${usuarioAEliminar.alias}).`
                : "Se desactivará el usuario seleccionado."}
              <br />
              Podrás volver a activarlo editando su estado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarEliminar}>
              Sí, desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
