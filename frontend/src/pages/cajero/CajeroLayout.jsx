// src/pages/cajero/CajeroLayout.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// icons
import {
  Moon,
  Sun,
  LayoutDashboard,
  ClipboardList,
  Users,
  CalendarDays,
  Menu,
  LogOut,
  Store,
} from "lucide-react";

const CajeroLayout = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 📌 Drawer mobile
  const [menuAbierto, setMenuAbierto] = useState(false);

  // 🌙 Tema
  const [isDark, setIsDark] = useState(false);

  const rol = usuario?.rol || "CAJERO";
  const tituloPanel = "Panel de caja";

  const menuItems = [
    {
      label: "Resumen",
      key: "resumen",
      path: "/cajero",
      icon: LayoutDashboard,
    },
    {
      label: "Pedidos",
      key: "pedidos",
      path: "/cajero/pedidos",
      icon: ClipboardList,
    },
    {
      label: "Clientes",
      key: "clientes",
      path: "/cajero/clientes",
      icon: Users,
    },
    {
      label: "Pedidos del día",
      key: "pedidos-del-dia",
      path: "/cajero/pedidos-del-dia",
      icon: CalendarDays,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  // ✅ leer tema al cargar
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const shouldBeDark = saved ? saved === "dark" : prefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  // ✅ toggle tema
  const toggleTheme = (value) => {
    const next = typeof value === "boolean" ? value : !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // título actual
  const currentTitle = useMemo(() => {
    const found = menuItems.find((m) => m.path === location.pathname);
    return found?.label || "Caja";
  }, [location.pathname]);

  // ---------- Sidebar content reutilizable ----------
  const SidebarContent = ({ onNavigate }) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Store className="size-5 text-sidebar-primary" />
              CabreraGriller
            </h1>
            <p className="text-xs text-sidebar-foreground/70">
              {tituloPanel}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleTheme()}
            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            title={isDark ? "Modo día" : "Modo noche"}
          >
            {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.path)}
                className={[
                  "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/90",
                ].join(" ")}
              >
                {/* Active bar */}
                <span
                  className={[
                    "absolute left-0 h-5 w-1 rounded-r-full transition",
                    active
                      ? "bg-sidebar-primary-foreground"
                      : "bg-transparent group-hover:bg-sidebar-foreground/30",
                  ].join(" ")}
                />

                <Icon className="size-4 opacity-90" />
                <span>{item.label}</span>

                {active && (
                  <Badge className="ml-auto bg-sidebar-primary-foreground/15 text-sidebar-primary-foreground text-[10px]">
                    actual
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      {/* Footer */}
      <div className="p-4 space-y-3">
        <div className="rounded-lg bg-sidebar-accent/60 px-3 py-2">
          <p className="text-sm font-semibold leading-tight">
            {usuario?.nombre_completo || "Usuario"}
          </p>
          <p className="text-xs text-sidebar-foreground/70">
            Rol: {rol}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-sidebar-accent/60 px-3 py-2">
          <div className="flex items-center gap-2 text-xs">
            {isDark ? (
              <Moon className="size-4 opacity-80" />
            ) : (
              <Sun className="size-4 opacity-80" />
            )}
            <span>{isDark ? "Modo noche" : "Modo día"}</span>
          </div>
          <Switch checked={isDark} onCheckedChange={toggleTheme} />
        </div>

        <Button
          variant="destructive"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* -------- Desktop sidebar -------- */}
        <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-sidebar-border">
          <SidebarContent onNavigate={(path) => navigate(path)} />
        </aside>

        {/* -------- Main area -------- */}
        <div className="flex flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 md:px-6">
              <div className="flex items-center gap-3">
                {/* Mobile drawer trigger */}
                <div className="md:hidden">
                  <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="size-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72">
                      <SidebarContent
                        onNavigate={(path) => {
                          navigate(path);
                          setMenuAbierto(false);
                        }}
                      />
                    </SheetContent>
                  </Sheet>
                </div>

                <div>
                  <h2 className="text-lg md:text-xl font-semibold tracking-tight">
                    {currentTitle}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {usuario?.nombre_completo || "Usuario"} · {rol}
                  </p>
                </div>
              </div>

              {/* Actions right */}
              <div className="flex items-center gap-2">
                {/* Theme toggle (desktop topbar) */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleTheme()}
                  title={isDark ? "Modo día" : "Modo noche"}
                >
                  {isDark ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="size-4" />
                  Salir
                </Button>
              </div>
            </div>
          </header>

          {/* Render pages */}
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default CajeroLayout;
