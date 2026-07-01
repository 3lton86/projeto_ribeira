import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { buildHierarchicalNumbers } from "../../../shared/hierarchyNumbers";
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
  Mail,
  Phone,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { ORGAOS_MUNICIPAIS, EMPRESAS_PARCEIRAS, isEmpresaParceira } from "../../../shared/orgaos";
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
  const [, navigate] = useLocation();
  const { canEdit, isSetorial, canInteractWithOrgao, canInteractWithAnyOrgao, localUser } = useLocalAuth();

  // Navigation list (Anterior / Próximo)
  const navList = useMemo<number[]>(() => {
    try {
      const raw = sessionStorage.getItem("actions-nav-list");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, []);
  const navIndex = navList.indexOf(id);
  const prevId = navIndex > 0 ? navList[navIndex - 1] : null;
  const nextId = navIndex >= 0 && navIndex < navList.length - 1 ? navList[navIndex + 1] : null;
  const navPosition = navList.length > 0 && navIndex >= 0 ? `${navIndex + 1} / ${navList.length}` : null;

  const navigateTo = (targetId: number) => {
    // Update the scroll-id so that on return the list highlights the last visited item
    sessionStorage.setItem("actions-scroll-y-id", String(targetId));
    navigate(`/acoes/${targetId}`);
  };

  // Keyboard shortcuts: ← Anterior, → Próximo — disabled when focus is inside a text input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isEditable = tag === "input" || tag === "textarea" || tag === "select" ||
        (e.target as HTMLElement)?.isContentEditable;
      if (isEditable) return;
      if (e.key === "ArrowLeft" && prevId !== null) {
        e.preventDefault();
        navigateTo(prevId);
      } else if (e.key === "ArrowRight" && nextId !== null) {
        e.preventDefault();
        navigateTo(nextId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevId, nextId]); // eslint-disable-line react-hooks/exhaustive-deps

  const utils = trpc.useUtils();

  const { data: action, isLoading } = trpc.actions.getById.useQuery({ id });
  const { data: allActions } = trpc.actions.list.useQuery({});

  // Compute hierarchical display number for this action
  const hierNum = useMemo(() => {
    if (!allActions || !action) return null;
    const map = buildHierarchicalNumbers(
      allActions.map((a) => ({
        id: a.id,
        itemCode: a.itemCode,
        parentCode: (a as any).parentCode ?? null,
        isGroup: a.isGroup,
        sortOrder: (a as any).sortOrder ?? 0,
        area: a.area,
      }))
    );
    return map.get(action.id) ?? null;
  }, [allActions, action]);

  const { data: comments } = trpc.comments.list.useQuery({ actionId: id });
  const { data: historyItems } = trpc.history.list.useQuery({ actionId: id });
  const { data: documents } = trpc.documents.list.useQuery({ actionId: id });
  const { data: auditItems } = trpc.audit.list.useQuery(
    { actionId: id },
    { enabled: canEdit } // only fetch for admins
  );
  const { data: actionOrgaos } = trpc.orgaos.list.useQuery({ actionId: id });
  const { data: contactHistoryItems } = trpc.contactHistory.list.useQuery({ actionId: id });

  // Tabela de responsáveis por órgão (para auto-preenchimento e seleção)
  const { data: orgaoResponsaveisAll } = trpc.orgaoResponsaveis.list.useQuery({ orgao: undefined });
  // Lista de usuários locais para o seletor de usuário vinculado (apenas admins chegam aqui)
  const { data: localUsersData } = trpc.localAuth.users.list.useQuery(undefined, { enabled: canEdit });

  // For setorial users: check if they can interact with this action.
  // Uses action_orgaos as the single source of truth (legacy scalar orgao was migrated).
  const coOrgaoNames = (actionOrgaos ?? []).map(o => o.orgao);
  const canInteract = canEdit || (isSetorial && canInteractWithAnyOrgao(coOrgaoNames));

  // Alerta visual: item atrasado ou com documentos pendentes
  const isOverdue = useMemo(() => {
    if (!action) return false;
    const due = (action as any).dueDate;
    if (!due) return false;
    return new Date(due) < new Date() && action.status !== "Concluído" && action.status !== "Cancelado";
  }, [action]);

  const hasPendingDocs = useMemo(() => {
    return (documents ?? []).some((d) => d.docStatus === "pending");
  }, [documents]);

  const contactAlert = isOverdue || hasPendingDocs;

  // Função para gerar mensagem padrão de contato
  const buildContactMessage = (orgaoName: string, responsavelNome: string, channel: "email" | "whatsapp", commentText?: string) => {
    const title = action?.description ?? "";
    const hierStr = hierNum ? `[${hierNum}] ` : "";
    const dueStr = (action as any)?.dueDate
      ? new Date((action as any).dueDate).toLocaleDateString("pt-BR")
      : "a definir";
    const status = action?.status ?? "";
    const alertLine = isOverdue
      ? `\u26a0️ ATENÇÃO: Este item está com prazo VENCIDO.\n`
      : hasPendingDocs
      ? `⚠️ ATENÇÃO: Este item possui documentos com pendência.\n`
      : "";
    if (commentText) {
      // Mensagem de comentário
      return `${alertLine}Prezado(a) ${responsavelNome || "Responsável"},\n\n` +
        `Ref. ao item ${hierStr}"${title}" (${orgaoName}):\n\n` +
        `${commentText}\n\n` +
        `Prazo previsto: ${dueStr} | Status: ${status}\n\n` +
        `Ref. a demanda monitorada na plataforma bit.ly/ribeirapmi`;
    }
    return `${alertLine}Prezado(a) ${responsavelNome || "Responsável"},\n\n` +
      `Solicitamos atenção ao item ${hierStr}"${title}" sob responsabilidade de ${orgaoName}.\n\n` +
      `Prazo previsto: ${dueStr}\nStatus atual: ${status}\n\n` +
      `Ref. a demanda monitorada na plataforma bit.ly/ribeirapmi`;
  };

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<{
    status: Status;
    priority: Priority | "";
    dueDate: string;
    requestDate: string;
    receiptDate: string;
    documentBase: string;
    observacoes: string;
  } | null>(null);
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "history" | "documents" | "contacts" | "auditoria">("comments");
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
  const [showAddOrgao, setShowAddOrgao] = useState(false);
  const [deleteOrgaoId, setDeleteOrgaoId] = useState<number | null>(null);
  const [newOrgao, setNewOrgao] = useState({ orgao: "", responsavelNome: "", responsavelCargo: "", responsavelTel: "", responsavelEmail: "" });
  // Estado para edição de órgão existente
  const [editOrgaoId, setEditOrgaoId] = useState<number | null>(null);
  const [editOrgao, setEditOrgao] = useState({ orgao: "", responsavelNome: "", responsavelCargo: "", responsavelTel: "", responsavelEmail: "", localUserId: null as number | null });
  // Contact send dialog state — suporta múltiplos destinatários
  type ContactRecipient = {
    id: number;
    orgao: string;
    name: string;
    contact: string;
    selected: boolean;
  };
  const [contactSendDialog, setContactSendDialog] = useState<{
    channel: "email" | "whatsapp";
    recipients: ContactRecipient[];
    message: string;
  } | null>(null);

  // Helper para abrir o dialog de contato com suporte a múltiplos destinatários
  const openContactDialog = (
    channel: "email" | "whatsapp",
    primaryOrgao: { id: number; orgao: string; responsavelNome?: string | null; responsavelTel?: string | null; responsavelEmail?: string | null },
    commentText?: string
  ) => {
    const msg = buildContactMessage(primaryOrgao.orgao, primaryOrgao.responsavelNome ?? "", channel, commentText);
    // Coletar todos os órgãos com o contato relevante
    const allWithContact = (actionOrgaos ?? []).filter(o =>
      channel === "whatsapp" ? !!o.responsavelTel : !!o.responsavelEmail
    );
    const recipients: ContactRecipient[] = allWithContact.map(o => ({
      id: o.id,
      orgao: o.orgao,
      name: o.responsavelNome ?? o.orgao,
      contact: channel === "whatsapp" ? (o.responsavelTel ?? "") : (o.responsavelEmail ?? ""),
      selected: o.id === primaryOrgao.id,
    }));
    setContactSendDialog({ channel, recipients, message: msg });
  };

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

  const updateDocStatusMutation = trpc.documents.updateStatus.useMutation({
    onSuccess: () => utils.documents.list.invalidate({ actionId: id }),
    onError: () => toast.error("Erro ao atualizar status do documento."),
  });

  const addOrgaoMutation = trpc.orgaos.add.useMutation({
    onSuccess: () => {
      toast.success("Orgão adicionado!");
      utils.orgaos.list.invalidate({ actionId: id });
      setShowAddOrgao(false);
      setNewOrgao({ orgao: "", responsavelNome: "", responsavelCargo: "", responsavelTel: "", responsavelEmail: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const removeOrgaoMutation = trpc.orgaos.remove.useMutation({
    onSuccess: () => {
      toast.success("Orgão removido.");
      utils.orgaos.list.invalidate({ actionId: id });
      setDeleteOrgaoId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateOrgaoMutation = trpc.orgaos.update.useMutation({
    onSuccess: () => {
      toast.success("Orgão atualizado!");
      utils.orgaos.list.invalidate({ actionId: id });
      setEditOrgaoId(null);
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

  const addContactHistoryMutation = trpc.contactHistory.add.useMutation({
    onSuccess: () => {
      utils.contactHistory.list.invalidate({ actionId: id });
    },
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
      observacoes: (action as any).observacoes ?? "",
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
      observacoes: form.observacoes || undefined,
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
      {/* Navigation bar: Voltar + Anterior/Próximo */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/acoes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Ações
        </Link>

        {navList.length > 0 && navIndex >= 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => prevId !== null && navigateTo(prevId)}
              disabled={prevId === null}
              title={prevId !== null ? `Item anterior (${navIndex} de ${navList.length}) — Tecla ←` : "Primeiro item da lista"}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <span className="text-xs text-muted-foreground px-2 tabular-nums">
              {navPosition}
            </span>

            <button
              onClick={() => nextId !== null && navigateTo(nextId)}
              disabled={nextId === null}
              title={nextId !== null ? `Próximo item (${navIndex + 2} de ${navList.length}) — Tecla →` : "Último item da lista"}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border"
            >
              <span className="hidden sm:inline">Próximo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main card */}
      <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up">
        {/* Card header */}
        <div className="px-5 py-4 border-b border-border/50 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <AreaBadge area={action.area} />
              <span
                className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded"
                title={`Código interno: ${action.itemCode}`}
              >
                {hierNum ?? action.itemCode}
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
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={4}
                  placeholder="Anotações, observações e informações complementares..."
                  className="w-full px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>

              {/* Órgãos Responsáveis pela Entrega (múltiplos) */}
              <div className="pt-2 border-t border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">Órgãos Responsáveis pela Entrega</p>
                  <button
                    type="button"
                    onClick={() => setShowAddOrgao(true)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar órgão
                  </button>
                </div>
                {actionOrgaos && actionOrgaos.length > 0 ? (
                  <div className="space-y-3">
                    {actionOrgaos.map((o) => (
                      <div key={o.id} className="p-3 rounded-lg border border-border/40 bg-secondary/20 relative group">
                        <button
                          type="button"
                          onClick={() => setDeleteOrgaoId(o.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                          title="Remover órgão"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="font-semibold text-sm text-foreground mb-1">{o.orgao}</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          {o.responsavelNome && <span>{o.responsavelNome}</span>}
                          {o.responsavelCargo && <span>{o.responsavelCargo}</span>}
                          {o.responsavelTel && <span>{o.responsavelTel}</span>}
                          {o.responsavelEmail && <span>{o.responsavelEmail}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nenhum órgão adicionado.</p>
                )}
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
                  { label: "Observações", value: (action as any).observacoes, icon: FileText, full: true },
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

              {/* Órgãos Responsáveis pela Entrega (múltiplos) */}
              <div className="pt-3 border-t border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">Órgãos Responsáveis pela Entrega</p>
                  {canEdit && (
                    <button
                      onClick={() => setShowAddOrgao(true)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar órgão
                    </button>
                  )}
                </div>
                {actionOrgaos && actionOrgaos.length > 0 ? (
                  <div className="space-y-3">
                    {actionOrgaos.map((o) => (
                      <div key={o.id} className="p-3 rounded-lg border border-border/40 bg-secondary/20 relative group">
                        {canEdit && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditOrgaoId(o.id);
                                setEditOrgao({
                                  orgao: o.orgao,
                                  responsavelNome: o.responsavelNome ?? "",
                                  responsavelCargo: o.responsavelCargo ?? "",
                                  responsavelTel: o.responsavelTel ?? "",
                                  responsavelEmail: o.responsavelEmail ?? "",
                                  localUserId: null,
                                });
                              }}
                              className="inline-flex items-center justify-center w-5 h-5 rounded text-primary hover:bg-primary/10 transition-colors"
                              title="Editar órgão"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeleteOrgaoId(o.id)}
                              className="inline-flex items-center justify-center w-5 h-5 rounded text-destructive hover:bg-destructive/10 transition-colors"
                              title="Remover órgão"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <div className="font-semibold text-sm text-foreground mb-1 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-primary" />
                          {o.orgao}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          {o.responsavelNome && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground/70">Nome: </span>
                              <span>{o.responsavelNome}</span>
                              {/* Botões de contato rápido com mensagem pré-preenchida e alerta visual */}
                              <div className="flex items-center gap-1 ml-1">
                                {o.responsavelEmail && (
                                  <button
                                    title={`Enviar e-mail para ${o.responsavelNome}${contactAlert ? " (⚠️ item com alerta)" : ""}`}
                                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-colors ${
                                      contactAlert
                                        ? "bg-orange-500/20 text-orange-600 hover:bg-orange-500/35 ring-1 ring-orange-400/60"
                                        : "bg-blue-500/15 text-blue-500 hover:bg-blue-500/30"
                                    }`}
                                    onClick={() => openContactDialog("email", o)}
                                  >
                                    <Mail className="w-3 h-3" />
                                  </button>
                                )}
                                {o.responsavelTel && (
                                  <button
                                    title={`WhatsApp para ${o.responsavelNome}${contactAlert ? " (⚠️ item com alerta)" : ""}`}
                                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-colors ${
                                      contactAlert
                                        ? "bg-orange-500/20 text-orange-600 hover:bg-orange-500/35 ring-1 ring-orange-400/60"
                                        : "bg-green-500/15 text-green-600 hover:bg-green-500/30"
                                    }`}
                                    onClick={() => openContactDialog("whatsapp", o)}
                                  >
                                    <Phone className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          {o.responsavelCargo && (
                            <div><span className="font-medium text-foreground/70">Cargo: </span>{o.responsavelCargo}</div>
                          )}
                          {o.responsavelTel && (
                            <div><span className="font-medium text-foreground/70">Tel: </span>{o.responsavelTel}</div>
                          )}
                          {o.responsavelEmail && (
                            <div className="col-span-2"><span className="font-medium text-foreground/70">E-mail: </span>
                              <a href={`mailto:${o.responsavelEmail}`} className="text-primary hover:underline">{o.responsavelEmail}</a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nenhum órgão cadastrado.</p>
                )}
              </div>
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
            { key: "contacts", label: "Contatos", icon: PhoneCall, count: contactHistoryItems?.length },
            ...(canEdit ? [{ key: "auditoria", label: "Auditoria", icon: ShieldCheck, count: auditItems?.length }] : []),
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
              {canInteract ? (
                <div className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    placeholder="Adicionar observação ou comentário..."
                    className="w-full px-3 py-2.5 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/60"
                  />
                  <div className="flex items-center justify-between gap-2">
                    {/* Botões de envio por WhatsApp/e-mail do comentário */}
                    <div className="flex items-center gap-1.5">
                      {(actionOrgaos ?? []).filter(o => o.responsavelTel).map((o) => (
                        <button
                          key={`wa-${o.id}`}
                          title={`Enviar comentário via WhatsApp para ${o.responsavelNome ?? o.orgao}`}
                          disabled={!newComment.trim()}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
                            contactAlert
                              ? "bg-orange-500/20 text-orange-600 hover:bg-orange-500/30 ring-1 ring-orange-400/50"
                              : "bg-green-500/15 text-green-700 hover:bg-green-500/25"
                          }`}
                          onClick={() => {
                            if (!newComment.trim()) return;
                            openContactDialog("whatsapp", o, newComment.trim());
                          }}
                        >
                          <Phone className="w-3 h-3" />
                          {o.orgao}
                        </button>
                      ))}
                      {(actionOrgaos ?? []).filter(o => o.responsavelEmail).map((o) => (
                        <button
                          key={`em-${o.id}`}
                          title={`Enviar comentário por e-mail para ${o.responsavelNome ?? o.orgao}`}
                          disabled={!newComment.trim()}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
                            contactAlert
                              ? "bg-orange-500/20 text-orange-600 hover:bg-orange-500/30 ring-1 ring-orange-400/50"
                              : "bg-blue-500/15 text-blue-600 hover:bg-blue-500/25"
                          }`}
                          onClick={() => {
                            if (!newComment.trim()) return;
                            openContactDialog("email", o, newComment.trim());
                          }}
                        >
                          <Mail className="w-3 h-3" />
                          {o.orgao}
                        </button>
                      ))}
                    </div>
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
                  {isSetorial
                    ? "Seu perfil setorial não tem acesso ao órgão desta ação."
                    : "Somente administradores e usuários setoriais autorizados podem comentar."}
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
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">{c.userName ?? "Usuário"}</span>
                          {(c as any).userOrganization && (
                            <span className="text-xs text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">
                              {(c as any).userOrganization}
                            </span>
                          )}
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
                        {(h as any).userOrganization && (
                          <span className="text-xs text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">
                            {(h as any).userOrganization}
                          </span>
                        )}
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

          {/* AUDIT TAB — admin only */}
          {activeTab === "auditoria" && canEdit && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3 p-3 rounded-lg text-xs" style={{ background: "oklch(0.38 0.16 240 / 0.06)", border: "1px solid oklch(0.38 0.16 240 / 0.20)" }}>
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.38 0.16 240)" }} />
                <span className="text-muted-foreground">Registro de ações de usuários setoriais neste item. Visível apenas para administradores.</span>
              </div>
              {auditItems && auditItems.length > 0 ? (
                <div className="space-y-2">
                  {auditItems.map((entry) => (
                    <div key={entry.id} className="flex gap-3 items-start p-3 rounded-lg bg-secondary/20 border border-border/30">
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{ background: entry.eventType === "comment" ? "oklch(0.38 0.16 240 / 0.15)" : "oklch(0.45 0.18 145 / 0.15)", color: entry.eventType === "comment" ? "oklch(0.30 0.16 240)" : "oklch(0.30 0.18 145)" }}
                      >
                        {entry.eventType === "comment" ? <MessageSquare className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-semibold text-foreground">{entry.userName}</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: "oklch(0.38 0.16 240 / 0.10)", color: "oklch(0.30 0.16 240)" }}
                          >
                            {entry.userRole}
                          </span>
                          {entry.userOrgao && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="w-3 h-3" />
                              {entry.userOrgao}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(entry.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{entry.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Nenhum evento de auditoria registrado para este item.
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              {canInteract && (
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{doc.label}</span>
                          {doc.docStatus === "accepted" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 flex-shrink-0">
                              <CheckCircle className="w-3 h-3" />
                              DOC ACEITO
                            </span>
                          )}
                          {doc.docStatus === "pending" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0">
                              <AlertTriangle className="w-3 h-3" />
                              DOC COM PENDÊNCIA
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{doc.url}</div>
                        <div className="text-xs text-muted-foreground opacity-60 mt-0.5">
                          {doc.uploaderName ?? "Sistema"} · {formatDateTime(doc.createdAt)}
                          {doc.docStatus && doc.statusUpdatedBy && (
                            <span className="ml-1">· Status por {doc.statusUpdatedBy}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {canEdit && (
                          <div className="relative">
                            <select
                              value={doc.docStatus ?? ""}
                              onChange={(e) =>
                                updateDocStatusMutation.mutate({
                                  id: doc.id,
                                  docStatus: (e.target.value as "accepted" | "pending") || null,
                                })
                              }
                              className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground cursor-pointer hover:border-primary/50 transition-colors appearance-none pr-6"
                              title="Alterar status do documento"
                            >
                              <option value="">— Status —</option>
                              <option value="accepted">DOC ACEITO</option>
                              <option value="pending">DOC COM PENDÊNCIA</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                          </div>
                        )}
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
                            title="Remover (apenas admins)"
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
                  {canInteract && (
                    <p className="text-xs mt-1">Clique em "Adicionar Link" para vincular um documento.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CONTACTS TAB */}
          {activeTab === "contacts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <PhoneCall className="w-4 h-4" style={{ color: "oklch(0.55 0.18 185)" }} />
                  Histórico de Contatos
                </h3>
                <p className="text-xs text-muted-foreground">Registros de mensagens enviadas aos responsáveis.</p>
              </div>
              {contactHistoryItems && contactHistoryItems.length > 0 ? (
                <div className="space-y-2">
                  {contactHistoryItems.map((entry: any) => (
                    <div key={entry.id} className="flex gap-3 items-start p-3 rounded-lg bg-secondary/20 border border-border/30">
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{
                          background: entry.channel === "whatsapp" ? "oklch(0.45 0.18 145 / 0.15)" : "oklch(0.38 0.16 240 / 0.15)",
                          color: entry.channel === "whatsapp" ? "oklch(0.30 0.18 145)" : "oklch(0.30 0.16 240)",
                        }}
                      >
                        {entry.channel === "whatsapp" ? <Phone className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-semibold text-foreground">{entry.sentBy ?? "Sistema"}</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              background: entry.channel === "whatsapp" ? "oklch(0.45 0.18 145 / 0.10)" : "oklch(0.38 0.16 240 / 0.10)",
                              color: entry.channel === "whatsapp" ? "oklch(0.30 0.18 145)" : "oklch(0.30 0.16 240)",
                            }}
                          >
                            {entry.channel === "whatsapp" ? "WhatsApp" : "E-mail"}
                          </span>
                          <span className="text-xs text-muted-foreground">→ {entry.recipientName}</span>
                          {entry.recipientContact && (
                            <span className="text-xs text-muted-foreground opacity-70">{entry.recipientContact}</span>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(entry.sentAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{entry.messagePreview}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <PhoneCall className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Nenhum contato registrado para este item.
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

      {/* Dialog: Adicionar Órgão */}
      <Dialog open={showAddOrgao} onOpenChange={setShowAddOrgao}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Adicionar Órgão Responsável
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs uppercase tracking-wider">Órgão *</Label>
              {/* Órgãos já cadastrados neste item (para bloquear duplicatas) */}
              {(() => {
                const alreadyAdded = new Set((actionOrgaos ?? []).map(o => o.orgao));
                return (
                  <select
                    value={newOrgao.orgao}
                    onChange={(e) => {
                      const selectedOrgao = e.target.value;
                      // Auto-fill with first responsavel from orgao_responsaveis table
                      const firstResp = (orgaoResponsaveisAll ?? []).find(r => r.orgao === selectedOrgao);
                      setNewOrgao({
                        orgao: selectedOrgao,
                        responsavelNome: firstResp?.nome ?? "",
                        responsavelCargo: firstResp?.cargo ?? "",
                        responsavelTel: firstResp?.telefone ?? "",
                        responsavelEmail: firstResp?.email ?? "",
                      });
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground"
                  >
                    <option value="">— Selecionar órgão —</option>
                    <optgroup label="Órgãos Municipais">
                      {ORGAOS_MUNICIPAIS.map((o) => (
                        <option key={o} value={o} disabled={alreadyAdded.has(o)}>
                          {o}{alreadyAdded.has(o) ? " (já adicionado)" : ""}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Empresas Parceiras">
                      {EMPRESAS_PARCEIRAS.map((o) => (
                        <option key={o} value={o} disabled={alreadyAdded.has(o)}>
                          {o}{alreadyAdded.has(o) ? " (já adicionado)" : ""}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                );
              })()}
            </div>

            {/* If there are registered responsaveis for the selected orgao, show a selector */}
            {newOrgao.orgao && (orgaoResponsaveisAll ?? []).filter(r => r.orgao === newOrgao.orgao).length > 0 && (
              <div>
                <Label className="text-xs uppercase tracking-wider">Selecionar Responsável Cadastrado</Label>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground"
                  value={(orgaoResponsaveisAll ?? []).find(r =>
                    r.orgao === newOrgao.orgao &&
                    r.nome === newOrgao.responsavelNome
                  )?.id ?? ""}
                  onChange={(e) => {
                    const resp = (orgaoResponsaveisAll ?? []).find(r => r.id === Number(e.target.value));
                    if (resp) {
                      setNewOrgao(prev => ({
                        ...prev,
                        responsavelNome: resp.nome,
                        responsavelCargo: resp.cargo ?? "",
                        responsavelTel: resp.telefone ?? "",
                        responsavelEmail: resp.email ?? "",
                      }));
                    }
                  }}
                >
                  <option value="">— Selecionar responsável —</option>
                  {(orgaoResponsaveisAll ?? []).filter(r => r.orgao === newOrgao.orgao).map(r => (
                    <option key={r.id} value={r.id}>{r.nome}{r.cargo ? ` — ${r.cargo}` : ""}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Ou preencha manualmente abaixo para um responsável diferente.</p>
              </div>
            )}

            <div>
              <Label className="text-xs uppercase tracking-wider">Nome do Responsável</Label>
              <Input
                value={newOrgao.responsavelNome}
                onChange={(e) => setNewOrgao({ ...newOrgao, responsavelNome: e.target.value })}
                placeholder="Nome completo"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider">Cargo</Label>
                <Input
                  value={newOrgao.responsavelCargo}
                  onChange={(e) => setNewOrgao({ ...newOrgao, responsavelCargo: e.target.value })}
                  placeholder="Cargo ou função"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider">Telefone</Label>
                <Input
                  value={newOrgao.responsavelTel}
                  onChange={(e) => setNewOrgao({ ...newOrgao, responsavelTel: e.target.value })}
                  placeholder="(84) 9 0000-0000"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">E-mail</Label>
              <Input
                type="email"
                value={newOrgao.responsavelEmail}
                onChange={(e) => setNewOrgao({ ...newOrgao, responsavelEmail: e.target.value })}
                placeholder="email@orgao.natal.rn.gov.br"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddOrgao(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!newOrgao.orgao) { toast.error("Selecione um órgão."); return; }
                addOrgaoMutation.mutate({
                  actionId: id,
                  orgao: newOrgao.orgao as any,
                  responsavelNome: newOrgao.responsavelNome || undefined,
                  responsavelCargo: newOrgao.responsavelCargo || undefined,
                  responsavelTel: newOrgao.responsavelTel || undefined,
                  responsavelEmail: newOrgao.responsavelEmail || undefined,
                });
              }}
              disabled={addOrgaoMutation.isPending}
            >
              {addOrgaoMutation.isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Órgão */}
      <Dialog open={editOrgaoId !== null} onOpenChange={(open) => !open && setEditOrgaoId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Editar Órgão Responsável
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs uppercase tracking-wider">Órgão *</Label>
              <select
                value={editOrgao.orgao}
                onChange={(e) => setEditOrgao({ ...editOrgao, orgao: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground"
              >
                <option value="">— Selecionar órgão —</option>
                <optgroup label="Órgãos Municipais">
                  {ORGAOS_MUNICIPAIS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </optgroup>
                <optgroup label="Empresas Parceiras">
                  {EMPRESAS_PARCEIRAS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Seletor de usuário vinculado — filtrado pelos usuários do órgão selecionado */}
            {editOrgao.orgao && (localUsersData ?? []).filter(u =>
              (u as any).allowedOrgaos?.includes(editOrgao.orgao) ||
              (u as any).allowedOrgaos?.includes("TODOS") ||
              (u as any).role === "admin" || (u as any).role === "super_admin"
            ).length > 0 && (
              <div>
                <Label className="text-xs uppercase tracking-wider">Vincular a Usuário Cadastrado</Label>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground"
                  value={editOrgao.localUserId !== null ? String(editOrgao.localUserId) : ""}
                  onChange={(e) => {
                    const userId = e.target.value ? Number(e.target.value) : null;
                    const user = userId !== null ? (localUsersData ?? []).find(u => u.id === userId) : null;
                    setEditOrgao(prev => ({
                      ...prev,
                      localUserId: userId,
                      // Auto-preenche campos do responsável com dados do usuário selecionado
                      responsavelNome: user ? ((user as any).name ?? prev.responsavelNome) : prev.responsavelNome,
                      responsavelCargo: user ? ((user as any).position ?? prev.responsavelCargo) : prev.responsavelCargo,
                      responsavelTel: user ? ((user as any).telefone ?? prev.responsavelTel) : prev.responsavelTel,
                      responsavelEmail: user ? ((user as any).email ?? prev.responsavelEmail) : prev.responsavelEmail,
                    }));
                  }}
                >
                  <option value="">— Sem vínculo —</option>
                  {(localUsersData ?? []).filter(u =>
                    (u as any).allowedOrgaos?.includes(editOrgao.orgao) ||
                    (u as any).allowedOrgaos?.includes("TODOS") ||
                    (u as any).role === "admin" || (u as any).role === "super_admin"
                  ).map(u => (
                    <option key={u.id} value={u.id}>
                      {(u as any).name} ({(u as any).username}) — {(u as any).role}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Selecionar um usuário preenche automaticamente os campos abaixo.</p>
              </div>
            )}

            {/* Seletor de responsável cadastrado (orgao_responsaveis) */}
            {editOrgao.orgao && (orgaoResponsaveisAll ?? []).filter(r => r.orgao === editOrgao.orgao).length > 0 && (
              <div>
                <Label className="text-xs uppercase tracking-wider">Selecionar Responsável Cadastrado</Label>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground"
                  value={(orgaoResponsaveisAll ?? []).find(r =>
                    r.orgao === editOrgao.orgao && r.nome === editOrgao.responsavelNome
                  )?.id ?? ""}
                  onChange={(e) => {
                    const resp = (orgaoResponsaveisAll ?? []).find(r => r.id === Number(e.target.value));
                    if (resp) {
                      setEditOrgao(prev => ({
                        ...prev,
                        responsavelNome: resp.nome,
                        responsavelCargo: resp.cargo ?? "",
                        responsavelTel: resp.telefone ?? "",
                        responsavelEmail: resp.email ?? "",
                        localUserId: resp.localUserId ?? prev.localUserId,
                      }));
                    }
                  }}
                >
                  <option value="">— Selecionar responsável —</option>
                  {(orgaoResponsaveisAll ?? []).filter(r => r.orgao === editOrgao.orgao).map(r => (
                    <option key={r.id} value={r.id}>{r.nome}{r.cargo ? ` — ${r.cargo}` : ""}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Ou edite manualmente os campos abaixo.</p>
              </div>
            )}

            <div>
              <Label className="text-xs uppercase tracking-wider">Nome do Responsável</Label>
              <Input
                value={editOrgao.responsavelNome}
                onChange={(e) => setEditOrgao({ ...editOrgao, responsavelNome: e.target.value })}
                placeholder="Nome completo"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider">Cargo</Label>
                <Input
                  value={editOrgao.responsavelCargo}
                  onChange={(e) => setEditOrgao({ ...editOrgao, responsavelCargo: e.target.value })}
                  placeholder="Cargo ou função"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider">Telefone</Label>
                <Input
                  value={editOrgao.responsavelTel}
                  onChange={(e) => setEditOrgao({ ...editOrgao, responsavelTel: e.target.value })}
                  placeholder="(84) 9 0000-0000"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">E-mail</Label>
              <Input
                type="email"
                value={editOrgao.responsavelEmail}
                onChange={(e) => setEditOrgao({ ...editOrgao, responsavelEmail: e.target.value })}
                placeholder="email@orgao.natal.rn.gov.br"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrgaoId(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!editOrgaoId || !editOrgao.orgao) { toast.error("Selecione um órgão."); return; }
                updateOrgaoMutation.mutate({
                  id: editOrgaoId,
                  orgao: editOrgao.orgao as any,
                  responsavelNome: editOrgao.responsavelNome || undefined,
                  responsavelCargo: editOrgao.responsavelCargo || undefined,
                  responsavelTel: editOrgao.responsavelTel || undefined,
                  responsavelEmail: editOrgao.responsavelEmail || undefined,
                });
              }}
              disabled={updateOrgaoMutation.isPending}
            >
              {updateOrgaoMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm: Remover Órgão */}
      <AlertDialog open={deleteOrgaoId !== null} onOpenChange={() => setDeleteOrgaoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover órgão?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. O órgão e seus dados de contato serão removidos permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteOrgaoId !== null && removeOrgaoMutation.mutate({ id: deleteOrgaoId })}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Confirmar e Enviar Contato (suporta múltiplos destinatários) */}
      <Dialog open={contactSendDialog !== null} onOpenChange={(open) => !open && setContactSendDialog(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {contactSendDialog?.channel === "whatsapp" ? (
                <Phone className="w-4 h-4 text-green-600" />
              ) : (
                <Mail className="w-4 h-4 text-blue-500" />
              )}
              Enviar via {contactSendDialog?.channel === "whatsapp" ? "WhatsApp" : "E-mail"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {contactAlert && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-400/40 text-orange-700 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {isOverdue ? "Este item está com prazo vencido." : "Este item possui documentos com pendência."}
              </div>
            )}

            {/* Seleção de destinatários */}
            {contactSendDialog && contactSendDialog.recipients.length > 1 && (
              <div>
                <Label className="text-xs uppercase tracking-wider mb-1.5 block">Destinatários</Label>
                <div className="space-y-1.5">
                  {contactSendDialog.recipients.map((r) => (
                    <label
                      key={r.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/40 bg-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={r.selected}
                        onChange={(e) => setContactSendDialog(prev => prev ? {
                          ...prev,
                          recipients: prev.recipients.map(x =>
                            x.id === r.id ? { ...x, selected: e.target.checked } : x
                          ),
                        } : null)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground">{r.name}</div>
                        <div className="text-[10px] text-muted-foreground">{r.orgao} • {r.contact}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {contactSendDialog && contactSendDialog.recipients.length === 1 && (
              <p className="text-xs text-muted-foreground">
                Para: <strong>{contactSendDialog.recipients[0].name}</strong> ({contactSendDialog.recipients[0].contact})
              </p>
            )}

            <div>
              <Label className="text-xs uppercase tracking-wider">Mensagem</Label>
              <textarea
                rows={8}
                value={contactSendDialog?.message ?? ""}
                onChange={(e) => setContactSendDialog(prev => prev ? { ...prev, message: e.target.value } : null)}
                className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm border border-border/50 bg-secondary/30 text-foreground resize-none focus:outline-none focus:border-primary/60"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactSendDialog(null)}>Cancelar</Button>
            <Button
              className={contactSendDialog?.channel === "whatsapp" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
              disabled={!contactSendDialog?.recipients.some(r => r.selected)}
              onClick={() => {
                if (!contactSendDialog) return;
                const { channel, recipients, message } = contactSendDialog;
                const selected = recipients.filter(r => r.selected);
                const subject = encodeURIComponent(`Demanda Ribeira - ${action?.description ?? "Item"}`);
                const body = encodeURIComponent(message);

                // Abrir janela para cada destinatário selecionado
                selected.forEach((r, idx) => {
                  setTimeout(() => {
                    if (channel === "whatsapp") {
                      const phone = r.contact.replace(/\D/g, "");
                      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, "_blank");
                    } else {
                      window.open(`mailto:${r.contact}?subject=${subject}&body=${body}`, "_blank");
                    }
                  }, idx * 300); // pequeno delay para não bloquear popups
                });

                // Registrar no histórico para cada destinatário
                selected.forEach((r) => {
                  addContactHistoryMutation.mutate({
                    actionId: id,
                    channel,
                    recipientName: r.name,
                    recipientContact: r.contact,
                    message: message.slice(0, 500),
                    sentBy: localUser?.name ?? localUser?.username ?? "Admin",
                  });
                });

                toast.success(`Contato registrado no histórico para ${selected.length} destinatário${selected.length > 1 ? "s" : ""}.`);
                setContactSendDialog(null);
              }}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Abrir {contactSendDialog?.channel === "whatsapp" ? "WhatsApp" : "E-mail"} e Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
