import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Trash2, User, ChevronDown, ChevronRight, Search, UserPlus } from "lucide-react";
import { ORGAOS_MUNICIPAIS, EMPRESAS_PARCEIRAS, isEmpresaParceira } from "@shared/orgaos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const EMPTY_FORM = {
  orgao: "",
  nome: "",
  cargo: "",
  telefone: "",
  email: "",
  localUserId: null as number | null,
  createUser: false,
  newUsername: "",
  newPassword: "",
  newRole: "setorial" as string,
};

type LocalUser = {
  id: number;
  name: string;
  username: string;
  role: string;
  position: string | null;
  organization: string | null;
  telefone: string | null;
  email: string | null;
  active: number;
  allowedOrgaos: string[];
};

type Responsavel = {
  id: number;
  orgao: string;
  nome: string;
  cargo: string | null;
  telefone: string | null;
  email: string | null;
  localUserId: number | null;
  sortOrder: number;
  createdAt: Date;
};

function OrgaoCard({
  orgao, list, isExpanded, onToggle, onAdd, onEdit, onDelete, localUsers, isPartner,
}: {
  orgao: string;
  list: Responsavel[];
  isExpanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onEdit: (r: Responsavel) => void;
  onDelete: (id: number) => void;
  localUsers: LocalUser[];
  isPartner: boolean;
}) {
  const borderClass = isPartner
    ? "border border-amber-300/50 dark:border-amber-700/40"
    : "";
  const headerBg = isPartner
    ? "hover:bg-amber-50/50 dark:hover:bg-amber-900/10"
    : "hover:bg-secondary/30";
  const iconColor = isPartner ? "text-amber-500" : "text-primary";

  return (
    <div className={`glass-card rounded-xl overflow-hidden ${borderClass}`}>
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${headerBg}`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          <span className={`font-semibold text-sm ${isPartner ? "text-amber-700 dark:text-amber-300" : "text-foreground"}`}>{orgao}</span>
          {isPartner && (
            <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
              Empresa Parceira
            </Badge>
          )}
          {list.length > 0 && (
            <Badge variant="outline" className={`text-xs ${isPartner ? "border-amber-300 text-amber-600 dark:text-amber-400" : ""}`}>
              {list.length} responsável{list.length !== 1 ? "is" : ""}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className={`h-7 px-2 text-xs gap-1 ${isPartner ? "text-amber-600 hover:text-amber-700 dark:text-amber-400" : ""}`}
          onClick={e => { e.stopPropagation(); onAdd(); }}
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </Button>
      </div>

      {isExpanded && (
        <div className={`border-t ${isPartner ? "border-amber-200/50 dark:border-amber-800/40" : "border-border/50"}`}>
          {list.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground italic">Nenhum responsável cadastrado.</div>
          ) : (
            <div className="divide-y divide-border/30">
              {list.map((r, idx) => {
                const linkedUser = localUsers.find(u => u.id === r.localUserId);
                return (
                  <div key={r.id} className="flex items-start justify-between px-4 py-3 hover:bg-secondary/20 transition-colors group">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isPartner ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10"}`}>
                        <User className={`w-3.5 h-3.5 ${iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{r.nome}</span>
                          {idx === 0 && <Badge className="text-[10px] px-1.5 py-0" variant="secondary">Principal</Badge>}
                          {linkedUser && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                              <User className="w-2.5 h-2.5" />
                              {linkedUser.username}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 space-x-3">
                          {r.cargo && <span>{r.cargo}</span>}
                          {r.telefone && <span>📞 {r.telefone}</span>}
                          {r.email && <span>✉ {r.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(r)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(r.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrgaosResponsaveis() {
  const utils = trpc.useUtils();

  // Queries
  const { data: responsaveis = [], isLoading } = trpc.orgaoResponsaveis.list.useQuery({ orgao: undefined });
  const { data: usersData } = trpc.localAuth.users.list.useQuery();
  const localUsers: LocalUser[] = (usersData as LocalUser[] | undefined) ?? [];

  // Mutations
  const addMut = trpc.orgaoResponsaveis.add.useMutation({
    onSuccess: () => { utils.orgaoResponsaveis.list.invalidate(); toast.success("Responsável adicionado."); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.orgaoResponsaveis.update.useMutation({
    onSuccess: () => { utils.orgaoResponsaveis.list.invalidate(); toast.success("Responsável atualizado."); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const removeMut = trpc.orgaoResponsaveis.remove.useMutation({
    onSuccess: () => { utils.orgaoResponsaveis.list.invalidate(); toast.success("Responsável removido."); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });
  const createUserMut = trpc.localAuth.users.create.useMutation({
    onError: (e) => toast.error("Erro ao criar usuário: " + e.message),
  });

  // State
  const [expandedOrgaos, setExpandedOrgaos] = useState<Set<string>>(new Set([...ORGAOS_MUNICIPAIS.slice(0, 5), ...EMPRESAS_PARCEIRAS]));
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // Group responsaveis by orgao
  const grouped = useMemo(() => {
    const map = new Map<string, Responsavel[]>();
    for (const r of responsaveis) {
      const list = map.get(r.orgao) ?? [];
      list.push(r);
      map.set(r.orgao, list);
    }
    return map;
  }, [responsaveis]);

  // Filter orgaos by search (municipal)
  const filteredOrgaos = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return ORGAOS_MUNICIPAIS;
    return ORGAOS_MUNICIPAIS.filter(o =>
      o.toLowerCase().includes(q) ||
      (grouped.get(o) ?? []).some(r => r.nome.toLowerCase().includes(q))
    );
  }, [search, grouped]);

  // Filter empresas parceiras by search
  const filteredEmpresas = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return EMPRESAS_PARCEIRAS;
    return EMPRESAS_PARCEIRAS.filter(o =>
      o.toLowerCase().includes(q) ||
      (grouped.get(o) ?? []).some(r => r.nome.toLowerCase().includes(q))
    );
  }, [search, grouped]);

  // Auto-fill form when a local user is selected
  useEffect(() => {
    if (form.localUserId === null) return;
    const user = localUsers.find(u => u.id === form.localUserId);
    if (!user) return;
    setForm(f => ({
      ...f,
      nome: f.nome || user.name,
      cargo: f.cargo || (user.position ?? ""),
      telefone: f.telefone || (user.telefone ?? ""),
      email: f.email || (user.email ?? ""),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.localUserId]);

  // Users filtered by orgao (for linking)
  const usersForOrgao = useMemo(() => {
    if (!form.orgao) return localUsers;
    return localUsers.filter(u =>
      u.allowedOrgaos.includes(form.orgao) ||
      u.allowedOrgaos.includes("TODOS") ||
      u.role === "admin" || u.role === "super_admin"
    );
  }, [form.orgao, localUsers]);

  function openAdd(orgao: string) {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, orgao });
    setShowDialog(true);
  }

  function openEdit(r: Responsavel) {
    setEditingId(r.id);
    setForm({
      orgao: r.orgao,
      nome: r.nome,
      cargo: r.cargo ?? "",
      telefone: r.telefone ?? "",
      email: r.email ?? "",
      localUserId: r.localUserId,
      createUser: false,
      newUsername: "",
      newPassword: "",
      newRole: "setorial",
    });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório."); return; }
    if (!form.orgao) { toast.error("Órgão é obrigatório."); return; }

    let localUserId = form.localUserId;

    // If creating a new user
    if (form.createUser) {
      if (!form.newUsername.trim() || !form.newPassword.trim()) {
        toast.error("Usuário e senha são obrigatórios para cadastrar novo usuário.");
        return;
      }
      try {
        const result = await createUserMut.mutateAsync({
          name: form.nome,
          username: form.newUsername,
          password: form.newPassword,
          role: form.newRole as "admin" | "setorial" | "viewer",
          position: form.cargo || undefined,
          organization: form.orgao,
          allowedOrgaos: form.orgao ? [form.orgao] : [],
        });
        localUserId = ((result as unknown) as { id: number }).id ?? null;
        toast.success(`Usuário "${form.newUsername}" criado com sucesso.`);
        utils.localAuth.users.list.invalidate();
      } catch {
        return; // error already shown by onError
      }
    }

    const payload = {
      orgao: form.orgao,
      nome: form.nome.trim(),
      cargo: form.cargo.trim() || null,
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      localUserId,
    };

    if (editingId !== null) {
      updateMut.mutate({ id: editingId, ...payload });
    } else {
      addMut.mutate({ ...payload, sortOrder: (grouped.get(form.orgao) ?? []).length });
    }
  }

  function toggleOrgao(orgao: string) {
    setExpandedOrgaos(prev => {
      const next = new Set(prev);
      if (next.has(orgao)) next.delete(orgao);
      else next.add(orgao);
      return next;
    });
  }

  const totalResponsaveis = responsaveis.length;
  const orgaosComResponsaveis = grouped.size;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Responsáveis por Órgão</h1>
          <Badge variant="secondary" className="text-xs">{totalResponsaveis} responsáveis · {orgaosComResponsaveis} órgãos</Badge>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar órgão ou responsável..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
      </div>

      {/* Orgaos list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl h-12 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Órgãos Municipais ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">Órgãos Municipais</h2>
            </div>
            {filteredOrgaos.map(orgao => (
              <OrgaoCard
                key={orgao}
                orgao={orgao}
                list={grouped.get(orgao) ?? []}
                isExpanded={expandedOrgaos.has(orgao)}
                onToggle={() => toggleOrgao(orgao)}
                onAdd={() => openAdd(orgao)}
                onEdit={openEdit}
                onDelete={id => setDeleteId(id)}
                localUsers={localUsers}
                isPartner={false}
              />
            ))}
          </div>

          {/* ── Empresas Parceiras ── */}
          {filteredEmpresas.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-500">🏢</span>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Empresas Parceiras</h2>
                <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                  PMI Ribeira Sustentável
                </Badge>
              </div>
              {filteredEmpresas.map(orgao => (
                <OrgaoCard
                  key={orgao}
                  orgao={orgao}
                  list={grouped.get(orgao) ?? []}
                  isExpanded={expandedOrgaos.has(orgao)}
                  onToggle={() => toggleOrgao(orgao)}
                  onAdd={() => openAdd(orgao)}
                  onEdit={openEdit}
                  onDelete={id => setDeleteId(id)}
                  localUsers={localUsers}
                  isPartner={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Responsável" : `Adicionar Responsável — ${form.orgao}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {!editingId && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Órgão</label>
                <Select value={form.orgao} onValueChange={v => setForm(f => ({ ...f, orgao: v, localUserId: null }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecionar órgão..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Órgãos Municipais</div>
                    {ORGAOS_MUNICIPAIS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    <div className="px-2 py-1 mt-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Empresas Parceiras</div>
                    {EMPRESAS_PARCEIRAS.map(o => (
                      <SelectItem key={o} value={o}>
                        <span className="text-amber-700 dark:text-amber-300">{o}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome *</label>
              <Input className="mt-1" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cargo</label>
              <Input className="mt-1" value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Cargo ou função" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Telefone</label>
                <Input className="mt-1" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(84) 9xxxx-xxxx" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">E-mail</label>
                <Input className="mt-1" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@natal.rn.gov.br" />
              </div>
            </div>

            {/* Link to existing user */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Vincular a usuário cadastrado</label>
              <Select
                value={form.localUserId !== null ? String(form.localUserId) : "__none__"}
                onValueChange={v => {
                  const newId = v === "__none__" ? null : Number(v);
                  const user = newId !== null ? localUsers.find(u => u.id === newId) : null;
                  setForm(f => ({
                    ...f,
                    localUserId: newId,
                    createUser: false,
                    // Auto-fill fields from the selected user (only if currently empty)
                    nome: f.nome || (user?.name ?? f.nome),
                    cargo: f.cargo || (user?.position ?? f.cargo),
                    telefone: f.telefone || (user?.telefone ?? f.telefone),
                    email: f.email || (user?.email ?? f.email),
                  }));
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Nenhum (sem vínculo)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum (sem vínculo)</SelectItem>
                  {usersForOrgao.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.username}) — {u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Option to create new user */}
            {form.localUserId === null && (
              <div>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  onClick={() => setForm(f => ({ ...f, createUser: !f.createUser }))}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {form.createUser ? "Cancelar criação de usuário" : "Cadastrar novo usuário para este responsável"}
                </button>
                {form.createUser && (
                  <div className="mt-2 p-3 rounded-lg border border-border bg-secondary/20 space-y-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Usuário (login) *</label>
                      <Input className="mt-1" value={form.newUsername} onChange={e => setForm(f => ({ ...f, newUsername: e.target.value }))} placeholder="nome.usuario" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Senha *</label>
                      <Input className="mt-1" type="password" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Senha de acesso" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Perfil</label>
                      <Select value={form.newRole} onValueChange={v => setForm(f => ({ ...f, newRole: v }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="setorial">Setorial</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={addMut.isPending || updateMut.isPending || createUserMut.isPending}>
              {editingId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover responsável?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. O responsável será removido da tabela de órgãos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId !== null && removeMut.mutate({ id: deleteId })}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
