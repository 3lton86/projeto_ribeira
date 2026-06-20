import { useState, useEffect } from "react";
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
import { Plus, Pencil, Trash2, UserCheck, UserX, ShieldCheck, Eye, Shield, Building2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { ORGAOS_MUNICIPAIS } from "@shared/orgaos";

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
};

const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  super_admin: { label: "Super Admin", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", icon: <ShieldCheck className="w-3 h-3" /> },
  admin: { label: "Administrador", color: "text-primary bg-primary/10 border-primary/30", icon: <Shield className="w-3 h-3" /> },
  setorial: { label: "Usuário Setorial", color: "text-teal-400 bg-teal-400/10 border-teal-400/30", icon: <Building2 className="w-3 h-3" /> },
  viewer: { label: "Visualizador", color: "text-muted-foreground bg-secondary border-border", icon: <Eye className="w-3 h-3" /> },
};

export default function Users() {
  const [, navigate] = useLocation();
  const { isSuperAdmin, isAdmin, localUser } = useLocalAuth();
  const utils = trpc.useUtils();

  const canManage = isSuperAdmin || isAdmin;

  const { data: users = [], isLoading } = trpc.localAuth.users.list.useQuery(undefined, {
    enabled: canManage,
  });
  const { data: pendingUsers = [], isLoading: pendingLoading } = trpc.localAuth.users.listPending.useQuery(undefined, {
    enabled: canManage,
  });

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
    onError: (e) => toast.error(e.message),
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
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Button>
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Usuário</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cargo / Órgão</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Perfil</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Órgãos Permitidos</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(users as UserRow[]).map((u) => {
                const roleInfo = ROLE_LABELS[u.role] ?? ROLE_LABELS.viewer;
                return (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
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
                    <td className="px-4 py-3 text-right">
                      {u.role !== "super_admin" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditUser(u)}
                            className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {u.id !== localUser?.id && (
                            <button
                              onClick={() => setDeleteUser(u)}
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
              <Label>Órgão de lotação</Label>
              <Input
                value={form.organization}
                onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                placeholder="Ex: SEMURB"
              />
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
                <div className="h-48 overflow-y-auto rounded border border-border/50">
                  <div className="p-2 space-y-1">
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
                        <span className="text-xs text-foreground select-none">
                          {orgao}
                        </span>
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
