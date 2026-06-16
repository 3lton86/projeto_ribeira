import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { setLocalToken } from "@/lib/localToken";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, User, AlertCircle } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { setLocalUser } = useLocalAuth();

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      if (data.token && data.user) {
        setLocalToken(data.token);
        setLocalUser(data.user as any);
        navigate("/");
      }
    },
    onError: (err) => {
      setError(err.message || "Usuário ou senha inválidos.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Preencha usuário e senha.");
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 20% 40%, oklch(0.25 0.10 240 / 0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, oklch(0.20 0.08 250 / 0.25) 0%, transparent 55%), oklch(0.08 0.02 240)",
      }}
    >
      {/* Geometric decorations */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-40" />
      <div className="absolute top-1/4 right-8 w-px h-32 bg-gradient-to-b from-transparent via-primary/40 to-transparent hidden lg:block" />
      <div className="absolute bottom-1/4 left-8 w-px h-24 bg-gradient-to-b from-transparent via-primary/40 to-transparent hidden lg:block" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo SEMPLA */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="flex items-center justify-center mb-5">
            <img
              src="/manus-storage/sempla-logo_0b157f04.png"
              alt="SEMPLA — Secretaria Municipal de Planejamento"
              className="h-20 w-auto object-contain rounded-xl"
              style={{ background: "rgba(255,255,255,0.96)", padding: "10px 20px" }}
            />
          </div>
          <div className="geo-line mt-4 mx-auto w-32" />
          <p className="text-muted-foreground text-xs mt-3 tracking-wide uppercase opacity-70">
            Plataforma de Acompanhamento do Plano de Equilíbrio Fiscal
          </p>
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
                  className="pl-9"
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
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full btn-teal font-semibold"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-50">
          Prefeitura Municipal do Natal · SEMPLA · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
