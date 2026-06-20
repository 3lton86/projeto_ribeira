import { trpc } from "@/lib/trpc";
import { ORGAOS_MUNICIPAIS } from "../../../shared/orgaos";
import { buildHierarchicalNumbers } from "../../../shared/hierarchyNumbers";
import { useAuth } from "@/_core/hooks/useAuth";
import React, { useState, useMemo, useCallback, Fragment } from "react";
import { useLocation, Link } from "wouter";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  X,
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
  FolderEdit,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  GripVertical,
  Clock,
  AlertTriangle,
  GitBranch,
  FileCheck2,
  FileWarning,
  Files,
} from "lucide-react";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { toast } from "sonner";
import { exportToExcel, exportToPdf } from "@/lib/export";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Area = "Governança" | "Técnico" | "Jurídico" | "Eco-Fin";
type Status = "Pendente" | "Em Andamento" | "Concluído" | "Cancelado";
type Priority = "Alta" | "Média" | "Baixa";
type DeadlineFilter = "all" | "overdue" | "this_week";
type DocFilter = "all" | "any" | "pending" | "accepted";
type ContactFilter = "all" | "with_contact" | "no_contact";

const AREAS: Area[] = ["Governança", "Técnico", "Jurídico", "Eco-Fin"];
const STATUSES: Status[] = ["Pendente", "Em Andamento", "Concluído", "Cancelado"];
const PRIORITIES: Priority[] = ["Alta", "Média", "Baixa"];
const PAGE_SIZE = 20;

// ---- Deadline helpers ----
function isOverdue(dueDate: Date | null | undefined, status: string): boolean {
  if (!dueDate || status === "Concluído" || status === "Cancelado") return false;
  return new Date(dueDate) < new Date();
}

function isDueThisWeek(dueDate: Date | null | undefined, status: string): boolean {
  if (!dueDate || status === "Concluído" || status === "Cancelado") return false;
  const now = new Date();
  const due = new Date(dueDate);
  if (due < now) return false;
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);
  return due <= endOfWeek;
}

// ---- Badges ----
function StatusBadge({ status }: { status: Status }) {
  const cls: Record<Status, string> = {
    Pendente: "badge-pendente",
    "Em Andamento": "badge-em-andamento",
    Concluído: "badge-concluido",
    Cancelado: "badge-cancelado",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[status]}`}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: Priority | null }) {
  if (!priority) return null;
  const cls: Record<Priority, string> = { Alta: "badge-alta", Média: "badge-media", Baixa: "badge-baixa" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[priority]}`}>{priority}</span>;
}

function AreaBadge({ area }: { area: Area }) {
  const cls: Record<Area, string> = {
    Governança: "badge-governanca",
    Técnico: "badge-tecnico",
    Jurídico: "badge-juridico",
    "Eco-Fin": "badge-ecofin",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[area]}`}>{area}</span>;
}

// ---- Sortable Action Row ----
interface SortableActionRowProps {
  action: any;
  isAdmin: boolean;
  isDragEnabled: boolean;
  onEdit: (action: any) => void;
  onDelete: (action: any) => void;
  onAddSubItem: (action: any) => void;
  idx: number;
  hierNum?: string;
  depth?: number; // 0 = item direto do grupo, 1 = sub-item, 2 = sub-sub-item
  hasSubItems?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

function SortableActionRow({ action, isAdmin, isDragEnabled, onEdit, onDelete, onAddSubItem, idx, hierNum, depth = 0, hasSubItems = false, isExpanded = true, onToggleExpand }: SortableActionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id, disabled: !isDragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const dueDate = (action as any).dueDate ? new Date((action as any).dueDate) : null;
  const overdue = isOverdue(dueDate, action.status);
  const dueThisWeek = isDueThisWeek(dueDate, action.status);

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, paddingLeft: depth > 0 ? `${1 + depth * 1.5}rem` : undefined }}
      className={`flex items-start gap-3 px-4 py-3 border-t border-border/20 table-row-hover group ${depth > 0 ? "border-l-2 border-primary/20 bg-secondary/10" : idx % 2 === 0 ? "" : "bg-secondary/5"} ${isDragging ? "bg-secondary/20 rounded-lg shadow-lg" : ""}`}
    >
      {/* Drag handle */}
      {isAdmin && isDragEnabled && (
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 pt-0.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none"
          title="Arrastar para reordenar"
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {/* Expand/collapse toggle for items with sub-items */}
      {hasSubItems ? (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
          className="flex-shrink-0 pt-0.5 w-5 h-5 flex items-center justify-center rounded hover:bg-secondary/60 transition-colors"
          title={isExpanded ? "Recolher sub-itens" : "Expandir sub-itens"}
          aria-label={isExpanded ? "Recolher sub-itens" : "Expandir sub-itens"}
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      ) : (
        <span className="flex-shrink-0 w-5" />
      )}
      <span className="text-xs text-muted-foreground w-8 flex-shrink-0 pt-0.5 font-mono" title={`Código interno: ${action.itemCode}`}>{hierNum ?? action.itemCode}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-relaxed line-clamp-2">{action.description}</p>
        <div className="flex items-center flex-wrap gap-2 mt-2">
          <StatusBadge status={action.status as Status} />
          <PriorityBadge priority={action.priority as Priority | null} />
          {(action as any).orgao && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/15 text-primary border border-primary/30">
              {(action as any).orgao}
            </span>
          )}
          {dueDate && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
              overdue
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : dueThisWeek
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            }`}>
              {overdue ? <><AlertTriangle className="w-3 h-3" /> Atrasado</> : dueThisWeek ? <><Clock className="w-3 h-3" /> Vence em breve</> : "✅ No prazo"}
              {" — "}{dueDate.toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>
      </div>

            {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {isAdmin && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddSubItem(action); }}
              title="Adicionar sub-item"
              aria-label="Adicionar sub-item"
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary transition-colors text-xs font-medium"
              style={{ color: "oklch(0.72 0.18 145)" }}
            >
              <GitBranch className="w-3 h-3" /> Sub-item
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(action); }}
              title="Editar ação"
              aria-label="Editar ação"
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 60)" }} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(action); }}
              title="Excluir ação"
              aria-label="Excluir ação"
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.22 25)" }} />
            </button>
          </>
        )}
        <Link href={`/acoes/${action.id}`} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Ver ficha completa">
          {isAdmin ? <Edit3 className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
        </Link>
      </div>
    </div>
  );
}

