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
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.area?.length) conditions.push(inArray(actions.area, filters.area as any));
  if (filters?.priority?.length) conditions.push(inArray(actions.priority, filters.priority as any));
  if (filters?.status?.length) conditions.push(inArray(actions.status, filters.status as any));
  conditions.push(eq(actions.isGroup, 0));

  return db
    .select()
    .from(actions)
    .where(and(...conditions))
    .orderBy(actions.area, actions.sortOrder);
}
