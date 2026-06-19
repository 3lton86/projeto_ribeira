import { and, desc, eq, inArray, isNull, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { actions, actionDocuments, auditLog, comments, governanceNodes, history, InsertAuditLog, InsertLocalUser, InsertUser, localUsers, notifications, InsertNotification, userOrgaos, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach((field) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    });
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---- ACTIONS ----

export async function getActions(filters?: {
  area?: string[];
  priority?: string[];
  status?: string[];
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.area?.length) {
    conditions.push(inArray(actions.area, filters.area as any));
  }
  if (filters?.priority?.length) {
    conditions.push(inArray(actions.priority, filters.priority as any));
  }
  if (filters?.status?.length) {
    conditions.push(inArray(actions.status, filters.status as any));
  }
  if (filters?.search) {
    conditions.push(like(actions.description, `%${filters.search}%`));
  }
  const query = conditions.length > 0
    ? db.select().from(actions).where(and(...conditions)).orderBy(actions.area, actions.sortOrder)
    : db.select().from(actions).orderBy(actions.area, actions.sortOrder);
  return query;
}

/**
 * Retorna apenas os itens (isGroup=0) cujo campo `orgao` está na lista de órgãos permitidos do usuário setorial.
 * Grupos (isGroup=1) são incluídos apenas se tiverem ao menos um filho visível — a filtragem de grupos
 * é feita no frontend (já existente), então aqui retornamos todos os grupos + os itens filtrados.
 */
export async function getActionsForSetorial(
  allowedOrgaos: string[],
  filters?: {
    area?: string[];
    priority?: string[];
    status?: string[];
    search?: string;
  }
) {
  const db = await getDb();
  if (!db) return [];
  const conditions: ReturnType<typeof eq>[] = [];
  if (filters?.area?.length) conditions.push(inArray(actions.area, filters.area as any) as any);
  if (filters?.priority?.length) conditions.push(inArray(actions.priority, filters.priority as any) as any);
  if (filters?.status?.length) conditions.push(inArray(actions.status, filters.status as any) as any);
  if (filters?.search) conditions.push(like(actions.description, `%${filters.search}%`) as any);

  // Buscar todos os registros (grupos + itens) com os filtros base
  const baseQuery = conditions.length > 0
    ? db.select().from(actions).where(and(...conditions)).orderBy(actions.area, actions.sortOrder)
    : db.select().from(actions).orderBy(actions.area, actions.sortOrder);
  const all = await baseQuery;

  // Primeiro: identificar quais itens (isGroup=0) são visíveis para este setorial
  const visibleItems = all.filter((a) => {
    if (a.isGroup === 1) return false;
    if (!a.orgao) return false;
    return allowedOrgaos.includes(a.orgao);
  });

  // Um grupo é visível se algum item visível tem parentCode que começa com o itemCode do grupo
  // (ex: grupo "1" é visível se há item com parentCode "1" ou "1.x")
  const visibleGroups = all.filter((a) => {
    if (a.isGroup !== 1) return false;
    // Verificar se algum item visível pertence a este grupo (parentCode === grupo.itemCode)
    return visibleItems.some((item) => item.parentCode === a.itemCode);
  });

  // Combinar grupos visíveis + itens visíveis, mantendo a ordem original
  const visibleIds = new Set([...visibleGroups.map((g) => g.id), ...visibleItems.map((i) => i.id)]);
  return all.filter((a) => visibleIds.has(a.id));
}

export async function getActionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(actions).where(eq(actions.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getNextItemCode(area: string): Promise<string> {
  const db = await getDb();
  if (!db) return "1";
  // Get all top-level items (isGroup=0) for this area, ordered by sortOrder desc
  const rows = await db
    .select({ itemCode: actions.itemCode, sortOrder: actions.sortOrder })
    .from(actions)
    .where(and(eq(actions.area, area as any), eq(actions.isGroup, 0)))
    .orderBy(desc(actions.sortOrder))
    .limit(1);
  if (rows.length === 0) return "1";
  // Generate next sequential code based on count
  const allRows = await db
    .select({ id: actions.id })
    .from(actions)
    .where(and(eq(actions.area, area as any), eq(actions.isGroup, 0)));
  return String(allRows.length + 1);
}

export async function createAction(data: {
  area: "Governança" | "Técnico" | "Jurídico" | "Eco-Fin";
  description: string;
  priority?: "Alta" | "Média" | "Baixa";
  status?: "Pendente" | "Em Andamento" | "Concluído" | "Cancelado";
  dueDate?: Date | null;
  requestDate?: Date;
  receiptDate?: Date;
  documentBase?: string;
  orgao?: string;
  responsavelNome?: string;
  responsavelCargo?: string;
  responsavelTel?: string;
  responsavelEmail?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const itemCode = await getNextItemCode(data.area);
  // Get max sortOrder for this area
  const maxRows = await db
    .select({ sortOrder: actions.sortOrder })
    .from(actions)
    .where(eq(actions.area, data.area as any))
    .orderBy(desc(actions.sortOrder))
    .limit(1);
  const nextSortOrder = maxRows.length > 0 ? (maxRows[0].sortOrder + 1) : 1;
  const result = await db.insert(actions).values({
    area: data.area,
    itemCode,
    isGroup: 0,
    description: data.description,
    priority: data.priority ?? "Média",
    status: data.status ?? "Pendente",
    dueDate: data.dueDate ?? null,
    requestDate: data.requestDate,
    receiptDate: data.receiptDate,
    documentBase: data.documentBase,
    orgao: data.orgao,
    responsavelNome: data.responsavelNome,
    responsavelCargo: data.responsavelCargo,
    responsavelTel: data.responsavelTel,
    responsavelEmail: data.responsavelEmail,
    sortOrder: nextSortOrder,
  });
  return (result as any).insertId as number;
}

export async function updateAction(
  id: number,
  data: Partial<{
    status: "Pendente" | "Em Andamento" | "Concluído" | "Cancelado";
    priority: "Alta" | "Média" | "Baixa";
    dueDate: Date | null;
    requestDate: Date;
    receiptDate: Date;
    documentBase: string;
    orgao: string;
    responsavelNome: string;
    responsavelCargo: string;
    responsavelTel: string;
    responsavelEmail: string;
  }>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(actions).set(data).where(eq(actions.id, id));
}

export async function deleteAction(id: number) {
  const db = await getDb();
  if (!db) return;
  // Delete related records first (comments, history, documents)
  await db.delete(comments).where(eq(comments.actionId, id));
  await db.delete(history).where(eq(history.actionId, id));
  await db.delete(actionDocuments).where(eq(actionDocuments.actionId, id));
  await db.delete(actions).where(eq(actions.id, id));
}

export async function updateGroupDescription(id: number, description: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(actions).set({ description }).where(eq(actions.id, id));
}

/**
 * Bulk-update sortOrder for a list of action IDs.
 * Accepts an array of { id, sortOrder } pairs.
 */
export async function reorderActions(items: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db || items.length === 0) return;
  // Execute individual updates in a transaction-like batch
  for (const item of items) {
    await db.update(actions).set({ sortOrder: item.sortOrder }).where(eq(actions.id, item.id));
  }
}

/**
 * Create a sub-item under an existing action item.
 * parentCode is the itemCode of the parent (e.g. "3").
 * The new sub-item gets itemCode like "3.1", "3.2", etc.
 */
export async function createSubItem(data: {
  area: "Governança" | "Técnico" | "Jurídico" | "Eco-Fin";
  parentId: number;
  parentCode: string;
  description: string;
  priority?: "Alta" | "Média" | "Baixa";
  status?: "Pendente" | "Em Andamento" | "Concluído" | "Cancelado";
  dueDate?: Date | null;
  orgao?: string;
  responsavelNome?: string;
  responsavelCargo?: string;
  responsavelTel?: string;
  responsavelEmail?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Count existing sub-items with the same parentCode in this area
  const existingSubs = await db
    .select({ id: actions.id })
    .from(actions)
    .where(
      and(
        eq(actions.area, data.area as any),
        eq(actions.parentCode, data.parentCode),
        eq(actions.isGroup, 0)
      )
    );
  const subIndex = existingSubs.length + 1;
  const itemCode = `${data.parentCode}.${subIndex}`;

  // Get max sortOrder for this area to place at end
  const maxRows = await db
    .select({ sortOrder: actions.sortOrder })
    .from(actions)
    .where(eq(actions.area, data.area as any))
    .orderBy(desc(actions.sortOrder))
    .limit(1);
  const nextSortOrder = maxRows.length > 0 ? (maxRows[0].sortOrder + 1) : 1;

  const result = await db.insert(actions).values({
    area: data.area,
    itemCode,
    parentCode: data.parentCode,
    isGroup: 0,
    description: data.description,
    priority: data.priority ?? "Média",
    status: data.status ?? "Pendente",
    dueDate: data.dueDate ?? null,
    orgao: data.orgao,
    responsavelNome: data.responsavelNome,
    responsavelCargo: data.responsavelCargo,
    responsavelTel: data.responsavelTel,
    responsavelEmail: data.responsavelEmail,
    sortOrder: nextSortOrder,
  });
  return (result as any).insertId as number;
}

// ---- COMMENTS ----

export async function getCommentsByActionId(actionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: comments.id,
      actionId: comments.actionId,
      content: comments.content,
      createdAt: comments.createdAt,
      userId: comments.userId,
      userName: users.name,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.actionId, actionId))
    .orderBy(desc(comments.createdAt));
}

export async function createComment(data: { actionId: number; userId: number; content: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(comments).values(data);
}

// ---- HISTORY ----

export async function getHistoryByActionId(actionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: history.id,
      actionId: history.actionId,
      fieldChanged: history.fieldChanged,
      oldValue: history.oldValue,
      newValue: history.newValue,
      createdAt: history.createdAt,
      userId: history.userId,
      userName: users.name,
    })
    .from(history)
    .leftJoin(users, eq(history.userId, users.id))
    .where(eq(history.actionId, actionId))
    .orderBy(desc(history.createdAt));
}

export async function createHistory(data: {
  actionId: number;
  userId: number;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(history).values(data);
}

// ---- GOVERNANCE ----

export async function getGovernanceNodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(governanceNodes).orderBy(governanceNodes.sortOrder);
}

// ---- DASHBOARD KPIs ----

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const allActions = await db
    .select({
      area: actions.area,
      status: actions.status,
      priority: actions.priority,
      isGroup: actions.isGroup,
      dueDate: actions.dueDate,
    })
    .from(actions);

  const items = allActions.filter((a) => a.isGroup === 0);

  const total = items.length;
  const byStatus = {
    Pendente: items.filter((a) => a.status === "Pendente").length,
    "Em Andamento": items.filter((a) => a.status === "Em Andamento").length,
    Concluído: items.filter((a) => a.status === "Concluído").length,
    Cancelado: items.filter((a) => a.status === "Cancelado").length,
  };

  const areas = ["Governança", "Técnico", "Jurídico", "Eco-Fin"] as const;
  const byArea = areas.map((area) => {
    const areaItems = items.filter((a) => a.area === area);
    return {
      area,
      total: areaItems.length,
      Pendente: areaItems.filter((a) => a.status === "Pendente").length,
      "Em Andamento": areaItems.filter((a) => a.status === "Em Andamento").length,
      Concluído: areaItems.filter((a) => a.status === "Concluído").length,
      Cancelado: areaItems.filter((a) => a.status === "Cancelado").length,
      completion: areaItems.length > 0
        ? Math.round((areaItems.filter((a) => a.status === "Concluído").length / areaItems.length) * 100)
        : 0,
    };
  });

  const byPriority = {
    Alta: items.filter((a) => a.priority === "Alta").length,
    Média: items.filter((a) => a.priority === "Média").length,
    Baixa: items.filter((a) => a.priority === "Baixa").length,
  };

  const completionRate = total > 0 ? Math.round((byStatus["Concluído"] / total) * 100) : 0;

  const now = new Date();
  const itemsWithDue = items.filter((a) => a.dueDate);
  const byDeadline = {
    noPrazo: itemsWithDue.filter((a) => a.dueDate! >= now && a.status !== "Concluído" && a.status !== "Cancelado").length,
    atrasado: itemsWithDue.filter((a) => a.dueDate! < now && a.status !== "Concluído" && a.status !== "Cancelado").length,
    concluido: items.filter((a) => a.status === "Concluído").length,
    semPrazo: items.filter((a) => !a.dueDate && a.status !== "Concluído" && a.status !== "Cancelado").length,
  };

  return { total, byStatus, byArea, byPriority, completionRate, byDeadline };
}

