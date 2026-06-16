import { Bell, BellRing, CheckCheck, FileText, MessageSquare, Settings } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotifType = "all" | "item_change" | "comment_doc";

export default function NotificationBell() {
  const { localUser, isAdmin, isSuperAdmin, isSetorial } = useLocalAuth();
  const [filter, setFilter] = useState<NotifType>("all");
  const [open, setOpen] = useState(false);

  const utils = trpc.useUtils();

  const { data: notifications = [], isLoading } = trpc.notifications.list.useQuery(
    { type: filter === "all" ? undefined : filter },
    { enabled: !!localUser && (isAdmin || isSuperAdmin || isSetorial), refetchInterval: 30000 }
  );

  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(
    undefined,
    { enabled: !!localUser && (isAdmin || isSuperAdmin || isSetorial), refetchInterval: 30000 }
  );

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  if (!localUser || (!isAdmin && !isSuperAdmin && !isSetorial)) return null;

  const unreadCount = (typeof unreadData === 'number' ? unreadData : 0);

  // Setorial users only see comment_doc notifications
  const availableFilters: { key: NotifType; label: string; icon: React.ElementType }[] = isSetorial
    ? [{ key: "all", label: "Todos", icon: Bell }]
    : [
        { key: "all", label: "Todos", icon: Bell },
        { key: "item_change", label: "Alterações", icon: Settings },
        { key: "comment_doc", label: "Comentários & Docs", icon: MessageSquare },
      ];

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "agora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-lg hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Notificações"
        >
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5 text-primary animate-pulse" />
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 shadow-xl border border-border/60 rounded-xl overflow-hidden"
        style={{ maxHeight: "520px", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Alertas</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                {unreadCount} novo{unreadCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="w-3 h-3" />
              Marcar todos
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        {!isSetorial && (
          <div className="flex gap-1 px-3 py-2 border-b border-border/30 bg-background flex-shrink-0">
            {availableFilters.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Notifications list */}
        <div className="overflow-y-auto flex-1" style={{ maxHeight: "360px" }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum alerta</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {filter === "item_change"
                  ? "Sem alterações de itens"
                  : filter === "comment_doc"
                  ? "Sem comentários ou documentos"
                  : "Tudo em dia por aqui"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors cursor-pointer group ${
                    !n.readAt ? "bg-primary/5 border-l-2 border-l-primary" : ""
                  }`}
                  onClick={() => {
                    if (!n.readAt) markRead.mutate({ id: n.id });
                  }}
                >
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      n.type === "item_change"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {n.type === "item_change" ? (
                      <Settings className="w-3.5 h-3.5" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold leading-tight ${!n.readAt ? "text-foreground" : "text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 mt-0.5">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                      {n.body}
                    </p>
                    {n.actionId && (
                      <Link
                        href={`/acoes/${n.actionId}`}
                        className="text-[10px] text-primary hover:underline mt-1 inline-block"
                        onClick={() => setOpen(false)}
                      >
                        Ver item {n.actionCode ? `(${n.actionCode})` : ""} →
                      </Link>
                    )}
                  </div>

                  {/* Unread dot */}
                  {!n.readAt && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isSetorial && (
          <div className="px-4 py-2 border-t border-border/30 bg-muted/20 flex-shrink-0">
            <Link
              href="/auditoria"
              className="text-xs text-primary hover:underline flex items-center gap-1"
              onClick={() => setOpen(false)}
            >
              <FileText className="w-3 h-3" />
              Ver log completo de auditoria →
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
