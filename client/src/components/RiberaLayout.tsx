import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  BarChart3,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Shield,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/acoes", label: "Ações & Entregas", icon: FileText },
  { href: "/governanca", label: "Governança", icon: Building2 },
];

export default function RiberaLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.reload(),
  });

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
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 185), oklch(0.65 0.20 50))" }}>
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="font-display font-bold text-sm text-foreground leading-tight">RIBEIRA</div>
              <div className="text-xs text-muted-foreground leading-tight">Sustentável</div>
            </div>
          </div>
          {/* Geometric line */}
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
          ) : isAuthenticated && user ? (
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 185), oklch(0.65 0.20 50))", color: "black" }}>
                  {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.role === "admin" ? "Administrador" : "Visualizador"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => logoutMutation.mutate()}
                className="nav-item w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <Link href={getLoginUrl()} className="nav-item w-full">
              <LogIn className="w-4 h-4" />
              <span>Entrar</span>
            </Link>
          )}
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
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