// ---- LOCAL USERS ----

export async function getLocalUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: localUsers.id,
    name: localUsers.name,
    username: localUsers.username,
    role: localUsers.role,
    position: localUsers.position,
    organization: localUsers.organization,
    active: localUsers.active,
    createdAt: localUsers.createdAt,
  }).from(localUsers).orderBy(localUsers.name);
}

export async function getLocalUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(localUsers).where(eq(localUsers.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getLocalUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(localUsers).where(eq(localUsers.username, username)).limit(1);
  return result[0] ?? null;
}

export async function createLocalUser(data: InsertLocalUser) {
  const db = await getDb();
  if (!db) return;
  await db.insert(localUsers).values(data);
}

export async function updateLocalUser(
  id: number,
  data: Partial<{ name: string; username: string; passwordHash: string; role: "super_admin" | "admin" | "setorial" | "viewer"; position: string; organization: string; active: number }>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(localUsers).set(data).where(eq(localUsers.id, id));
}

export async function deleteLocalUser(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(localUsers).where(eq(localUsers.id, id));
}

// ---- USER ORGAOS (acesso setorial por órgão) ----

export async function getUserOrgaos(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ orgao: userOrgaos.orgao }).from(userOrgaos).where(eq(userOrgaos.userId, userId));
  return rows.map(r => r.orgao);
}

