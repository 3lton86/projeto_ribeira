import { trpc } from "@/lib/trpc";
import { ORGAOS_MUNICIPAIS } from "../../../shared/orgaos";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  X,
  Download,
  FileSpreadsheet,
  FileText as FilePdf,
  Eye,
  Edit3,
  Trash2,
  AlertCircle,
  Plus,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Pencil,
} from "lucide-react";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { toast } from "sonner";
import { exportToExcel, exportToPdf } from "@/lib/export";

type Area = "Governança" | "Técnico" | "Jurídico" | "Eco-Fin";
type Status = "Pendente" | "Em Andamento" | "Concluído" | "Cancelado";
type Priority = "Alta" | "Média" | "Baixa";

const AREAS: Area[] = ["Governança", "Técnico", "Jurídico", "Eco-Fin"];
const STATUSES: Status[] = ["Pendente", "Em Andamento", "Concluído", "Cancelado"];
const PRIORITIES: Priority[] = ["Alta", "Média", "Baixa"];

function StatusBadge({ status }: { status: Status }) {
  const cls: Record<Status, string> = {
    Pendente: "badge-pendente",
    "Em Andamento": "badge-em-andamento",
    Concluído: "badge-concluido",
    Cancelado: "badge-cancelado",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[status]}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority | null }) {
  if (!priority) return null;
  const cls: Record<Priority, string> = {
    Alta: "badge-alta",
    Média: "badge-media",
    Baixa: "badge-baixa",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[priority]}`}>
      {priority}
    </span>
  );
}

function AreaBadge({ area }: { area: Area }) {
  const cls: Record<Area, string> = {
    Governança: "badge-governanca",
    Técnico: "badge-tecnico",
    Jurídico: "badge-juridico",
    "Eco-Fin": "badge-ecofin",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[area]}`}>
      {area}
    </span>
  );
}

// ---- Edit Inline Modal ----
interface EditInlineForm {
  description: string;
  area: Area;
  status: Status;
  priority: Priority;
  dueDate: string;
  orgao: string;
}

interface EditInlineModalProps {
  action: {
    id: number;
    description: string;
    area: string;
    status: string;
    priority: string | null;
    dueDate?: Date | null;
    orgao?: string | null;
  };
  onClose: () => void;
  onSaved: () => void;
}

