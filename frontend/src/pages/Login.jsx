// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// 🧩 Componentes shadcn
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

import { Eye, EyeOff } from "lucide-react"; // 👈 iconos del ojo

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false); // 👈 NUEVO
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      await login(alias, password);
      const usuario = JSON.parse(localStorage.getItem("usuario"));

      if (usuario?.rol === "ADMIN") navigate("/admin");
      else if (usuario?.rol === "CAJERO") navigate("/cajero");
      else navigate("/login");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl mx-auto grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">

        {/* LADO IZQUIERDO (branding) */}
        <div className="hidden lg:flex flex-col gap-6 rounded-2xl border border-border/60 bg-card/70 p-8 shadow-lg backdrop-blur-md animate-in fade-in-0 slide-in-from-left-8 duration-500">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-2xl border border-border/60 bg-muted/60 flex items-center justify-center shadow-md overflow-hidden">
              <img src="/LOGO.png" alt="Logo" className="h-12 w-auto" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                CabreraGriller
              </h1>
              <p className="text-sm text-muted-foreground">
                Panel profesional para administrar pedidos, caja y cocina.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">
              Bienvenido al sistema
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Centraliza la gestión del restaurante: controla los pedidos en
              tiempo real, organiza la producción y mantén el flujo de caja
              bajo control desde un solo lugar.
            </p>
          </div>

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Seguimiento de pedidos por rol (Admin / Cajero).
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              Tickets claros y optimizados para el servicio.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground" />
              Interfaz rápida, moderna y adaptable.
            </li>
          </ul>

          <p className="mt-2 text-xs text-muted-foreground">
            Acceso restringido al personal autorizado. Mantén tus credenciales
            seguras.
          </p>
        </div>

        {/* LOGIN CARD */}
        <Card className="w-full max-w-md mx-auto border border-border/70 bg-card/90 shadow-xl backdrop-blur-sm animate-in fade-in-0 slide-in-from-right-8 duration-500">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-center mb-1">
              <div className="h-12 w-12 rounded-xl border border-border/70 bg-muted/60 flex items-center justify-center overflow-hidden shadow-sm">
                <img src="/LOGO.png" alt="Logo" className="h-9 w-auto" />
              </div>
            </div>
            <CardTitle className="text-center text-xl font-semibold tracking-tight">
              Iniciar sesión
            </CardTitle>
            <CardDescription className="text-center text-sm">
              Ingresa tus credenciales para acceder al panel del restaurante.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive animate-in fade-in-0 slide-in-from-top-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Alias */}
              <div className="space-y-2">
                <Label htmlFor="alias">Alias</Label>
                <Input
                  id="alias"
                  type="text"
                  placeholder="Tu alias de usuario"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  required
                  autoComplete="username"
                  className="h-10"
                />
              </div>

              {/* Contraseña con botón de ojo */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={mostrarPassword ? "text" : "password"} // 👈 CAMBIA TIPO
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-10 pr-10"
                  />

                  {/* BOTON DEL OJO */}
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition"
                  >
                    {mostrarPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Solo personal autorizado del restaurante.
                </p>
              </div>

              <Button
                type="submit"
                disabled={cargando}
                className="w-full h-10 font-medium mt-2"
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                    Ingresando...
                  </span>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </form>

            <p className="text-[11px] text-center text-muted-foreground pt-1">
              © {new Date().getFullYear()} CabreraGriller · Sistema interno
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