// ---- Edit Group Modal ----
function EditGroupModal({ group, onClose, onSaved }: { group: { id: number; description: string }; onClose: () => void; onSaved: () => void }) {
  const [description, setDescription] = useState(group.description);
  const updateGroupMutation = trpc.actions.updateGroup.useMutation({
    onSuccess: () => { toast.success("Cabeçalho do grupo atualizado!"); onSaved(); onClose(); },
    onError: (err) => toast.error(err.message || "Erro ao atualizar grupo."),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-5" style={{ background: "oklch(0.13 0.02 240)", border: "1px solid oklch(0.55 0.18 240 / 0.3)", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.55 0.18 240 / 0.15)", border: "1px solid oklch(0.55 0.18 240 / 0.4)" }}>
              <FolderEdit className="w-4 h-4" style={{ color: "oklch(0.72 0.18 240)" }} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Editar Grupo</h2>
              <p className="text-xs text-muted-foreground">Renomear cabeçalho desta categoria</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome do Grupo *</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground resize-none" autoFocus />
          <p className="text-xs text-muted-foreground">A alteração ficará registrada no histórico.</p>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border/30 pt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium glass-card hover:border-border transition-all">Cancelar</button>
          <button onClick={() => updateGroupMutation.mutate({ id: group.id, description: description.trim() })} disabled={updateGroupMutation.isPending || !description.trim() || description.trim() === group.description} className="px-5 py-2 rounded-lg text-sm font-semibold btn-teal disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
            {updateGroupMutation.isPending ? <><span className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" /> Salvando...</> : <><FolderEdit className="w-3.5 h-3.5" /> Salvar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Edit Inline Modal ----
function EditInlineModal({ action, onClose, onSaved }: { action: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    description: action.description,
    area: action.area as Area,
    status: action.status as Status,
    priority: (action.priority ?? "Média") as Priority,
    dueDate: action.dueDate ? new Date(action.dueDate).toISOString().split("T")[0] : "",
    orgao: (action as any).orgao ?? "",
  });
  const editMutation = trpc.actions.editInline.useMutation({
    onSuccess: () => { toast.success("Ação atualizada!"); onSaved(); onClose(); },
    onError: (err) => toast.error(err.message || "Erro ao atualizar ação."),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 flex flex-col gap-5" style={{ background: "oklch(0.13 0.02 240)", border: "1px solid oklch(0.55 0.18 240 / 0.3)", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.65 0.18 60 / 0.15)", border: "1px solid oklch(0.65 0.18 60 / 0.4)" }}>
              <Pencil className="w-4 h-4" style={{ color: "oklch(0.75 0.18 60)" }} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Editar Ação</h2>
              <p className="text-xs text-muted-foreground">Campos principais da ação</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descrição *</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="w-full rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground resize-none" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Frente Temática</label>
            <select value={form.area} onChange={(e) => setForm(f => ({ ...f, area: e.target.value as Area }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground">
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
            <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value as Status }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prioridade</label>
            <select value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value as Priority }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground">
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" /> Prazo Previsto</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground" />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Building2 className="w-3 h-3" /> Órgão Responsável</label>
            <select value={form.orgao} onChange={(e) => setForm(f => ({ ...f, orgao: e.target.value }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground">
              <option value="">Selecione o órgão...</option>
              {ORGAOS_MUNICIPAIS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Para editar outros campos, acesse a ficha completa.</p>
        <div className="flex items-center justify-end gap-3 border-t border-border/30 pt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium glass-card hover:border-border transition-all">Cancelar</button>
          <button onClick={() => editMutation.mutate({ id: action.id, description: form.description.trim(), area: form.area, status: form.status, priority: form.priority, dueDate: form.dueDate ? new Date(form.dueDate) : null, orgao: (form.orgao as any) || undefined })} disabled={editMutation.isPending} className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2" style={{ background: "oklch(0.55 0.18 240)", color: "#fff" }}>
            {editMutation.isPending ? <><span className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" /> Salvando...</> : <><Pencil className="w-3.5 h-3.5" /> Salvar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Create Sub-Item Modal ----
function CreateSubItemModal({ parent, onClose, onSaved }: { parent: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    description: "",
    priority: "Média" as Priority,
    status: "Pendente" as Status,
    dueDate: "",
    orgao: "",
  });
  const createSubItemMutation = trpc.actions.createSubItem.useMutation({
    onSuccess: () => { toast.success("Sub-item criado com sucesso!"); onSaved(); onClose(); },
    onError: (err) => toast.error(err.message || "Erro ao criar sub-item."),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 flex flex-col gap-5" style={{ background: "oklch(0.13 0.02 240)", border: "1px solid oklch(0.65 0.18 145 / 0.4)", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.65 0.18 145 / 0.15)", border: "1px solid oklch(0.65 0.18 145 / 0.4)" }}>
              <GitBranch className="w-4 h-4" style={{ color: "oklch(0.72 0.18 145)" }} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Novo Sub-item</h2>
              <p className="text-xs text-muted-foreground">Vinculado a: <span className="text-foreground font-medium">{parent.itemCode} — {parent.description.slice(0, 60)}{parent.description.length > 60 ? "…" : ""}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descrição *</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o sub-item..." className="w-full rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground resize-none" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prioridade</label>
            <select value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value as Priority }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground">
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
            <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value as Status }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" /> Prazo Previsto</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Building2 className="w-3 h-3" /> Órgão Responsável</label>
            <select value={form.orgao} onChange={(e) => setForm(f => ({ ...f, orgao: e.target.value }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground">
              <option value="">Selecione o órgão...</option>
              {ORGAOS_MUNICIPAIS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border/30 pt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium glass-card hover:border-border transition-all">Cancelar</button>
          <button
            onClick={() => {
              if (!form.description.trim()) { toast.error("A descrição é obrigatória."); return; }
              createSubItemMutation.mutate({
                parentId: parent.id,
                parentCode: parent.itemCode,
                area: parent.area as Area,
                description: form.description.trim(),
                priority: form.priority,
                status: form.status,
                dueDate: form.dueDate ? new Date(form.dueDate) : null,
                orgao: (form.orgao as any) || undefined,
              });
            }}
            disabled={createSubItemMutation.isPending}
            className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: "oklch(0.55 0.18 145)", color: "#fff" }}
          >
            {createSubItemMutation.isPending ? <><span className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" /> Criando...</> : <><GitBranch className="w-3.5 h-3.5" /> Criar Sub-item</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Delete Confirm Dialog ----
function DeleteConfirmDialog({ actionDescription, onConfirm, onCancel, isPending }: { actionDescription: string; onConfirm: () => void; onCancel: () => void; isPending: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5" style={{ background: "oklch(0.13 0.02 240)", border: "1px solid oklch(0.60 0.22 25 / 0.4)", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.60 0.22 25 / 0.15)", border: "1px solid oklch(0.60 0.22 25 / 0.4)" }}>
            <Trash2 className="w-5 h-5" style={{ color: "oklch(0.60 0.22 25)" }} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Excluir Ação</h2>
            <p className="text-sm text-muted-foreground mt-1">Esta operação é irreversível. Todos os comentários, histórico e documentos associados também serão excluídos.</p>
          </div>
        </div>
        <div className="rounded-lg p-3 bg-secondary/30 border border-border/40">
          <p className="text-sm text-foreground line-clamp-3">{actionDescription}</p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} disabled={isPending} className="px-4 py-2 rounded-lg text-sm font-medium glass-card hover:border-border transition-all disabled:opacity-50">Cancelar</button>
          <button onClick={onConfirm} disabled={isPending} className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2" style={{ background: "oklch(0.45 0.22 25)", color: "#fff" }}>
            {isPending ? <><span className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" /> Excluindo...</> : <><Trash2 className="w-3.5 h-3.5" /> Excluir</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Pagination Controls ----
function PaginationControls({ currentPage, totalPages, totalItems, pageSize, onPageChange }: { currentPage: number; totalPages: number; totalItems: number; pageSize: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-secondary/10">
      <span className="text-xs text-muted-foreground">Mostrando {start}–{end} de {totalItems} itens</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Página anterior">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .reduce<(number | "...")[]>((acc, p, idx, arr) => {
            if (idx > 0 && (arr[idx - 1] as number) !== p - 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((item, idx) =>
            item === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
            ) : (
              <button key={item} onClick={() => onPageChange(item as number)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${item === currentPage ? "btn-teal" : "hover:bg-secondary text-muted-foreground"}`}>
                {item}
              </button>
            )
          )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Próxima página">
          <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// ---- Main Component ----
export default function Actions() {
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initialArea = searchParams.get("area") as Area | null;

  const [selectedAreas, setSelectedAreas] = useState<Area[]>(initialArea ? [initialArea] : []);
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [selectedOrgaos, setSelectedOrgaos] = useState<string[]>([]);
  const [orgaoSearch, setOrgaoSearch] = useState("");
  const [searchText, setSearchText] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>("all");
  const [docFilter, setDocFilter] = useState<DocFilter>("all");
  const [contactFilter, setContactFilter] = useState<ContactFilter>("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set()); // items with sub-items expanded by default
  const [showFilters, setShowFilters] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);

  // Pagination: one page counter per area
  const [areaPages, setAreaPages] = useState<Record<string, number>>({});

  // Local reorder state (per-area sorted items for DnD)
  const [localOrder, setLocalOrder] = useState<Record<string, number[]>>({});

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

  const [editingAction, setEditingAction] = useState<any | null>(null);
  const [editingGroup, setEditingGroup] = useState<{ id: number; description: string } | null>(null);
  const [deletingAction, setDeletingAction] = useState<{ id: number; description: string } | null>(null);
  const [addingSubItemTo, setAddingSubItemTo] = useState<any | null>(null);

  // Export scope: "all" | area name
  const [exportScope, setExportScope] = useState<"all" | Area>("all");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Query para IDs de ações com histórico de contato
  const { data: actionIdsWithContact } = trpc.contactHistory.listActionIds.useQuery();
  const contactActionIdSet = useMemo(() => new Set(actionIdsWithContact ?? []), [actionIdsWithContact]);

  const { data: allActions, isLoading, refetch } = trpc.actions.list.useQuery(
    docFilter !== "all" ? { docFilter: docFilter as "any" | "pending" | "accepted" } : {}
  );
  const { user } = useAuth();
  const { localUser } = useLocalAuth();
  const isAdmin = user?.role === "admin" || localUser?.role === "admin" || localUser?.role === "super_admin";

  const reorderMutation = trpc.actions.reorder.useMutation({
    onError: (err) => { toast.error(err.message || "Erro ao salvar ordem."); refetch(); },
  });

  const createActionMutation = trpc.actions.create.useMutation({
    onSuccess: () => {
      toast.success("Nova ação criada com sucesso!");
      setShowNewActionModal(false);
      setNewActionForm({ area: "Governança", description: "", priority: "Média", status: "Pendente", dueDate: "", requestDate: "", documentBase: "", orgao: "", responsavelNome: "", responsavelCargo: "", responsavelTel: "", responsavelEmail: "" });
      refetch();
    },
    onError: (err) => toast.error(err.message || "Erro ao criar ação."),
  });

  const deleteActionMutation = trpc.actions.delete.useMutation({
    onSuccess: () => { toast.success("Ação excluída com sucesso."); setDeletingAction(null); refetch(); },
    onError: (err) => toast.error(err.message || "Erro ao excluir ação."),
  });

  const handleCreateAction = () => {
    if (!newActionForm.description.trim()) { toast.error("A descrição da ação é obrigatória."); return; }
    createActionMutation.mutate({
      area: newActionForm.area, description: newActionForm.description.trim(),
      priority: newActionForm.priority, status: newActionForm.status,
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

  // Export data query
  const { data: exportData } = trpc.export.data.useQuery({
    area: selectedAreas.length > 0 ? selectedAreas : undefined,
    priority: selectedPriorities.length > 0 ? selectedPriorities : undefined,
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    orgao: selectedOrgaos.length > 0 ? selectedOrgaos : undefined,
    searchText: searchText.length > 0 ? searchText : undefined,
  });

  // Filtered actions
  const filtered = useMemo(() => {
    if (!allActions) return [];
    return allActions.filter((a) => {
      if (selectedAreas.length > 0 && !selectedAreas.includes(a.area as Area)) return false;
      if (a.isGroup === 0) {
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(a.status as Status)) return false;
        if (selectedPriorities.length > 0 && a.priority && !selectedPriorities.includes(a.priority as Priority)) return false;
        if (selectedOrgaos.length > 0 && !selectedOrgaos.includes((a as any).orgao ?? "")) return false;
        if (searchText && !a.description.toLowerCase().includes(searchText.toLowerCase())) return false;
        // Deadline quick filter
        if (deadlineFilter === "overdue" && !isOverdue((a as any).dueDate, a.status)) return false;
        if (deadlineFilter === "this_week" && !isDueThisWeek((a as any).dueDate, a.status)) return false;
        // Contact filter
        if (contactFilter === "with_contact" && !contactActionIdSet.has(a.id)) return false;
        if (contactFilter === "no_contact" && contactActionIdSet.has(a.id)) return false;
      }
      return true;
    });
  }, [allActions, selectedAreas, selectedStatuses, selectedPriorities, selectedOrgaos, searchText, deadlineFilter, contactFilter, contactActionIdSet]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const a of filtered) {
      if (!map[a.area]) map[a.area] = [];
      map[a.area].push(a);
    }
    return map;
  }, [filtered]);

  // Hierarchical display numbers (1, 1.1, 1.1.1) — derived from allActions to stay stable across filters
  const hierNums = useMemo(() => {
    if (!allActions) return new Map<number, string>();
    return buildHierarchicalNumbers(
      allActions.map((a) => ({
        id: a.id,
        itemCode: a.itemCode,
        parentCode: (a as any).parentCode ?? null,
        isGroup: a.isGroup,
        sortOrder: (a as any).sortOrder ?? 0,
        area: a.area,
      }))
    );
  }, [allActions]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Handle drag end for a specific group — always persists ALL children of the group, not just visible page
  const handleDragEnd = useCallback((event: DragEndEvent, visibleGroupItems: any[], allGroupItems: any[], area: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visibleGroupItems.findIndex(a => a.id === active.id);
    const newIndex = visibleGroupItems.findIndex(a => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the visible slice
    const reorderedVisible = arrayMove(visibleGroupItems, oldIndex, newIndex);

    // Merge back: non-visible items keep their original sortOrder, visible items get new sortOrder
    // Build a map of id -> new position for visible items
    const visibleIds = new Set(visibleGroupItems.map(a => a.id));
    const nonVisible = allGroupItems.filter(a => !visibleIds.has(a.id));
    const allReordered = [...reorderedVisible, ...nonVisible];

    // Update local order state (only for visible items in the current group)
    const parentCode = visibleGroupItems[0]?.parentCode ?? "";
    setLocalOrder(prev => ({ ...prev, [`${area}-${parentCode}`]: reorderedVisible.map(a => a.id) }));

    // Persist ALL items in the group with updated sortOrder
    const items = allReordered.map((a, idx) => ({ id: a.id, sortOrder: idx + 1 }));
    reorderMutation.mutate({ items });
    toast.success("Ordem salva!", { duration: 1500 });
  }, [reorderMutation]);

  const toggleArea = (area: Area) => { setSelectedAreas(p => p.includes(area) ? p.filter(a => a !== area) : [...p, area]); setAreaPages({}); };
  const toggleStatus = (s: Status) => { setSelectedStatuses(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]); setAreaPages({}); };
  const togglePriority = (p: Priority) => { setSelectedPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]); setAreaPages({}); };
  const toggleOrgao = (o: string) => { setSelectedOrgaos(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o]); setAreaPages({}); };

  const clearFilters = () => {
    setSelectedAreas([]); setSelectedStatuses([]); setSelectedPriorities([]);
    setSelectedOrgaos([]); setOrgaoSearch(""); setSearchText("");
    setDeadlineFilter("all"); setDocFilter("all"); setContactFilter("all"); setAreaPages({});
  };

  const hasFilters = selectedAreas.length > 0 || selectedStatuses.length > 0 || selectedPriorities.length > 0 || selectedOrgaos.length > 0 || searchText.length > 0 || deadlineFilter !== "all" || docFilter !== "all" || contactFilter !== "all";
  const totalItems = filtered.filter(a => a.isGroup === 0).length;

  const getAreaPage = (area: string) => areaPages[area] ?? 1;
  const setAreaPage = (area: string, page: number) => setAreaPages(p => ({ ...p, [area]: page }));

  // Compute export data for current scope
  const getExportDataForScope = useCallback((scope: "all" | Area) => {
    if (!exportData) return [];
    if (scope === "all") return exportData;
    return exportData.filter(a => a.area === scope);
  }, [exportData]);

  // Count overdue and this-week items
  const overdueCount = useMemo(() => (allActions ?? []).filter(a => a.isGroup === 0 && isOverdue((a as any).dueDate, a.status)).length, [allActions]);
  const thisWeekCount = useMemo(() => (allActions ?? []).filter(a => a.isGroup === 0 && isDueThisWeek((a as any).dueDate, a.status)).length, [allActions]);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(to bottom, oklch(0.55 0.18 240), oklch(0.42 0.15 250))" }} />
            <h1 className="font-display text-2xl font-bold text-foreground">Ações & Entregas</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-3">
            {totalItems} {totalItems === 1 ? "item" : "itens"} encontrados
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <>
              <button onClick={() => setShowNewActionModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all btn-teal">
                <Plus className="w-3.5 h-3.5" /> Nova Ação
              </button>
              <button
                onClick={() => setIsDragMode(d => !d)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isDragMode ? "btn-teal" : "glass-card hover:border-primary/40"}`}
                title="Ativar/desativar reordenação por arrastar"
              >
                <GripVertical className="w-3.5 h-3.5" />
                {isDragMode ? "Reordenando" : "Reordenar"}
              </button>
            </>
          )}

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(m => !m)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium glass-card hover:border-primary/40 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 145)" }} />
              Exportar
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            {showExportMenu && (
              <div
                className="absolute right-0 top-full mt-1 z-30 rounded-xl overflow-hidden shadow-xl"
                style={{ background: "oklch(0.15 0.025 240)", border: "1px solid oklch(0.25 0.04 240 / 0.6)", minWidth: "220px" }}
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <div className="px-3 py-2 border-b border-border/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Escopo</p>
                  <div className="flex flex-col gap-1 mt-1.5">
                    <button onClick={() => setExportScope("all")} className={`text-left text-xs px-2 py-1 rounded-lg transition-colors ${exportScope === "all" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
                      Todos os itens filtrados
                    </button>
                    {AREAS.map(a => (
                      <button key={a} onClick={() => setExportScope(a)} className={`text-left text-xs px-2 py-1 rounded-lg transition-colors ${exportScope === a ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
                        Somente: {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      const data = getExportDataForScope(exportScope);
                      if (data.length === 0) { toast.error("Nenhum dado para exportar."); return; }
                      exportToExcel(data);
                      toast.success("Exportação Excel iniciada");
                      setShowExportMenu(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-secondary/50 transition-colors text-foreground"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 145)" }} />
                    Exportar Excel
                  </button>
                  <button
                    onClick={() => {
                      const data = getExportDataForScope(exportScope);
                      if (data.length === 0) { toast.error("Nenhum dado para exportar."); return; }
                      exportToPdf(data, {
                        areas: selectedAreas.length > 0 ? selectedAreas : exportScope !== "all" ? [exportScope] : undefined,
                        statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
                        priorities: selectedPriorities.length > 0 ? selectedPriorities : undefined,
                        orgaos: selectedOrgaos.length > 0 ? selectedOrgaos : undefined,
                        searchText: searchText.length > 0 ? searchText : undefined,
                      });
                      toast.success("Exportação PDF iniciada");
                      setShowExportMenu(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-secondary/50 transition-colors text-foreground"
                  >
                    <FilePdf className="w-3.5 h-3.5" style={{ color: "oklch(0.60 0.22 25)" }} />
                    Exportar PDF
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${showFilters || hasFilters ? "btn-teal" : "glass-card hover:border-primary/40"}`}
          >
            <Filter className="w-3.5 h-3.5" /> Filtros
            {hasFilters && (
              <span className="ml-1 bg-black/20 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {selectedAreas.length + selectedStatuses.length + selectedPriorities.length + selectedOrgaos.length + (searchText ? 1 : 0) + (deadlineFilter !== "all" ? 1 : 0) + (docFilter !== "all" ? 1 : 0) + (contactFilter !== "all" ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Quick deadline filters + doc filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => { setDeadlineFilter("all"); setAreaPages({}); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${deadlineFilter === "all" ? "bg-primary/20 text-primary border border-primary/40" : "glass-card text-muted-foreground hover:text-foreground"}`}
        >
          Todos os prazos
        </button>
        <button
          onClick={() => { setDeadlineFilter("overdue"); setAreaPages({}); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${deadlineFilter === "overdue" ? "bg-red-500/20 text-red-400 border border-red-500/40" : "glass-card text-muted-foreground hover:text-foreground"}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Atrasados
          {overdueCount > 0 && <span className="ml-1 bg-red-500/30 text-red-400 rounded-full px-1.5 py-0 text-[10px] font-bold">{overdueCount}</span>}
        </button>
        <button
          onClick={() => { setDeadlineFilter("this_week"); setAreaPages({}); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${deadlineFilter === "this_week" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "glass-card text-muted-foreground hover:text-foreground"}`}
        >
          <Clock className="w-3.5 h-3.5" />
          Vence esta semana
          {thisWeekCount > 0 && <span className="ml-1 bg-amber-500/30 text-amber-400 rounded-full px-1.5 py-0 text-[10px] font-bold">{thisWeekCount}</span>}
        </button>

        {/* Separador visual */}
        <span className="text-border/50 text-xs hidden sm:inline">|</span>

        {/* Filtros de documento */}
        <button
          onClick={() => { setDocFilter("all"); setAreaPages({}); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${docFilter === "all" ? "bg-primary/20 text-primary border border-primary/40" : "glass-card text-muted-foreground hover:text-foreground"}`}
        >
          <Files className="w-3.5 h-3.5" />
          Todos os docs
        </button>
        <button
          onClick={() => { setDocFilter("any"); setAreaPages({}); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${docFilter === "any" ? "bg-blue-500/20 text-blue-400 border border-blue-500/40" : "glass-card text-muted-foreground hover:text-foreground"}`}
        >
          <Files className="w-3.5 h-3.5" />
          Com documentos
        </button>
        <button
          onClick={() => { setDocFilter("pending"); setAreaPages({}); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${docFilter === "pending" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "glass-card text-muted-foreground hover:text-foreground"}`}
        >
          <FileWarning className="w-3.5 h-3.5" />
          Com pendência
        </button>
        <button
          onClick={() => { setDocFilter("accepted"); setAreaPages({}); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${docFilter === "accepted" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "glass-card text-muted-foreground hover:text-foreground"}`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          Doc aceito
        </button>

        {/* Separador visual */}
        <span className="text-border/50 text-xs hidden sm:inline">|</span>

        {/* Filtros de contato */}
        <button
          onClick={() => { setContactFilter("all"); setAreaPages({}); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${contactFilter === "all" ? "bg-primary/20 text-primary border border-primary/40" : "glass-card text-muted-foreground hover:text-foreground"}`}
        >
          <Phone className="w-3.5 h-3.5" />
          Todos os contatos
        </button>
        <button
          onClick={() => { setContactFilter("with_contact"); setAreaPages({}); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${contactFilter === "with_contact" ? "bg-teal-500/20 text-teal-400 border border-teal-500/40" : "glass-card text-muted-foreground hover:text-foreground"}`}
        >
          <Phone className="w-3.5 h-3.5" />
          Com contato
        </button>
        <button
          onClick={() => { setContactFilter("no_contact"); setAreaPages({}); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${contactFilter === "no_contact" ? "bg-orange-500/20 text-orange-400 border border-orange-500/40" : "glass-card text-muted-foreground hover:text-foreground"}`}
        >
          <Phone className="w-3.5 h-3.5" />
          Sem contato
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por descrição..."
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setAreaPages({}); }}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm glass-card border border-border/50 bg-transparent focus:outline-none focus:border-primary/60 transition-colors"
        />
        {searchText && (
          <button onClick={() => { setSearchText(""); setAreaPages({}); }} className="absolute right-3 top-1/2 -translate-y-1/2">
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
            <div className="sm:col-span-3">
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>Órgão Responsável</span>
                {selectedOrgaos.length > 0 && (
                  <button onClick={() => { setSelectedOrgaos([]); setAreaPages({}); }} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                    <X className="w-2.5 h-2.5" /> Limpar
                  </button>
                )}
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input type="text" placeholder="Buscar órgão..." value={orgaoSearch} onChange={(e) => setOrgaoSearch(e.target.value)} className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs glass-card border border-border/40 bg-transparent focus:outline-none focus:border-primary/50 transition-colors" />
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {ORGAOS_MUNICIPAIS.filter(o => o.toLowerCase().includes(orgaoSearch.toLowerCase())).map(orgao => (
                  <button key={orgao} onClick={() => { toggleOrgao(orgao); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedOrgaos.includes(orgao) ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                    {orgao}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Frente Temática</div>
              <div className="flex flex-col gap-1.5">
                {AREAS.map(area => (
                  <button key={area} onClick={() => toggleArea(area)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${selectedAreas.includes(area) ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                    {area}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Status</div>
              <div className="flex flex-col gap-1.5">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => toggleStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${selectedStatuses.includes(s) ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Prioridade</div>
              <div className="flex flex-col gap-1.5">
                {PRIORITIES.map(p => (
                  <button key={p} onClick={() => togglePriority(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${selectedPriorities.includes(p) ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DnD mode banner */}
      {isDragMode && isAdmin && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: "oklch(0.55 0.18 240 / 0.15)", border: "1px solid oklch(0.55 0.18 240 / 0.3)", color: "oklch(0.75 0.18 240)" }}>
          <GripVertical className="w-4 h-4" />
          Modo de reordenação ativo — arraste os itens para reorganizar. A ordem é salva automaticamente.
          <button onClick={() => setIsDragMode(false)} className="ml-auto text-xs opacity-70 hover:opacity-100">Sair</button>
        </div>
      )}

      {/* Actions list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="glass-card rounded-xl h-14 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {AREAS.filter(area => grouped[area]?.length > 0).map(area => {
            const areaItems = grouped[area] ?? [];
            const groups = areaItems.filter(a => a.isGroup === 1);
            const isAreaExpanded = !expandedGroups.has(`collapsed-area-${area}`);

            const allAreaActionItems = areaItems.filter(a => a.isGroup === 0);
            const currentPage = getAreaPage(area);

            // Pagination by complete groups: each page contains whole groups (never split a group across pages)
            // Build group pages: assign groups to pages greedily, keeping each group intact
            const getAllDescendantsForPaging = (parentCode: string): typeof areaItems => {
              const direct = areaItems.filter(a => a.isGroup === 0 && a.parentCode === parentCode);
              return direct.flatMap(child => [child, ...getAllDescendantsForPaging(child.itemCode)]);
            };
            const groupsWithCounts = groups.map(g => ({
              group: g,
              descendants: getAllDescendantsForPaging(g.itemCode),
            })).filter(g => g.descendants.length > 0);

            // Assign groups to pages
            const groupPages: (typeof groupsWithCounts)[] = [];
            let currentPageGroups: typeof groupsWithCounts = [];
            let currentPageCount = 0;
            for (const gEntry of groupsWithCounts) {
              const size = gEntry.descendants.length;
              if (currentPageGroups.length > 0 && currentPageCount + size > PAGE_SIZE) {
                groupPages.push(currentPageGroups);
                currentPageGroups = [gEntry];
                currentPageCount = size;
              } else {
                currentPageGroups.push(gEntry);
                currentPageCount += size;
              }
            }
            if (currentPageGroups.length > 0) groupPages.push(currentPageGroups);

            const totalPages = Math.max(groupPages.length, 1);
            const safeCurrentPage = Math.min(currentPage, totalPages);
            const currentPageGroupEntries = groupPages[safeCurrentPage - 1] ?? [];
            const pagedItemIds = new Set(
              currentPageGroupEntries.flatMap(g => g.descendants.map(a => a.id))
            );
            const pagedGroupIds = new Set(currentPageGroupEntries.map(g => g.group.id));

            return (
              <div key={area} className="glass-card rounded-xl overflow-hidden">
                {/* Area header */}
                <button
                  onClick={() => setExpandedGroups(prev => {
                    const next = new Set(prev);
                    const k = `collapsed-area-${area}`;
                    if (next.has(k)) next.delete(k); else next.add(k);
                    return next;
                  })}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <AreaBadge area={area} />
                  <span className="text-sm font-semibold text-foreground flex-1 text-left">
                    {allAreaActionItems.length} ações
                    {totalPages > 1 && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        (pág. {safeCurrentPage}/{totalPages})
                      </span>
                    )}
                  </span>
                  {isAreaExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isAreaExpanded && (
                  <div className="border-t border-border/30">
                    {groups.filter(g => pagedGroupIds.has(g.id)).map(group => {
                      const groupKey = `group-${group.id}`;
                      // Collect ALL descendants of this group recursively (items + sub-items)
                      const getAllDescendants = (parentCode: string): typeof areaItems => {
                        const direct = areaItems.filter(a => a.isGroup === 0 && a.parentCode === parentCode);
                        return direct.flatMap(child => [child, ...getAllDescendants(child.itemCode)]);
                      };
                      const allChildren = getAllDescendants(group.itemCode);
                      const visibleChildren = allChildren.filter(a => pagedItemIds.has(a.id));
                      const isGroupExpanded = !expandedGroups.has(`collapsed-${groupKey}`);

                      if (allChildren.length === 0) return null;

                      // Apply local order if drag mode was used (only direct children)
                      const orderKey = `${area}-${group.itemCode}`;
                      const orderedChildren = localOrder[orderKey]
                        ? (localOrder[orderKey].map(id => visibleChildren.find(a => a.id === id)).filter(Boolean) as typeof visibleChildren)
                        : visibleChildren;

                      return (
                        <div key={group.id}>
                          {/* Group header */}
                          <div className="flex items-center bg-secondary/20 hover:bg-secondary/30 transition-colors group">
                            <button
                              onClick={() => setExpandedGroups(prev => {
                                const next = new Set(prev);
                                if (next.has(`collapsed-${groupKey}`)) next.delete(`collapsed-${groupKey}`);
                                else next.add(`collapsed-${groupKey}`);
                                return next;
                              })}
                              className="flex-1 flex items-center gap-3 px-4 py-2.5"
                            >
                              {isGroupExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                              <span className="text-xs font-bold text-muted-foreground w-6" title={`Código interno: ${group.itemCode}`}>{hierNums.get(group.id) ?? group.itemCode}</span>
                              <span className="text-sm font-semibold text-foreground flex-1 text-left">{group.description}</span>
                              <span className="text-xs text-muted-foreground">{allChildren.length} itens</span>
                            </button>
                            {isAdmin && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingGroup({ id: group.id, description: group.description }); }}
                                title="Renomear grupo"
                                aria-label="Renomear grupo"
                                className="p-2 mr-2 rounded-lg hover:bg-secondary transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              >
                                <FolderEdit className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.18 240)" }} />
                              </button>
                            )}
                          </div>

                          {/* Children with DnD */}
                          {isGroupExpanded && (
                            isDragMode && isAdmin ? (
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(event) => handleDragEnd(event, orderedChildren, allChildren, area)}
                              >
                                <SortableContext items={orderedChildren.map(a => a.id)} strategy={verticalListSortingStrategy}>
                                  {orderedChildren.map((action, idx) => {
                                    const directSubItems = areaItems.filter(a => a.isGroup === 0 && a.parentCode === action.itemCode);
                                    const hasSubItems = directSubItems.length > 0;
                                    const isItemExpanded = !expandedItems.has(action.id);
                                    return (
                                      <Fragment key={action.id}>
                                        <SortableActionRow
                                          action={action}
                                          isAdmin={isAdmin}
                                          isDragEnabled={isDragMode}
                                          onEdit={setEditingAction}
                                          onDelete={setDeletingAction}
                                          onAddSubItem={setAddingSubItemTo}
                                          idx={idx}
                                          hierNum={hierNums.get(action.id)}
                                          depth={(action.itemCode?.split('.').length ?? 1) - 1}
                                          hasSubItems={hasSubItems}
                                          isExpanded={isItemExpanded}
                                          onToggleExpand={() => setExpandedItems(prev => { const next = new Set(prev); if (next.has(action.id)) next.delete(action.id); else next.add(action.id); return next; })}
                                        />
                                      </Fragment>
                                    );
                                  })}
                                </SortableContext>
                              </DndContext>
                            ) : (
                              orderedChildren.map((action, idx) => {
                                const directSubItems = areaItems.filter(a => a.isGroup === 0 && a.parentCode === action.itemCode);
                                const hasSubItems = directSubItems.length > 0;
                                const isItemExpanded = !expandedItems.has(action.id);
                                // Hide sub-items if parent is collapsed
                                const depth = (action.itemCode?.split('.').length ?? 1) - 1;
                                if (depth > 0) {
                                  // Check if any ancestor is collapsed
                                  const parts = action.itemCode.split('.');
                                  const parentCode = parts.slice(0, -1).join('.');
                                  const parentItem = areaItems.find(a => a.itemCode === parentCode && a.isGroup === 0);
                                  if (parentItem && expandedItems.has(parentItem.id)) return null;
                                }
                                return (
                                  <SortableActionRow
                                    key={action.id}
                                    action={action}
                                    isAdmin={isAdmin}
                                    isDragEnabled={false}
                                    onEdit={setEditingAction}
                                    onDelete={setDeletingAction}
                                    onAddSubItem={setAddingSubItemTo}
                                    idx={idx}
                                    hierNum={hierNums.get(action.id)}
                                    depth={depth}
                                    hasSubItems={hasSubItems}
                                    isExpanded={isItemExpanded}
                                    onToggleExpand={() => setExpandedItems(prev => { const next = new Set(prev); if (next.has(action.id)) next.delete(action.id); else next.add(action.id); return next; })}
                                  />
                                );
                              })
                            )
                          )}

                          {isGroupExpanded && allChildren.length > 0 && visibleChildren.length === 0 && (
                            <div className="px-4 py-3 border-t border-border/20">
                              <p className="text-xs text-muted-foreground italic">Os {allChildren.length} itens deste grupo estão em outras páginas.</p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <PaginationControls
                      currentPage={safeCurrentPage}
                      totalPages={totalPages}
                      totalItems={allAreaActionItems.length}
                      pageSize={PAGE_SIZE}
                      onPageChange={(page) => setAreaPage(area, page)}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {Object.keys(grouped).length === 0 && (
            <div className="glass-card rounded-xl p-12 text-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma ação encontrada com os filtros aplicados.</p>
              <button onClick={clearFilters} className="mt-3 text-xs text-primary hover:underline">Limpar filtros</button>
            </div>
          )}
        </div>
      )}

      {/* Modal Nova Ação */}
      {showNewActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={(e) => { if (e.target === e.currentTarget) setShowNewActionModal(false); }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 flex flex-col gap-5" style={{ background: "oklch(0.13 0.02 240)", border: "1px solid oklch(0.55 0.18 240 / 0.3)", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.55 0.18 240 / 0.15)", border: "1px solid oklch(0.55 0.18 240 / 0.4)" }}>
                  <Plus className="w-4 h-4" style={{ color: "oklch(0.72 0.18 240)" }} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">Nova Ação / Entrega</h2>
                  <p className="text-xs text-muted-foreground">Preencha os dados da nova ação</p>
                </div>
              </div>
              <button onClick={() => setShowNewActionModal(false)} className="p-2 rounded-lg hover:bg-secondary transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descrição *</label>
                <textarea rows={3} value={newActionForm.description} onChange={(e) => setNewActionForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva a ação ou entrega esperada..." className="w-full rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground resize-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Frente Temática *</label>
                <select value={newActionForm.area} onChange={(e) => setNewActionForm(f => ({ ...f, area: e.target.value as Area }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground">
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prioridade</label>
                <select value={newActionForm.priority} onChange={(e) => setNewActionForm(f => ({ ...f, priority: e.target.value as Priority }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
                <select value={newActionForm.status} onChange={(e) => setNewActionForm(f => ({ ...f, status: e.target.value as Status }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" /> Prazo Previsto</label>
                <input type="date" value={newActionForm.dueDate} onChange={(e) => setNewActionForm(f => ({ ...f, dueDate: e.target.value }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground" />
              </div>
            </div>
            <div className="border-t border-border/30 pt-4 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Building2 className="w-3 h-3" /> Órgão Responsável</label>
                <select value={newActionForm.orgao} onChange={(e) => setNewActionForm(f => ({ ...f, orgao: e.target.value }))} className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground">
                  <option value="">Selecione o órgão...</option>
                  {ORGAOS_MUNICIPAIS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><User className="w-3 h-3" /> Nome do Responsável</label>
                <input type="text" value={newActionForm.responsavelNome} onChange={(e) => setNewActionForm(f => ({ ...f, responsavelNome: e.target.value }))} placeholder="Nome completo" className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cargo</label>
                <input type="text" value={newActionForm.responsavelCargo} onChange={(e) => setNewActionForm(f => ({ ...f, responsavelCargo: e.target.value }))} placeholder="Cargo ou função" className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</label>
                <input type="text" value={newActionForm.responsavelTel} onChange={(e) => setNewActionForm(f => ({ ...f, responsavelTel: e.target.value }))} placeholder="(84) 9 9999-9999" className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground" />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail</label>
                <input type="email" value={newActionForm.responsavelEmail} onChange={(e) => setNewActionForm(f => ({ ...f, responsavelEmail: e.target.value }))} placeholder="email@orgao.gov.br" className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground" />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><FileText className="w-3 h-3" /> Base Documental</label>
                <input type="text" value={newActionForm.documentBase} onChange={(e) => setNewActionForm(f => ({ ...f, documentBase: e.target.value }))} placeholder="Ex: Decreto nº 123, Oficio nº 456..." className="rounded-lg px-3 py-2 text-sm bg-secondary/30 border border-border/50 focus:outline-none focus:border-primary/60 text-foreground" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border/30 pt-4">
              <button onClick={() => setShowNewActionModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium glass-card hover:border-border transition-all">Cancelar</button>
              <button onClick={handleCreateAction} disabled={createActionMutation.isPending} className="px-5 py-2 rounded-lg text-sm font-semibold btn-teal disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                {createActionMutation.isPending ? <><span className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" /> Criando...</> : <><Plus className="w-3.5 h-3.5" /> Criar Ação</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && <EditGroupModal group={editingGroup} onClose={() => setEditingGroup(null)} onSaved={() => refetch()} />}

      {/* Edit Inline Modal */}
      {editingAction && <EditInlineModal action={editingAction} onClose={() => setEditingAction(null)} onSaved={() => refetch()} />}

      {/* Create Sub-Item Modal */}
      {addingSubItemTo && <CreateSubItemModal parent={addingSubItemTo} onClose={() => setAddingSubItemTo(null)} onSaved={() => refetch()} />}

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