/**
 * Replace all orgãos for a user.
 * Pass ["TODOS"] for unrestricted access, or an empty array to revoke all access.
 */
export async function upsertUserOrgaos(userId: number, orgaos: string[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Delete existing entries for this user
  await db.delete(userOrgaos).where(eq(userOrgaos.userId, userId));
  if (orgaos.length === 0) return;
  await db.insert(userOrgaos).values(orgaos.map(orgao => ({ userId, orgao })));
}

/**
 * Check if a setorial user has access to a given orgão.
 * Returns true if the user has "TODOS" or the specific orgão in their list.
 */
export async function setorialUserHasOrgaoAccess(userId: number, orgao: string | null | undefined): Promise<boolean> {
  const allowed = await getUserOrgaos(userId);
  if (allowed.includes("TODOS")) return true;
  if (!orgao) return false;
  return allowed.includes(orgao);
}

// ---- ACTION DOCUMENTS ----

export async function getDocumentsByActionId(actionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(actionDocuments)
    .where(eq(actionDocuments.actionId, actionId))
    .orderBy(desc(actionDocuments.createdAt));
}

export async function createActionDocument(data: { actionId: number; label: string; url: string; uploadedBy: number; uploaderName?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(actionDocuments).values(data);
}

export async function deleteActionDocument(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(actionDocuments).where(eq(actionDocuments.id, id));
}
/**
 * Retorna os IDs de actions que possuem documentos com o status especificado.
 * docFilter: 'any' = tem pelo menos 1 doc, 'pending' = tem doc com pendência, 'accepted' = tem doc aceito
 */
export async function getActionIdsWithDocFilter(docFilter: 'any' | 'pending' | 'accepted'): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  let rows: { actionId: number }[];
  if (docFilter === 'any') {
    rows = await db.selectDistinct({ actionId: actionDocuments.actionId }).from(actionDocuments);
  } else {
    const statusVal = docFilter === 'pending' ? 'pending' : 'accepted';
    rows = await db.selectDistinct({ actionId: actionDocuments.actionId })
      .from(actionDocuments)
      .where(eq(actionDocuments.docStatus, statusVal));
  }
  return rows.map(r => r.actionId);
}
export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(actionDocuments).where(eq(actionDocuments.id, id)).limit(1);
  return result[0] ?? null;
}
export async function updateDocumentStatus(id: number, docStatus: string | null, updaterName: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(actionDocuments)
    .set({
      docStatus: docStatus as any,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: updaterName,
    })
    .where(eq(actionDocuments.id, id));
}
// ---- EXPORT DATA ----