function EditInlineModal({ action, onClose, onSaved }: EditInlineModalProps) {
  const [form, setForm] = useState<EditInlineForm>({
    description: action.description,
    area: action.area as Area,
    status: action.status as Status,
    priority: (action.priority ?? "Média") as Priority,
    dueDate: action.dueDate ? new Date(action.dueDate).toISOString().split("T")[0] : "",
    orgao: (action as any).orgao ?? "",
  });

  const editMutation = trpc.actions.editInline.useMutation({
    onSuccess: () => {
      toast.success("Ação atualizada com sucesso!");
      onSaved();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atualizar ação.");
    },
  });

  const handleSave = () => {
    if (!form.description.trim()) {
      toast.error("A descrição é obrigatória.");
      return;
    }
    editMutation.mutate({
      id: action.id,
      description: form.description.trim(),
      area: form.area,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate ? new Date(form.dueDate) : null,
      orgao: (form.orgao as any) || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: "oklch(0.13 0.02 220)",
          border: "1px solid oklch(0.72 0.18 185 / 0.3)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.65 0.20 50 / 0.15)", border: "1px solid oklch(0.65 0.20 50 / 0.4)" }}>
              <Pencil className="w-4 h-4" style={{ color: "oklch(0.65 0.20 50)" }} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Editar Ação</h2>
              <p className="text-xs text-muted-foreground">Campos principais da ação</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Campos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descrição *</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Frente Temática</label>
            <select
              value={form.area}
              onChange={(e) => setForm(f => ({ ...f, area: e.target.value as Area }))}
              className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
            >
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm(f => ({ ...f, status: e.target.value as Status }))}
              className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prioridade</label>
            <select
              value={form.priority}
              onChange={(e) => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
              className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Prazo Previsto
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
            />
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Órgão Responsável
            </label>
            <select
              value={form.orgao}
              onChange={(e) => setForm(f => ({ ...f, orgao: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
            >
              <option value="">Selecione o órgão...</option>
              {ORGAOS_MUNICIPAIS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Para editar outros campos (contato, base documental, documentos), acesse a ficha completa da ação.
        </p>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 border-t border-border/30 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium glass-card hover:border-border transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={editMutation.isPending}
            className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: "oklch(0.65 0.20 50)", color: "#000" }}
          >
            {editMutation.isPending ? (
              <><span className="animate-spin w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full" /> Salvando...</>
            ) : (
              <><Pencil className="w-3.5 h-3.5" /> Salvar</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Delete Confirm Dialog ----
interface DeleteConfirmDialogProps {
  actionDescription: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirmDialog({ actionDescription, onConfirm, onCancel, isPending }: DeleteConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: "oklch(0.13 0.02 220)",
          border: "1px solid oklch(0.60 0.22 25 / 0.4)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.60 0.22 25 / 0.15)", border: "1px solid oklch(0.60 0.22 25 / 0.4)" }}>
            <Trash2 className="w-5 h-5" style={{ color: "oklch(0.60 0.22 25)" }} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Excluir Ação</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Esta operação é irreversível. Todos os comentários, histórico e documentos associados também serão excluídos.
            </p>
          </div>
        </div>

        <div className="rounded-lg p-3 bg-secondary/30 border border-border/40">
          <p className="text-sm text-foreground line-clamp-3">{actionDescription}</p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium glass-card hover:border-border transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: "oklch(0.45 0.22 25)", color: "#fff" }}
          >
            {isPending ? (
              <><span className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" /> Excluindo...</>
            ) : (
              <><Trash2 className="w-3.5 h-3.5" /> Excluir</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main Component ----
export default function Actions() {
  const [, params] = useLocation();
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initialArea = searchParams.get("area") as Area | null;

  const [selectedAreas, setSelectedAreas] = useState<Area[]>(initialArea ? [initialArea] : []);
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [selectedOrgaos, setSelectedOrgaos] = useState<string[]>([]);
  const [orgaoSearch, setOrgaoSearch] = useState("");
  const [searchText, setSearchText] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const [showNewActionModal, setShowNewActionModal] = useState(false);
  const [newActionForm, setNewActionForm] = useState({
    area: "Governança" as Area,
    description: "",
    priority: "Média" as Priority,
    status: "Pendente" as Status,
    dueDate: "",
    requestDate: "",
    documentBase: "",
    orgao: "",
    responsavelNome: "",
    responsavelCargo: "",
    responsavelTel: "",
    responsavelEmail: "",
  });

  // Edit inline state
  const [editingAction, setEditingAction] = useState<{
    id: number;
    description: string;
    area: string;
    status: string;
    priority: string | null;
    dueDate?: Date | null;
    orgao?: string | null;
  } | null>(null);

  // Delete confirm state
  const [deletingAction, setDeletingAction] = useState<{ id: number; description: string } | null>(null);

  const { data: allActions, isLoading, refetch } = trpc.actions.list.useQuery({});
  const { user } = useAuth();
  const { localUser } = useLocalAuth();
  const isAdmin = user?.role === "admin" || localUser?.role === "admin" || localUser?.role === "super_admin";

  const createActionMutation = trpc.actions.create.useMutation({
    onSuccess: () => {
      toast.success("Nova ação criada com sucesso!");
      setShowNewActionModal(false);
      setNewActionForm({
        area: "Governança",
        description: "",
        priority: "Média",
        status: "Pendente",
        dueDate: "",
        requestDate: "",
        documentBase: "",
        orgao: "",
        responsavelNome: "",
        responsavelCargo: "",
        responsavelTel: "",
        responsavelEmail: "",
      });
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar ação.");
    },
  });

  const deleteActionMutation = trpc.actions.delete.useMutation({
    onSuccess: () => {
      toast.success("Ação excluída com sucesso.");
      setDeletingAction(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao excluir ação.");
    },
  });

  const handleCreateAction = () => {
    if (!newActionForm.description.trim()) {
      toast.error("A descrição da ação é obrigatória.");
      return;
    }
    createActionMutation.mutate({
      area: newActionForm.area,
      description: newActionForm.description.trim(),
      priority: newActionForm.priority,
      status: newActionForm.status,
      dueDate: newActionForm.dueDate ? new Date(newActionForm.dueDate) : null,
      requestDate: newActionForm.requestDate ? new Date(newActionForm.requestDate) : undefined,
      documentBase: newActionForm.documentBase || undefined,
      orgao: (newActionForm.orgao as any) || undefined,
      responsavelNome: newActionForm.responsavelNome || undefined,
      responsavelCargo: newActionForm.responsavelCargo || undefined,
      responsavelTel: newActionForm.responsavelTel || undefined,
      responsavelEmail: newActionForm.responsavelEmail || undefined,
    });
  };

  const { data: exportData } = trpc.export.data.useQuery({
    area: selectedAreas.length > 0 ? selectedAreas : undefined,
    priority: selectedPriorities.length > 0 ? selectedPriorities : undefined,
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    orgao: selectedOrgaos.length > 0 ? selectedOrgaos : undefined,
    searchText: searchText.length > 0 ? searchText : undefined,
  });

  const filtered = useMemo(() => {
    if (!allActions) return [];
    return allActions.filter((a) => {
      if (selectedAreas.length > 0 && !selectedAreas.includes(a.area as Area)) return false;
      if (a.isGroup === 0) {
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(a.status as Status)) return false;
        if (selectedPriorities.length > 0 && a.priority && !selectedPriorities.includes(a.priority as Priority)) return false;
        if (selectedOrgaos.length > 0 && !selectedOrgaos.includes((a as any).orgao ?? "")) return false;
        if (searchText && !a.description.toLowerCase().includes(searchText.toLowerCase())) return false;
      }
      return true;
    });
  }, [allActions, selectedAreas, selectedStatuses, selectedPriorities, selectedOrgaos, searchText]);

  // Group by area
  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const a of filtered) {
      if (!map[a.area]) map[a.area] = [];
      map[a.area].push(a);
    }
    return map;
  }, [filtered]);

  const toggleArea = (area: Area) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };
  const toggleStatus = (s: Status) => {
    setSelectedStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };
  const togglePriority = (p: Priority) => {
    setSelectedPriorities((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };
  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleOrgao = (o: string) => {
    setSelectedOrgaos((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));
  };

  const clearFilters = () => {
    setSelectedAreas([]);
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedOrgaos([]);
    setOrgaoSearch("");
    setSearchText("");
  };

  const hasFilters =
    selectedAreas.length > 0 ||
    selectedStatuses.length > 0 ||
    selectedPriorities.length > 0 ||
    selectedOrgaos.length > 0 ||
    searchText.length > 0;

  const totalItems = filtered.filter((a) => a.isGroup === 0).length;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(to bottom, oklch(0.72 0.18 185), oklch(0.65 0.20 50))" }} />
            <h1 className="font-display text-2xl font-bold text-foreground">Ações & Entregas</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-3">
            {totalItems} {totalItems === 1 ? "item" : "itens"} encontrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowNewActionModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all btn-teal"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Ação
            </button>
          )}
          <button
            onClick={() => {
              if (exportData) {
                exportToExcel(exportData);
                toast.success("Exportação Excel iniciada");
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium glass-card hover:border-primary/40 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 145)" }} />
            Excel
          </button>
          <button
            onClick={() => {
              if (exportData) {
                exportToPdf(exportData, {
                  areas: selectedAreas.length > 0 ? selectedAreas : undefined,
                  statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
                  priorities: selectedPriorities.length > 0 ? selectedPriorities : undefined,
                  orgaos: selectedOrgaos.length > 0 ? selectedOrgaos : undefined,
                  searchText: searchText.length > 0 ? searchText : undefined,
                });
                toast.success("Exportação PDF iniciada");
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium glass-card hover:border-primary/40 transition-all"
          >
            <FilePdf className="w-3.5 h-3.5" style={{ color: "oklch(0.60 0.22 25)" }} />
            PDF
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              showFilters || hasFilters
                ? "btn-teal text-black"
                : "glass-card hover:border-primary/40"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
            {hasFilters && (
              <span className="ml-1 bg-black/20 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {selectedAreas.length + selectedStatuses.length + selectedPriorities.length + selectedOrgaos.length + (searchText ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por descrição..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm glass-card border border-border/50 bg-transparent focus:outline-none focus:border-primary/60 transition-colors"
        />
        {searchText && (
          <button onClick={() => setSearchText("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="glass-card rounded-xl p-4 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Filtros Avançados</span>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="w-3 h-3" /> Limpar tudo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Filtro por Órgão — ocupa linha inteira */}
            <div className="sm:col-span-3">
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>Órgão Responsável</span>
                {selectedOrgaos.length > 0 && (
                  <button onClick={() => setSelectedOrgaos([])} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                    <X className="w-2.5 h-2.5" /> Limpar
                  </button>
                )}
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar órgão..."
                  value={orgaoSearch}
                  onChange={(e) => setOrgaoSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs glass-card border border-border/40 bg-transparent focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {ORGAOS_MUNICIPAIS.filter((o) =>
                  o.toLowerCase().includes(orgaoSearch.toLowerCase())
                ).map((orgao) => (
                  <button
                    key={orgao}
                    onClick={() => toggleOrgao(orgao)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedOrgaos.includes(orgao)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {orgao}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Frente Temática</div>
              <div className="flex flex-col gap-1.5">
                {AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleArea(area)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${
                      selectedAreas.includes(area)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Status</div>
              <div className="flex flex-col gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${
                      selectedStatuses.includes(s)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Prioridade</div>
              <div className="flex flex-col gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePriority(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${
                      selectedPriorities.includes(p)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl h-14 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {AREAS.filter((area) => grouped[area]?.length > 0).map((area) => {
            const areaItems = grouped[area] ?? [];
            const groups = areaItems.filter((a) => a.isGroup === 1);
            const areaKey = `area-${area}`;
            const isAreaExpanded = !expandedGroups.has(`collapsed-area-${area}`);

            return (
              <div key={area} className="glass-card rounded-xl overflow-hidden">
                {/* Area header */}
                <button
                  onClick={() => {
                    setExpandedGroups((prev) => {
                      const next = new Set(prev);
                      const k = `collapsed-area-${area}`;
                      if (next.has(k)) next.delete(k);
                      else next.add(k);
                      return next;
                    });
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <AreaBadge area={area} />
                  <span className="text-sm font-semibold text-foreground flex-1 text-left">
                    {areaItems.filter((a) => a.isGroup === 0).length} ações
                  </span>
                  {isAreaExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {isAreaExpanded && (
                  <div className="border-t border-border/30">
                    {groups.map((group) => {
                      const groupKey = `group-${group.id}`;
                      const children = areaItems.filter(
                        (a) => a.isGroup === 0 && a.parentCode === group.itemCode
                      );
                      const isGroupExpanded = !expandedGroups.has(`collapsed-${groupKey}`);

                      return (
                        <div key={group.id}>
                          {/* Group header */}
                          <button
                            onClick={() => {
                              setExpandedGroups((prev) => {
                                const next = new Set(prev);
                                if (next.has(`collapsed-${groupKey}`)) next.delete(`collapsed-${groupKey}`);
                                else next.add(`collapsed-${groupKey}`);
                                return next;
                              });
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 bg-secondary/20 hover:bg-secondary/40 transition-colors"
                          >
                            {isGroupExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="text-xs font-bold text-muted-foreground w-6">{group.itemCode}</span>
                            <span className="text-sm font-semibold text-foreground flex-1 text-left">
                              {group.description}
                            </span>
                            <span className="text-xs text-muted-foreground">{children.length} itens</span>
                          </button>

                          {/* Children */}
                          {isGroupExpanded &&
                            children.map((action, idx) => (
                              <div
                                key={action.id}
                                className={`flex items-start gap-3 px-4 py-3 border-t border-border/20 table-row-hover group ${
                                  idx % 2 === 0 ? "" : "bg-secondary/5"
                                }`}
                              >
                                <span className="text-xs text-muted-foreground w-8 flex-shrink-0 pt-0.5 font-mono">
                                  {action.itemCode}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                                    {action.description}
                                  </p>
                                  <div className="flex items-center flex-wrap gap-2 mt-2">
                                    <StatusBadge status={action.status as Status} />
                                    <PriorityBadge priority={action.priority as Priority | null} />
                                    {(action as any).orgao && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/15 text-primary border border-primary/30">
                                        {(action as any).orgao}
                                      </span>
                                    )}
                                    {(action as any).dueDate && (() => {
                                      const due = new Date((action as any).dueDate);
                                      const isLate = due < new Date() && action.status !== "Concluído" && action.status !== "Cancelado";
                                      return (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                          isLate ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                        }`}>
                                          {isLate ? "⚠️ Atrasado" : "✅ No prazo"} — {due.toLocaleDateString("pt-BR")}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {isAdmin && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setEditingAction({
                                            id: action.id,
                                            description: action.description,
                                            area: action.area,
                                            status: action.status,
                                            priority: action.priority,
                                            dueDate: (action as any).dueDate,
                                            orgao: (action as any).orgao,
                                          });
                                        }}
                                        title="Editar ação"
                                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                                      >
                                        <Pencil className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.20 50)" }} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDeletingAction({ id: action.id, description: action.description });
                                        }}
                                        title="Excluir ação"
                                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.22 25)" }} />
                                      </button>
                                    </>
                                  )}
                                  <Link
                                    href={`/acoes/${action.id}`}
                                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                                    title="Ver ficha completa"
                                  >
                                    {isAdmin ? (
                                      <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                    )}
                                  </Link>
                                </div>
                              </div>
                            ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {Object.keys(grouped).length === 0 && (
            <div className="glass-card rounded-xl p-12 text-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma ação encontrada com os filtros aplicados.</p>
              <button onClick={clearFilters} className="mt-3 text-xs text-primary hover:underline">
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Nova Ação */}
      {showNewActionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewActionModal(false); }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 flex flex-col gap-5"
            style={{
              background: "oklch(0.13 0.02 220)",
              border: "1px solid oklch(0.72 0.18 185 / 0.3)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.72 0.18 185 / 0.15)", border: "1px solid oklch(0.72 0.18 185 / 0.4)" }}>
                  <Plus className="w-4 h-4" style={{ color: "oklch(0.72 0.18 185)" }} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">Nova Ação / Entrega</h2>
                  <p className="text-xs text-muted-foreground">Preencha os dados da nova ação</p>
                </div>
              </div>
              <button onClick={() => setShowNewActionModal(false)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Campos obrigatórios */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descrição *</label>
                <textarea
                  rows={3}
                  value={newActionForm.description}
                  onChange={(e) => setNewActionForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descreva a ação ou entrega esperada..."
                  className="w-full rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Frente Temática *</label>
                <select
                  value={newActionForm.area}
                  onChange={(e) => setNewActionForm(f => ({ ...f, area: e.target.value as Area }))}
                  className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
                >
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prioridade</label>
                <select
                  value={newActionForm.priority}
                  onChange={(e) => setNewActionForm(f => ({ ...f, priority: e.target.value as Priority }))}
                  className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
                <select
                  value={newActionForm.status}
                  onChange={(e) => setNewActionForm(f => ({ ...f, status: e.target.value as Status }))}
                  className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" /> Prazo Previsto</label>
                <input
                  type="date"
                  value={newActionForm.dueDate}
                  onChange={(e) => setNewActionForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
                />
              </div>
            </div>

            {/* Órgão e Responsável */}
            <div className="border-t border-border/30 pt-4 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Building2 className="w-3 h-3" /> Órgão Responsável</label>
                <select
                  value={newActionForm.orgao}
                  onChange={(e) => setNewActionForm(f => ({ ...f, orgao: e.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
                >
                  <option value="">Selecione o órgão...</option>
                  {ORGAOS_MUNICIPAIS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><User className="w-3 h-3" /> Nome do Responsável</label>
                <input
                  type="text"
                  value={newActionForm.responsavelNome}
                  onChange={(e) => setNewActionForm(f => ({ ...f, responsavelNome: e.target.value }))}
                  placeholder="Nome completo"
                  className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cargo</label>
                <input
                  type="text"
                  value={newActionForm.responsavelCargo}
                  onChange={(e) => setNewActionForm(f => ({ ...f, responsavelCargo: e.target.value }))}
                  placeholder="Cargo ou função"
                  className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</label>
                <input
                  type="text"
                  value={newActionForm.responsavelTel}
                  onChange={(e) => setNewActionForm(f => ({ ...f, responsavelTel: e.target.value }))}
                  placeholder="(84) 9 9999-9999"
                  className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail</label>
                <input
                  type="email"
                  value={newActionForm.responsavelEmail}
                  onChange={(e) => setNewActionForm(f => ({ ...f, responsavelEmail: e.target.value }))}
                  placeholder="email@orgao.gov.br"
                  className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><FileText className="w-3 h-3" /> Base Documental</label>
                <input
                  type="text"
                  value={newActionForm.documentBase}
                  onChange={(e) => setNewActionForm(f => ({ ...f, documentBase: e.target.value }))}
                  placeholder="Ex: Decreto nº 123, Oficio nº 456..."
                  className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end gap-3 border-t border-border/30 pt-4">
              <button
                onClick={() => setShowNewActionModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium glass-card hover:border-border transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAction}
                disabled={createActionMutation.isPending}
                className="px-5 py-2 rounded-lg text-sm font-semibold btn-teal disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createActionMutation.isPending ? (
                  <><span className="animate-spin w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full" /> Criando...</>
                ) : (
                  <><Plus className="w-3.5 h-3.5" /> Criar Ação</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Inline Modal */}
      {editingAction && (
        <EditInlineModal
          action={editingAction}
          onClose={() => setEditingAction(null)}
          onSaved={() => refetch()}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deletingAction && (
        <DeleteConfirmDialog
          actionDescription={deletingAction.description}
          onConfirm={() => deleteActionMutation.mutate({ id: deletingAction.id })}
          onCancel={() => setDeletingAction(null)}
          isPending={deleteActionMutation.isPending}
        />
      )}
    </div>
  );
}
