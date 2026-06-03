import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Save,
  MessageSquare,
  History,
  Lock,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

type Status = "Pendente" | "Em Andamento" | "Concluído" | "Cancelado";
type Priority = "Alta" | "Média" | "Baixa";

function StatusBadge({ status }: { status: Status }) {
  const cls: Record<Status, string> = {
    Pendente: "badge-pendente",
    "Em Andamento": "badge-em-andamento",
    Concluído: "badge-concluido",
    Cancelado: "badge-cancelado",
  };
  const icons: Record<Status, React.ElementType> = {
    Pendente: Clock,
    "Em Andamento": AlertTriangle,
    Concluído: CheckCircle,
    Cancelado: XCircle,
  };
  const Icon = icons[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${cls[status]}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}

function AreaBadge({ area }: { area: string }) {
  const cls: Record<string, string> = {
    Governança: "badge-governanca",
    Técnico: "badge-tecnico",
    Jurídico: "badge-juridico",
    "Eco-Fin": "badge-ecofin",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${cls[area] ?? ""}`}>
      {area}
    </span>
  );
}

function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

export default function ActionDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const { data: action, isLoading } = trpc.actions.getById.useQuery({ id });
  const { data: comments } = trpc.comments.list.useQuery({ actionId: id });
  const { data: historyItems } = trpc.history.list.useQuery({ actionId: id });

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<{
    status: Status;
    priority: Priority | "";
    responsible: string;
    requestDate: string;
    receiptDate: string;
    documentBase: string;
  } | null>(null);
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "history">("comments");

  const updateMutation = trpc.actions.update.useMutation({
    onSuccess: () => {
      toast.success("Ação atualizada com sucesso!");
      utils.actions.getById.invalidate({ id });
      utils.history.list.invalidate({ actionId: id });
      setEditMode(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const commentMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      toast.success("Comentário adicionado!");
      utils.comments.list.invalidate({ actionId: id });
      setNewComment("");
    },
    onError: (e) => toast.error(e.message),
  });

  const startEdit = () => {
    if (!action) return;
    setForm({
      status: action.status as Status,
      priority: (action.priority as Priority) ?? "",
      responsible: action.responsible ?? "",
      requestDate: formatDate(action.requestDate),
      receiptDate: formatDate(action.receiptDate),
      documentBase: action.documentBase ?? "",
    });
    setEditMode(true);
  };

  const saveEdit = () => {
    if (!form) return;
    updateMutation.mutate({
      id,
      status: form.status,
      priority: form.priority || undefined,
      responsible: form.responsible || undefined,
      requestDate: form.requestDate ? new Date(form.requestDate) : undefined,
      receiptDate: form.receiptDate ? new Date(form.receiptDate) : undefined,
      documentBase: form.documentBase || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-secondary/50 rounded-lg w-48 animate-pulse" />
        <div className="glass-card rounded-xl h-64 animate-pulse" />
      </div>
    );
  }

  if (!action) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Ação não encontrada.
        <Link href="/acoes"><a className="block mt-2 text-primary hover:underline">Voltar para Ações</a></Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/acoes">
        <a className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Ações
        </a>
      </Link>

      {/* Main card */}
      <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up">
        {/* Card header */}
        <div className="px-5 py-4 border-b border-border/50 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <AreaBadge area={action.area} />
              <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                {action.itemCode}
              </span>
              <StatusBadge status={action.status as Status} />
            </div>
            <h2 className="text-base font-semibold text-foreground leading-relaxed">
              {action.description}
            </h2>
          </div>
          {isAdmin && !editMode && (
            <button
              onClick={startEdit}
              className="flex-shrink-0 btn-teal px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Editar
            </button>
          )}
          {!isAdmin && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
              Somente leitura
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="p-5">
          {editMode && form ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground"
                  >
                    {["Pendente", "Em Andamento", "Concluído", "Cancelado"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {/* Priority */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Prioridade</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground"
                  >
                    <option value="">— Selecionar —</option>
                    {["Alta", "Média", "Baixa"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                {/* Responsible */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Responsável</label>
                  <input
                    type="text"
                    value={form.responsible}
                    onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                    placeholder="Nome do responsável"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                {/* Request date */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Data da Solicitação</label>
                  <input
                    type="date"
                    value={form.requestDate}
                    onChange={(e) => setForm({ ...form, requestDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground"
                  />
                </div>
                {/* Receipt date */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Data do Recebimento</label>
                  <input
                    type="date"
                    value={form.receiptDate}
                    onChange={(e) => setForm({ ...form, receiptDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground"
                  />
                </div>
              </div>
              {/* Document base */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Base Documental</label>
                <textarea
                  value={form.documentBase}
                  onChange={(e) => setForm({ ...form, documentBase: e.target.value })}
                  rows={3}
                  placeholder="Documentos, fontes e referências..."
                  className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveEdit}
                  disabled={updateMutation.isPending}
                  className="btn-teal px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium glass-card hover:border-primary/40 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Prioridade", value: action.priority, icon: AlertTriangle },
                { label: "Responsável", value: action.responsible, icon: User },
                { label: "Data da Solicitação", value: formatDateTime(action.requestDate), icon: Calendar },
                { label: "Data do Recebimento", value: formatDateTime(action.receiptDate), icon: Calendar },
                { label: "Base Documental", value: action.documentBase, icon: FileText, full: true },
              ].map(({ label, value, icon: Icon, full }) => (
                <div key={label} className={`${full ? "sm:col-span-2 lg:col-span-3" : ""}`}>
                  <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </div>
                  <div className="text-sm text-foreground">
                    {value ?? <span className="text-muted-foreground italic">Não informado</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments & History tabs */}
      <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up">
        <div className="flex border-b border-border/50">
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === "comments"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Comentários
            {comments && comments.length > 0 && (
              <span className="bg-primary/20 text-primary rounded-full px-1.5 py-0.5 text-xs">
                {comments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="w-4 h-4" />
            Histórico
            {historyItems && historyItems.length > 0 && (
              <span className="bg-secondary rounded-full px-1.5 py-0.5 text-xs text-muted-foreground">
                {historyItems.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-5">
          {activeTab === "comments" && (
            <div className="space-y-4">
              {/* New comment */}
              {isAdmin ? (
                <div className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    placeholder="Adicionar observação ou comentário..."
                    className="w-full px-3 py-2.5 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/60"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        if (!newComment.trim()) return;
                        commentMutation.mutate({ actionId: id, content: newComment.trim() });
                      }}
                      disabled={!newComment.trim() || commentMutation.isPending}
                      className="btn-teal px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {commentMutation.isPending ? "Enviando..." : "Enviar"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-secondary/20 rounded-lg">
                  <Lock className="w-3.5 h-3.5" />
                  Faça login como administrador para adicionar comentários.
                </div>
              )}

              {/* Comments list */}
              {comments && comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{
                          background: "linear-gradient(135deg, oklch(0.72 0.18 185), oklch(0.65 0.20 50))",
                          color: "black",
                        }}
                      >
                        {(c.userName ?? "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 bg-secondary/20 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-foreground">{c.userName ?? "Usuário"}</span>
                          <span className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum comentário ainda.
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-2">
              {historyItems && historyItems.length > 0 ? (
                historyItems.map((h) => (
                  <div key={h.id} className="flex gap-3 items-start py-2 border-b border-border/20 last:border-0">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: "oklch(0.72 0.18 185)" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">{h.userName ?? "Usuário"}</span>
                        <span className="text-xs text-muted-foreground">alterou</span>
                        <span className="text-xs font-medium" style={{ color: "oklch(0.72 0.18 185)" }}>
                          {h.fieldChanged}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">{formatDateTime(h.createdAt)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        {h.oldValue && (
                          <>
                            <span className="line-through text-muted-foreground">{h.oldValue}</span>
                            <span className="text-muted-foreground">→</span>
                          </>
                        )}
                        <span className="text-foreground font-medium">{h.newValue ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma alteração registrada.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