export async function getExportData(filters?: {
  area?: string[];
  priority?: string[];
  status?: string[];
  orgao?: string[];
  searchText?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.area?.length) conditions.push(inArray(actions.area, filters.area as any));
  if (filters?.priority?.length) conditions.push(inArray(actions.priority, filters.priority as any));
  if (filters?.status?.length) conditions.push(inArray(actions.status, filters.status as any));
  if (filters?.orgao?.length) conditions.push(inArray(actions.orgao, filters.orgao as any));
  conditions.push(eq(actions.isGroup, 0));

  const rows = await db
    .select()
    .from(actions)
    .where(and(...conditions))
    .orderBy(actions.area, actions.sortOrder);

  // Apply text search client-side (description)
  const filtered = filters?.searchText
    ? rows.filter(r => r.description.toLowerCase().includes(filters.searchText!.toLowerCase()))
    : rows;

  if (filtered.length === 0) return [];

  // Fetch comments for all returned actions
  const actionIds = filtered.map(r => r.id);
  const allComments = await db
    .select({
      id: comments.id,
      actionId: comments.actionId,
      content: comments.content,
      createdAt: comments.createdAt,
      userName: users.name,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(inArray(comments.actionId, actionIds))
    .orderBy(comments.actionId, desc(comments.createdAt));

  // Fetch documents for all returned actions
  const allDocs = await db
    .select()
    .from(actionDocuments)
    .where(inArray(actionDocuments.actionId, actionIds))
    .orderBy(actionDocuments.actionId, actionDocuments.createdAt);

  // Group comments and docs by actionId
  const commentsByAction: Record<number, typeof allComments> = {};
  for (const c of allComments) {
    if (!commentsByAction[c.actionId]) commentsByAction[c.actionId] = [];
    commentsByAction[c.actionId].push(c);
  }
  const docsByAction: Record<number, typeof allDocs> = {};
  for (const d of allDocs) {
    if (!docsByAction[d.actionId]) docsByAction[d.actionId] = [];
    docsByAction[d.actionId].push(d);
  }

  return filtered.map(r => ({
    ...r,
    comments: commentsByAction[r.id] ?? [],
    documents: docsByAction[r.id] ?? [],
  }));
}

// ---- Audit Log ----

export async function createAuditLog(entry: InsertAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values(entry);
}

export async function getAuditLogByActionId(actionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(auditLog)
    .where(eq(auditLog.actionId, actionId))
    .orderBy(desc(auditLog.createdAt));
}
export async function getAuditLogAll() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(500);
}

// ---- Notifications ----
export async function createNotification(entry: InsertNotification): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(entry);
}
export async function createNotificationsForAdmins(
  entry: Omit<InsertNotification, 'userId'>,
  adminIds: number[]
): Promise<void> {
  const db = await getDb();
  if (!db || adminIds.length === 0) return;
  await db.insert(notifications).values(adminIds.map(uid => ({ ...entry, userId: uid })));
}
export async function getNotificationsForUser(userId: number, type?: 'item_change' | 'comment_doc') {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(notifications.userId, userId)];
  if (type) conditions.push(eq(notifications.type, type));
  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
}
export async function getUnreadCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
  return Number(result[0]?.count ?? 0);
}
export async function markNotificationRead(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: 1 }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}
export async function markAllNotificationsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: 1 }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
}
export async function getAdminAndSuperAdminIds(): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ id: localUsers.id })
    .from(localUsers)
    .where(and(inArray(localUsers.role, ['admin', 'super_admin']), eq(localUsers.active, 1)));
  return result.map(r => r.id);
}
export async function getSetorialUserIdsForOrgao(orgao: string): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  // Busca setoriais com acesso ao órgão específico ou com acesso a TODOS
  const result = await db
    .select({ userId: userOrgaos.userId })
    .from(userOrgaos)
    .where(or(eq(userOrgaos.orgao, orgao), eq(userOrgaos.orgao, 'TODOS')));
  const ids = result.map(r => r.userId);
  return ids.filter((v, i, a) => a.indexOf(v) === i);
}

// ---- Auto-cadastro e aprovação ----
export async function getPendingUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(localUsers).where(eq(localUsers.pendingApproval, 1)).orderBy(desc(localUsers.createdAt));
}

export async function approveUser(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(localUsers).set({ pendingApproval: 0, active: 1 }).where(eq(localUsers.id, id));
}

export async function rejectUser(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Remove o usuário rejeitado
  await db.delete(localUsers).where(eq(localUsers.id, id));
}
