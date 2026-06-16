import {
  Download,
  FileText,
  Filter,
  MessageSquare,
  Search,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";

const EVENT_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  comment: { label: "Comentário", color: "bg-blue-100 text-blue-700", icon: MessageSquare },
  document: { label: "Documento", color: "bg-green-100 text-green-700", icon: FileText },
  item_change: { label: "Alteração de Item", color: "bg-amber-100 text-amber-700", icon: Shield },
  create: { label: "Criação", color: "bg-purple-100 text-purple-700", icon: ShieldCheck },
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  setorial: "Setorial",
  viewer: "Visualizador",
};

export default function AuditLog() {
  const [, navigate] = useLocation();
  const { isAdmin, isSuperAdmin } = useLocalAuth();
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 30;

  const { data: logs = [], isLoading } = trpc.audit.listAll.useQuery(undefined, {
    enabled: isAdmin || isSuperAdmin,
  });

  // Redirect non-admins
  if (!isAdmin && !isSuperAdmin) {
    navigate("/");
    return null;
  }

  const filtered = useMemo(() => {
    return logs.filter((log: any) => {
      const matchSearch =
        !search ||
        log.userName?.toLowerCase().includes(search.toLowerCase()) ||
        log.detail?.toLowerCase().includes(search.toLowerCase()) ||
        log.userOrgao?.toLowerCase().includes(search.toLowerCase()) ||
        String(log.actionId).includes(search);
      const matchEvent = eventFilter === "all" || log.eventType === eventFilter;
      const matchRole = roleFilter === "all" || log.userRole === roleFilter;
      return matchSearch && matchEvent && matchRole;
    });
  }, [logs, search, eventFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExport = () => {
    const header = ["Data/Hora", "Usuário", "Perfil", "Órgão", "Evento", "Item ID", "Detalhe"];
    const rows = filtered.map((log: any) => [
      new Date(log.createdAt).toLocaleString("pt-BR"),
      log.userName ?? "",
      ROLE_LABELS[log.userRole] ?? log.userRole ?? "",
      log.userOrgao ?? "",
      EVENT_LABELS[log.eventType]?.label ?? log.eventType ?? "",
      log.actionId ?? "",
      log.detail ?? "",
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Log de Auditoria
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro completo de todas as alterações realizadas na plataforma
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2"
          disabled={filtered.length === 0}
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 p-4 rounded-xl border border-border/50 bg-muted/20">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuário, órgão, detalhe..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9"
          />
        </div>
        <Select value={eventFilter} onValueChange={v => { setEventFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px] h-9">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os eventos</SelectItem>
            <SelectItem value="comment">Comentários</SelectItem>
            <SelectItem value="document">Documentos</SelectItem>
            <SelectItem value="item_change">Alterações de item</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] h-9">
            <User className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os perfis</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="setorial">Setorial</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center text-xs text-muted-foreground px-2">
          {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Shield className="w-12 h-12 text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground">Nenhum registro encontrado</p>
          {(search || eventFilter !== "all" || roleFilter !== "all") && (
            <button
              className="text-xs text-primary hover:underline mt-2"
              onClick={() => { setSearch(""); setEventFilter("all"); setRoleFilter("all"); }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data/Hora</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Órgão</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalhe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paginated.map((log: any) => {
                  const evt = EVENT_LABELS[log.eventType] ?? { label: log.eventType, color: "bg-gray-100 text-gray-700", icon: Shield };
                  const EvtIcon = evt.icon;
                  return (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit", month: "2-digit", year: "2-digit",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground text-xs">{log.userName ?? "—"}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {ROLE_LABELS[log.userRole] ?? log.userRole ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate">
                        {log.userOrgao ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${evt.color}`}>
                          <EvtIcon className="w-3 h-3" />
                          {evt.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {log.actionId ? (
                          <a
                            href={`/acoes/${log.actionId}`}
                            className="text-primary hover:underline"
                          >
                            #{log.actionId}
                          </a>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground max-w-[300px]">
                        <span className="line-clamp-2">{log.detail ?? "—"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>
                Mostrando {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Anterior
                </Button>
                <span className="flex items-center px-3 text-xs">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Próxima →
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
