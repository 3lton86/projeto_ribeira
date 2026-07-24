import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserCheck, UserX, ShieldCheck, Eye, Shield, Building2, Clock, CheckCircle2, XCircle, ChevronsUpDown, ArrowUp, ArrowDown, FileDown } from "lucide-react";
import { exportUsersToPdf } from "@/lib/export";
import { useLocation } from "wouter";
import { ORGAOS_MUNICIPAIS, EMPRESAS_PARCEIRAS } from "@shared/orgaos";

type UserRow = {
  id: number;
  name: string;
  username: string;
  role: "super_admin" | "admin" | "setorial" | "viewer";
  position: string | null;
  organization: string | null;
  telefone: string | null;
  email: string | null;
  active: number;
  createdAt: Date;
  allowedOrgaos: string[];
  allowedProjects: string[];
};

const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  super_admin: { label: "Super Admin", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", icon: <ShieldCheck className="w-3 h-3" /> },
  admin: { label: "Administrador", color: "text-primary bg-primary/10 border-primary/30", icon: <Shield className="w-3 h-3" /> },
  setorial: { label: "Usuário Setorial", color: "text-teal-400 bg-teal-400/10 border-teal-400/30", icon: <Building2 className="w-3 h-3" /> },
  viewer: { label: "Visualizador", color: "text-orange-400 bg-orange-500/15 border-orange-500/40", icon: <Eye className="w-3 h-3" /> },
};

