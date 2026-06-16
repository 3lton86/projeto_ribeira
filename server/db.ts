import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { actions, actionDocuments, comments, governanceNodes, history, InsertLocalUser, InsertUser, localUsers, users } from "../drizzle/schema";
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
  data: Partial<{ name: string; username: string; passwordHash: string; role: "super_admin" | "admin" | "viewer"; position: string; organization: string; active: number }>
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
