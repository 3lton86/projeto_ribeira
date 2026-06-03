import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { setLocalToken } from "@/lib/localToken";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, User, Waves } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { refetch, localUser, loading, setLocalUser } = useLocalAuth();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && localUser) {
      navigate("/");
    }
  }, [loading, localUser, navigate]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      // Save JWT token for Authorization header fallback
      setLocalToken(data.token);
      // Set user immediately in context + localStorage so ProtectedRouter sees it right away
      setLocalUser(data.user as any);
      toast.success("Login realizado com sucesso!");
      navigate("/");
      // Also trigger background refetch to sync with server
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Usuário ou senha inválidos.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Cinematic background */}
      <div className="absolute inset-0 bg-background" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 40%, oklch(0.45 0.15 185) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, oklch(0.45 0.18 45) 0%, transparent 55%)",
        }}
      />
      {/* Geometric decorations */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-40" />
      <div className="absolute top-1/4 right-8 w-px h-32 bg-gradient-to-b from-transparent via-primary/40 to-transparent hidden lg:block" />
      <div className="absolute bottom-1/4 left-8 w-px h-24 bg-gradient-to-b from-transparent via-accent/40 to-transparent hidden lg:block" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo / Brand */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4 shadow-lg shadow-primary/10">
            <Waves className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">RIBEIRA</h1>
          <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">Sustentável</p>
          <div className="geo-line mt-4 mx-auto w-24" />
          {/* Bureau Pad logo */}
          <div className="mt-5 flex items-center justify-center">
            <img
              src="/manus-storage/bureau-pad-logo_79a273e0.webp"
              alt="Bureau Pad"
              className="h-10 w-auto object-contain rounded-md"
              style={{ background: "rgba(255,255,255,0.90)", padding: "4px 10px" }}
            />
          </div>
        </div>

        {/* Login card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg font-semibold text-foreground mb-1">Acesso ao Sistema</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Informe suas credenciais para continuar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground/80">
                Usuário
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="nome.usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 bg-secondary/50 border-border/60 focus:border-primary/60"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 bg-secondary/50 border-border/60 focus:border-primary/60"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={loginMutation.isPending || !username || !password}
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-60">
          Acesso restrito. Credenciais fornecidas pelo administrador do sistema.
        </p>
      </div>
    </div>
  );
}