export default function Users() {
  const [, navigate] = useLocation();
  const { isSuperAdmin, isAdmin, localUser } = useLocalAuth();
  const utils = trpc.useUtils();

  const canManage = isSuperAdmin || isAdmin;

  // Sort state for the users table
  const [sortField, setSortField] = useState<"name" | "lastAccessAt" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (field: "name" | "lastAccessAt") => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "lastAccessAt" ? "desc" : "asc");
    }
  };

  const { data: users = [], isLoading } = trpc.localAuth.users.list.useQuery(undefined, {
    enabled: canManage,
  });
  const { data: pendingUsers = [], isLoading: pendingLoading } = trpc.localAuth.users.listPending.useQuery(undefined, {
    enabled: canManage,
  });

  // Sorted users list
  const sortedUsers = useMemo(() => {
    const list = [...(users as any[])];
    if (!sortField) return list;
    return list.sort((a, b) => {
      if (sortField === "lastAccessAt") {
        const aVal = a.lastAccessAt ?? 0;
        const bVal = b.lastAccessAt ?? 0;
        return sortDir === "desc" ? bVal - aVal : aVal - bVal;
      }
      if (sortField === "name") {
        const cmp = (a.name ?? "").localeCompare(b.name ?? "", "pt-BR");
        return sortDir === "asc" ? cmp : -cmp;
      }
      return 0;
    });
  }, [users, sortField, sortDir]);

  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);

  const createMutation = trpc.localAuth.users.create.useMutation({
    onSuccess: () => {
      utils.localAuth.users.list.invalidate();
      setShowCreate(false);
      toast.success("Usuário criado com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.localAuth.users.update.useMutation({
    onSuccess: () => {
      utils.localAuth.users.list.invalidate();
      setEditUser(null);
      toast.success("Usuário atualizado!");
    },
    onError: (e) => {
      // Catch parse errors (e.g., server returned HTML instead of JSON)
      if (e.message.includes("is not valid JSON") || e.message.includes("Unexpected token")) {
        toast.error("Erro de comunicação com o servidor. Tente novamente ou recarregue a página.");
      } else {
        toast.error(e.message);
      }
    },
  });

  const approveMutation = trpc.localAuth.users.approve.useMutation({
    onSuccess: () => {
      utils.localAuth.users.listPending.invalidate();
      toast.success("Usuário aprovado! Acesso liberado.");
    },
    onError: (e) => toast.error(e.message),
  });
  const rejectMutation = trpc.localAuth.users.reject.useMutation({
    onSuccess: () => {
      utils.localAuth.users.listPending.invalidate();
      toast.success("Solicitação rejeitada e removida.");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.localAuth.users.delete.useMutation({
    onSuccess: () => {
      utils.localAuth.users.list.invalidate();
      setDeleteUser(null);
      toast.success("Usuário removido.");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!canManage) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Acesso restrito a administradores.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre e gerencie os usuários com acesso ao sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              const exportData = (sortedUsers as any[]).map((u: any) => ({
                name: u.name ?? "",
                username: u.username ?? "",
                position: u.position ?? null,
                organization: u.organization ?? null,
                role: u.role ?? "viewer",
                isActive: !!u.active,
                lastAccessAt: u.lastAccessAt ?? null,
                createdAt: u.createdAt ?? null,
              }));
              exportUsersToPdf(exportData);
            }}
          >
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(ROLE_LABELS).filter(([k]) => k !== "super_admin").map(([key, info]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium ${info.color}`}>
            {info.icon} {info.label}
          </span>
        ))}
      </div>

      {/* Users table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum usuário cadastrado além do super-admin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th
                  className="text-left px-4 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors min-w-[140px]"
                  onClick={() => handleSort("name")}
                  title="Ordenar por nome"
                >
                  <span className="inline-flex items-center gap-1">
                    Nome
                    {sortField === "name" ? (
                      sortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </span>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground min-w-[110px]">Usuário</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground min-w-[120px]">Cargo / Órgão</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground min-w-[110px]">Perfil</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground min-w-[140px]">Órgãos Permitidos</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground min-w-[70px]">Status</th>
                <th
                  className="text-left px-4 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors min-w-[140px] whitespace-nowrap"
                  onClick={() => handleSort("lastAccessAt")}
                  title="Ordenar por último acesso"
                >
                  <span className="inline-flex items-center gap-1">
                    Último Acesso
                    {sortField === "lastAccessAt" ? (
                      sortDir === "desc" ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </span>
                </th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground min-w-[80px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(sortedUsers as UserRow[]).map((u) => {
                const roleInfo = ROLE_LABELS[u.role] ?? ROLE_LABELS.viewer;
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-border/30 transition-colors ${
                      u.role !== "super_admin" ? "cursor-pointer hover:bg-primary/5" : "hover:bg-secondary/20"
                    }`}
                    onClick={() => u.role !== "super_admin" && setEditUser(u)}
                    title={u.role !== "super_admin" ? "Clique para editar" : undefined}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.position && <div className="text-xs">{u.position}</div>}
                      {u.organization && <div className="text-xs opacity-70">{u.organization}</div>}
                      {!u.position && !u.organization && <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${roleInfo.color}`}>
                        {roleInfo.icon}
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px]">
                      {u.role === "setorial" ? (
                        u.allowedOrgaos.includes("TODOS") ? (
                          <span className="text-teal-400 font-medium">Todos os órgãos</span>
                        ) : u.allowedOrgaos.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.allowedOrgaos.slice(0, 3).map(o => (
                              <span key={o} className="px-1.5 py-0.5 bg-secondary rounded text-xs">{o}</span>
                            ))}
                            {u.allowedOrgaos.length > 3 && (
                              <span className="px-1.5 py-0.5 bg-secondary rounded text-xs">+{u.allowedOrgaos.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-destructive/70">Nenhum órgão</span>
                        )
                      ) : (
                        <span className="opacity-40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <UserCheck className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <UserX className="w-3 h-3" /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {(u as any).lastAccessAt ? (
                        <span title={new Date((u as any).lastAccessAt).toLocaleString('pt-BR')}>
                          {new Date((u as any).lastAccessAt).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      ) : (
                        <span className="opacity-40">Nunca acessou</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== "super_admin" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditUser(u); }}
                            className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {u.id !== localUser?.id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteUser(u); }}
                              className="p-1.5 rounded hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending approvals */}
      {(pendingLoading || pendingUsers.length > 0) && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-amber-500/10">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-300">Cadastros Pendentes de Aprovação</h2>
            {!pendingLoading && (
              <span className="ml-auto text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">
                {pendingUsers.length} aguardando
              </span>
            )}
          </div>
          {pendingLoading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/20">
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Usuário</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Cargo / Órgão</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Solicitado em</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.username}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {[u.position, u.organization].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => approveMutation.mutate({ id: u.id })}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-medium transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate({ id: u.id })}
                          disabled={rejectMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive text-xs font-medium transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create dialog */}
      <UserFormDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Novo Usuário"
        onSubmit={(data) => createMutation.mutate(data as any)}
        isPending={createMutation.isPending}
        callerRole={localUser?.role ?? "admin"}
      />

      {/* Edit dialog */}
      {editUser && (
        <UserFormDialog
          open={!!editUser}
          onClose={() => setEditUser(null)}
          title="Editar Usuário"
          initial={editUser}
          onSubmit={(data) => updateMutation.mutate({ id: editUser.id, ...data } as any)}
          isPending={updateMutation.isPending}
          isEdit
          callerRole={localUser?.role ?? "admin"}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário <strong>{deleteUser?.name}</strong> ({deleteUser?.username}) será removido permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUser && deleteMutation.mutate({ id: deleteUser.id })}
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

// ---- User Form Dialog ----

type FormData = {
  name: string;
  username: string;
  password: string;
  role: "admin" | "setorial" | "viewer";
  position: string;
  organization: string;
  telefone: string;
  email: string;
  allowedOrgaos: string[];
  allowedProjects: string[];
  active?: number;
};

function UserFormDialog({
  open,
  onClose,
  title,
  initial,
  onSubmit,
  isPending,
  isEdit = false,
  callerRole,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initial?: Partial<UserRow>;
  onSubmit: (data: Partial<FormData>) => void;
  isPending: boolean;
  isEdit?: boolean;
  callerRole: string;
}) {
  const [form, setForm] = useState<FormData>({
    name: initial?.name ?? "",
    username: initial?.username ?? "",
    password: "",
    role: (initial?.role === "super_admin" ? "admin" : initial?.role) ?? "viewer",
    position: initial?.position ?? "",
    organization: initial?.organization ?? "",
    telefone: initial?.telefone ?? "",
    email: initial?.email ?? "",
    allowedOrgaos: initial?.allowedOrgaos ?? [],
    allowedProjects: initial?.allowedProjects ?? [],
  });
  const [active, setActive] = useState(initial?.active ?? 1);

  // Derivado diretamente do form — sem estado separado para evitar loop
  const selectAll = form.allowedOrgaos.includes("TODOS");

  const handleSelectAll = (checked: boolean) => {
    setForm(f => ({ ...f, allowedOrgaos: checked ? ["TODOS"] : [] }));
  };

  const toggleOrgao = (orgao: string) => {
    setForm(f => {
      const current = f.allowedOrgaos.filter(o => o !== "TODOS");
      const next = current.includes(orgao) ? current.filter(o => o !== orgao) : [...current, orgao];
      return { ...f, allowedOrgaos: next };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<FormData & { active: number }> = {
      name: form.name,
      username: form.username,
      role: form.role,
      position: form.position || undefined,
      organization: form.organization || undefined,
      telefone: form.telefone || undefined,
      email: form.email || undefined,
      allowedOrgaos: form.role === "setorial" ? form.allowedOrgaos : [],
      allowedProjects: form.allowedProjects,
    };
    if (form.password) data.password = form.password;
    if (isEdit) data.active = active;
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome completo *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: João da Silva"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Usuário (login) *</Label>
            <Input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))}
              placeholder="Ex: joao.silva ou email@orgao.gov.br"
              required
              disabled={isEdit}
              className={isEdit ? "opacity-60" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label>{isEdit ? "Nova senha (deixe em branco para manter)" : "Senha *"}</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              required={!isEdit}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                placeholder="Ex: Coordenador"
              />
            </div>
            <div className="space-y-2">
              <Label>Órgão / Entidade de lotação</Label>
              <Select
                value={form.organization || "__none__"}
                onValueChange={(v) => setForm((f) => ({ ...f, organization: v === "__none__" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o órgão ou entidade" />
                </SelectTrigger>
                <SelectContent portalled={false} className="z-[200]">
                  <SelectItem value="__none__"><span className="text-muted-foreground">— Nenhum —</span></SelectItem>
                  <div className="px-2 pt-2 pb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Órgãos Municipais</p>
                  </div>
                  {ORGAOS_MUNICIPAIS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                  <div className="px-2 pt-3 pb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Empresas Parceiras do PMI</p>
                  </div>
                  {EMPRESAS_PARCEIRAS.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Telefone / WhatsApp</Label>
              <Input
                value={form.telefone}
                onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                placeholder="Ex: (84) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail de contato</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Ex: nome@natal.rn.gov.br"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Perfil de acesso *</Label>
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as FormData["role"] }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent portalled={false} className="z-[200]">
                {callerRole === "super_admin" && (
                  <SelectItem value="admin">Administrador</SelectItem>
                )}
                <SelectItem value="setorial">Usuário Setorial</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projetos com acesso permitido */}
          <div className="space-y-3 p-4 rounded-lg border border-indigo-500/20 bg-indigo-500/5">
            <Label className="text-indigo-300 font-semibold">Projetos com acesso</Label>
            <div className="flex flex-col gap-2">
              {[{ id: "ribeira", label: "Ribeira PMI" }, { id: "sanea", label: "SANEA+ NATAL" }].map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary/50 cursor-pointer"
                  onClick={() => setForm(f => {
                    const has = f.allowedProjects.includes(proj.id);
                    return { ...f, allowedProjects: has ? f.allowedProjects.filter(p => p !== proj.id) : [...f.allowedProjects, proj.id] };
                  })}
                >
                  <Checkbox
                    id={`proj-${proj.id}`}
                    checked={form.allowedProjects.includes(proj.id)}
                    onCheckedChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs text-foreground select-none">{proj.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {form.allowedProjects.length === 0
                ? "Nenhum projeto selecionado — o usuário não conseguirá acessar a plataforma."
                : `${form.allowedProjects.length} projeto(s) selecionado(s).`}
            </p>
          </div>

          {/* Órgãos permitidos — apenas para perfil setorial */}
          {form.role === "setorial" && (
            <div className="space-y-3 p-4 rounded-lg border border-teal-500/20 bg-teal-500/5">
              <div className="flex items-center justify-between">
                <Label className="text-teal-300 font-semibold">Órgãos com acesso permitido</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={(v) => handleSelectAll(!!v)}
                  />
                  <label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer">
                    Selecionar todos
                  </label>
                </div>
              </div>
              {!selectAll && (
                <div className="h-56 overflow-y-auto rounded border border-border/50">
                  <div className="p-2 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">Órgãos Municipais</div>
                    {ORGAOS_MUNICIPAIS.map((orgao) => (
                      <div
                        key={orgao}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary/50 cursor-pointer"
                        onClick={() => toggleOrgao(orgao)}
                      >
                        <Checkbox
                          id={`orgao-${orgao}`}
                          checked={form.allowedOrgaos.includes(orgao)}
                          onCheckedChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-xs text-foreground select-none">{orgao}</span>
                      </div>
                    ))}
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-2 pt-2 pb-1">Empresas Parceiras</div>
                    {EMPRESAS_PARCEIRAS.map((orgao) => (
                      <div
                        key={orgao}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
                        onClick={() => toggleOrgao(orgao)}
                      >
                        <Checkbox
                          id={`orgao-${orgao}`}
                          checked={form.allowedOrgaos.includes(orgao)}
                          onCheckedChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-xs text-amber-700 dark:text-amber-300 select-none">{orgao}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectAll ? (
                <p className="text-xs text-teal-400">Este usuário terá acesso a todos os órgãos.</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {form.allowedOrgaos.length === 0
                    ? "Nenhum órgão selecionado — o usuário não poderá comentar nem incluir documentos."
                    : `${form.allowedOrgaos.length} órgão(s) selecionado(s).`}
                </p>
              )}
            </div>
          )}

          {isEdit && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={String(active)} onValueChange={(v) => setActive(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent portalled={false}>
                  <SelectItem value="1">Ativo</SelectItem>
                  <SelectItem value="0">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
