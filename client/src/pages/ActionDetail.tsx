import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
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
  Link2,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { canEdit } = useLocalAuth();
  const utils = trpc.useUtils();

  const { data: action, isLoading } = trpc.actions.getById.useQuery({ id });
  const { data: comments } = trpc.comments.list.useQuery({ actionId: id });
  const { data: historyItems } = trpc.history.list.useQuery({ actionId: id });
  const { data: documents } = trpc.documents.list.useQuery({ actionId: id });

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<{
    status: Status;
    priority: Priority | "";
    dueDate: string;
    requestDate: string;
    receiptDate: string;
    documentBase: string;
    orgao: string;
    responsavelNome: string;
    responsavelCargo: string;
    responsavelTel: string;
    responsavelEmail: string;
  } | null>(null);
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "history" | "documents">("comments");
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<number | null>(null);

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

  const deleteDocMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Documento removido.");
      utils.documents.list.invalidate({ actionId: id });
      setDeleteDocId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const startEdit = () => {
    if (!action) return;
    setForm({
      status: action.status as Status,
      priority: (action.priority as Priority) ?? "",
      dueDate: formatDate((action as any).dueDate),
      requestDate: formatDate(action.requestDate),
      receiptDate: formatDate(action.receiptDate),
      documentBase: action.documentBase ?? "",
      orgao: (action as any).orgao ?? "",
      responsavelNome: (action as any).responsavelNome ?? "",
      responsavelCargo: (action as any).responsavelCargo ?? "",
      responsavelTel: (action as any).responsavelTel ?? "",
      responsavelEmail: (action as any).responsavelEmail ?? "",
    });
    setEditMode(true);
  };

  const saveEdit = () => {
    if (!form) return;
    updateMutation.mutate({
      id,
      status: form.status,
      priority: form.priority || undefined,
        dueDate: form.dueDate ? new Date(form.dueDate) : null,
      requestDate: form.requestDate ? new Date(form.requestDate) : undefined,
      receiptDate: form.receiptDate ? new Date(form.receiptDate) : undefined,
      documentBase: form.documentBase || undefined,
      orgao: (form.orgao || undefined) as any,
      responsavelNome: form.responsavelNome || undefined,
      responsavelCargo: form.responsavelCargo || undefined,
      responsavelTel: form.responsavelTel || undefined,
      responsavelEmail: form.responsavelEmail || undefined,
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
        <Link href="/acoes" className="block mt-2 text-primary hover:underline">Voltar para Ações</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/acoes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para Ações
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
          {canEdit && !editMode && (
            <button
              onClick={startEdit}
              className="flex-shrink-0 btn-teal px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Editar
            </button>
          )}
          {!canEdit && (
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
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Prazo Previsto</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Data da Solicitação</label>
                  <input
                    type="date"
                    value={form.requestDate}
                    onChange={(e) => setForm({ ...form, requestDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground"
                  />
                </div>
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

              {/* Órgão e Contato do Responsável */}
              <div className="pt-2 border-t border-border/30">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Órgão Responsável pela Entrega</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Órgão</label>
                    <select
                      value={form.orgao}
                      onChange={(e) => setForm({ ...form, orgao: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground"
                    >
                      <option value="">— Selecionar órgão —</option>
                      {["GAPRE","GAVIPRE","SMG","SEPAE","SECOM","PGM","CGM","SEMPLA","SEMAD","SEFIN","SME","SMS","SEMTAS","SECULT","SEMSUR","SEMUL","STTU","SEMDES","SETUR","SEL","SEINFRA","SEMIDH","SEHARPE","SEMURB","OGM","PROCON","NATALPREV","ARSBAN","FUNCARTE","URBANA","SAG"].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Nome do Responsável</label>
                    <input
                      type="text"
                      value={form.responsavelNome}
                      onChange={(e) => setForm({ ...form, responsavelNome: e.target.value })}
                      placeholder="Nome completo"
                      className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Cargo</label>
                    <input
                      type="text"
                      value={form.responsavelCargo}
                      onChange={(e) => setForm({ ...form, responsavelCargo: e.target.value })}
                      placeholder="Cargo ou função"
                      className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Telefone</label>
                    <input
                      type="tel"
                      value={form.responsavelTel}
                      onChange={(e) => setForm({ ...form, responsavelTel: e.target.value })}
                      placeholder="(84) 9 0000-0000"
                      className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">E-mail</label>
                    <input
                      type="email"
                      value={form.responsavelEmail}
                      onChange={(e) => setForm({ ...form, responsavelEmail: e.target.value })}
                      placeholder="email@orgao.natal.rn.gov.br"
                      className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Prioridade", value: action.priority, icon: AlertTriangle },
                  { label: "Prazo Previsto", value: formatDateTime((action as any).dueDate), icon: Calendar },
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

              {/* Órgão e Contato */}
              {((action as any).orgao || (action as any).responsavelNome || (action as any).responsavelEmail) && (
                <div className="pt-3 border-t border-border/30">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Órgão Responsável pela Entrega</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(action as any).orgao && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Órgão</div>
                        <div className="text-sm font-semibold text-foreground">{(action as any).orgao}</div>
                      </div>
                    )}
                    {(action as any).responsavelNome && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Nome</div>
                        <div className="text-sm text-foreground">{(action as any).responsavelNome}</div>
                      </div>
                    )}
                    {(action as any).responsavelCargo && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Cargo</div>
                        <div className="text-sm text-foreground">{(action as any).responsavelCargo}</div>
                      </div>
                    )}
                    {(action as any).responsavelTel && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Telefone</div>
                        <div className="text-sm text-foreground">{(action as any).responsavelTel}</div>
                      </div>
                    )}
                    {(action as any).responsavelEmail && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">E-mail</div>
                        <a href={`mailto:${(action as any).responsavelEmail}`} className="text-sm text-primary hover:underline">{(action as any).responsavelEmail}</a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Prompt to fill if empty and can edit */}
              {canEdit && !(action as any).orgao && !(action as any).responsavelNome && (
                <div className="pt-3 border-t border-border/30">
                  <button onClick={startEdit} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar órgão e contato do responsável
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Comments / History / Documents */}
      <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up">
        <div className="flex border-b border-border/50 overflow-x-auto">
          {[
            { key: "comments", label: "Comentários", icon: MessageSquare, count: comments?.length },
            { key: "history", label: "Histórico", icon: History, count: historyItems?.length },
            { key: "documents", label: "Documentos", icon: Link2, count: documents?.length },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count !== undefined && count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === key ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* COMMENTS TAB */}
          {activeTab === "comments" && (
            <div className="space-y-4">
              {canEdit ? (
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
                  Somente administradores podem adicionar comentários.
                </div>
              )}

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
                <div className="text-center py-8 text-muted-foreground text-sm">Nenhum comentário ainda.</div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
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
                <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma alteração registrada.</div>
              )}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              {canEdit && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAddDoc(true)}
                    className="btn-teal px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Link
                  </button>
                </div>
              )}

              {documents && documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border/30 hover:border-primary/30 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "oklch(0.72 0.18 185 / 0.15)" }}>
                        <Link2 className="w-4 h-4" style={{ color: "oklch(0.72 0.18 185)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{doc.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{doc.url}</div>
                        <div className="text-xs text-muted-foreground opacity-60 mt-0.5">
                          {doc.uploaderName ?? "Sistema"} · {formatDateTime(doc.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                          title="Abrir link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        {canEdit && (
                          <button
                            onClick={() => setDeleteDocId(doc.id)}
                            className="p-1.5 rounded hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Nenhum documento vinculado.
                  {canEdit && (
                    <p className="text-xs mt-1">Clique em "Adicionar Link" para vincular um documento.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Document Dialog */}
      <AddDocumentDialog
        open={showAddDoc}
        onClose={() => setShowAddDoc(false)}
        actionId={id}
        onSuccess={() => {
          utils.documents.list.invalidate({ actionId: id });
          setShowAddDoc(false);
        }}
      />

      {/* Delete Document Confirmation */}
      <AlertDialog open={deleteDocId !== null} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover documento?</AlertDialogTitle>
            <AlertDialogDescription>
              O link do documento será removido permanentemente desta ação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDocId !== null && deleteDocMutation.mutate({ id: deleteDocId })}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- Add Document Dialog ----

function AddDocumentDialog({
  open,
  onClose,
  actionId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  actionId: number;
  onSuccess: () => void;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const createMutation = trpc.documents.create.useMutation({
    onSuccess: () => {
      toast.success("Documento adicionado!");
      setLabel("");
      setUrl("");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;
    createMutation.mutate({ actionId, label: label.trim(), url: url.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Link de Documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome / Descrição do documento *</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Relatório Técnico v1.0"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>URL do arquivo *</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              type="url"
              required
            />
            <p className="text-xs text-muted-foreground">
              Informe o link completo (Google Drive, SharePoint, OneDrive, etc.)
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !label || !url}>
              {createMutation.isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
