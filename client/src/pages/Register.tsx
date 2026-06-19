import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, User, Lock, Briefcase, Building2 } from "lucide-react";
import { Link } from "wouter";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    position: "",
    organization: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (form.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    registerMutation.mutate({
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password,
      position: form.position.trim() || undefined,
      organization: form.organization.trim() || undefined,
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 20% 40%, oklch(0.25 0.10 240 / 0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, oklch(0.20 0.08 250 / 0.25) 0%, transparent 55%), oklch(0.08 0.02 240)",
      }}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-40" />

      <div className="relative z-10 w-full max-w-md px-6 py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-5">
            <img
              src="/manus-storage/sempla-logo_0b157f04.png"
              alt="SEMPLA"
              className="h-20 w-auto object-contain rounded-xl"
              style={{ background: "rgba(255,255,255,0.96)", padding: "10px 20px" }}
            />
          </div>
          <div className="geo-line mt-4 mx-auto w-32" />
          <p className="text-muted-foreground text-xs mt-3 tracking-wide uppercase opacity-70">
            PLATAFORMA DE GESTÃO DOCUMENTAL DE PPPs
          </p>
        </div>

        {success ? (
          <div className="glass-card rounded-2xl p-8 shadow-2xl text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-teal-400 mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Solicitação enviada!</h2>
            <p className="text-sm text-muted-foreground">
              Seu cadastro foi recebido e está aguardando aprovação de um administrador. Você receberá acesso assim que for aprovado.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full mt-2">
                Voltar ao Login
              </Button>
            </Link>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 shadow-2xl">
            <h2 className="text-lg font-semibold text-foreground mb-1">Solicitar Acesso</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Preencha os dados abaixo. Seu acesso será liberado após aprovação do administrador.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome completo */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-foreground/80">
                  Nome completo <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>

              {/* Usuário */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium text-foreground/80">
                  Nome de usuário <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="nome.sobrenome"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") }))}
                    className="pl-9 font-mono"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                    Senha <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mín. 6 caracteres"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      className="pl-9"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/80">
                    Confirmar senha <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repita a senha"
                      value={form.confirmPassword}
                      onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      className="pl-9"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              {/* Cargo */}
              <div className="space-y-1.5">
                <Label htmlFor="position" className="text-sm font-medium text-foreground/80">
                  Cargo / Função
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="position"
                    type="text"
                    placeholder="Ex.: Analista de Planejamento"
                    value={form.position}
                    onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Órgão */}
              <div className="space-y-1.5">
                <Label htmlFor="organization" className="text-sm font-medium text-foreground/80">
                  Secretaria / Órgão
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="organization"
                    type="text"
                    placeholder="Ex.: SEMPLA"
                    value={form.organization}
                    onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                    className="pl-9"
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
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Enviando...
                  </span>
                ) : (
                  "Solicitar Acesso"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Já tem acesso?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Fazer login
                </Link>
              </p>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-50">
          Prefeitura Municipal do Natal · SEMPLA · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
