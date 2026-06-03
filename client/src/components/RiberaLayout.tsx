import {
  BarChart3,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Users,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { setLocalToken } from "@/main";
import { toast } from "sonner";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/acoes", label: "Ações & Entregas", icon: FileText },
  { href: "/governanca", label: "Governança", icon: Building2 },
];

const ROLE_DISPLAY: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  super_admin: { label: "Super Admin", icon: ShieldCheck, color: "text-yellow-400" },
  admin: { label: "Administrador", icon: Shield, color: "text-primary" },
  viewer: { label: "Visualizador", icon: Eye, color: "text-muted-foreground" },
};

export default function RiberaLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { localUser, loading, isSuperAdmin, setLocalUser } = useLocalAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logoutMutation = trpc.localAuth.logout.useMutation({
    onSuccess: () => {
      setLocalToken(null);
      setLocalUser(null);
      navigate("/login");
    },
  });

  const roleInfo = localUser ? (ROLE_DISPLAY[localUser.role] ?? ROLE_DISPLAY.viewer) : null;

  return (
    <div className="cinema-bg min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 glass-card border-r border-border/50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:flex`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 185), oklch(0.65 0.20 50))" }}
            >
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-sm text-foreground leading-tight">RIBEIRA</div>
              <div className="text-xs text-muted-foreground leading-tight">Sustentável</div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-xs font-semibold tracking-wide" style={{ color: "oklch(0.72 0.18 185)" }}>Bureau</div>
              <div className="text-xs font-bold text-foreground leading-none">Pad</div>
            </div>
          </div>
          <div className="geo-line mt-4" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
            Navegação
          </div>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${location === href ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              {location === href && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
            </Link>
          ))}

          {/* Super-admin: user management */}
          {isSuperAdmin && (
            <>
              <div className="geo-line my-3" />
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                Administração
              </div>
              <Link
                href="/usuarios"
                className={`nav-item ${location === "/usuarios" ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>Usuários</span>
                {location === "/usuarios" && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </Link>
            </>
          )}

          <div className="geo-line my-3" />

          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
            Áreas Temáticas
          </div>
          {[
            { label: "Governança", color: "badge-governanca", href: "/acoes?area=Governança" },
            { label: "Técnico", color: "badge-tecnico", href: "/acoes?area=Técnico" },
            { label: "Jurídico", color: "badge-juridico", href: "/acoes?area=Jurídico" },
            { label: "Eco-Fin", color: "badge-ecofin", href: "/acoes?area=Eco-Fin" },
          ].map(({ label, color, href }) => (
            <Link
              key={label}
              href={href}
              className="nav-item"
              onClick={() => setSidebarOpen(false)}
            >
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
                {label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Footer / Company signature */}
        <div className="px-4 py-3 border-t border-border/30 bg-black/20">
          <div className="text-center space-y-0.5">
            <div className="text-xs font-semibold" style={{ color: "oklch(0.72 0.18 185)" }}>Bureau Pad</div>
            <div className="text-[10px] text-muted-foreground leading-relaxed">
              Bureau de Inteligência Fundiária e Serviços Ltda
            </div>
            <div className="text-[10px] text-muted-foreground opacity-70">
              CNPJ 58.565.943/0001-41
            </div>
            <div className="text-[10px] text-muted-foreground opacity-60 leading-relaxed">
              Av. Eng. Roberto Freire, 1962<br />
              Capim Macio • Natal–RN • 59.082-095
            </div>
          </div>
        </div>

        {/* User section */}
        <div className="p-3 border-t border-border/50">
          {loading ? (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-muted rounded animate-pulse w-24" />
                <div className="h-2 bg-muted rounded animate-pulse w-16" />
              </div>
            </div>
          ) : localUser ? (
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.72 0.18 185), oklch(0.65 0.20 50))",
                    color: "black",
                  }}
                >
                  {localUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{localUser.name}</div>
                  {roleInfo && (
                    <div className={`text-xs flex items-center gap-1 ${roleInfo.color}`}>
                      <roleInfo.icon className="w-3 h-3" />
                      {roleInfo.label}
                    </div>
                  )}
                  {localUser.organization && (
                    <div className="text-xs text-muted-foreground truncate opacity-70">{localUser.organization}</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => logoutMutation.mutate()}
                className="nav-item w-full text-left"
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4" />
                <span>{logoutMutation.isPending ? "Saindo..." : "Sair"}</span>
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border/50 glass-card sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: "oklch(0.72 0.18 185)" }} />
            <span className="font-display font-bold text-sm">RIBEIRA SUSTENTÁVEL</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
