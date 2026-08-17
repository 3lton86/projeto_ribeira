import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  json,
  bigint,
  boolean,
} from "drizzle-orm/pg-core";

// ---- ENUMS ----
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const areaEnum = pgEnum("area", ["Governança", "Técnico", "Jurídico", "Eco-Fin"]);
export const priorityEnum = pgEnum("priority", ["Alta", "Média", "Baixa"]);
export const statusEnum = pgEnum("status", ["Pendente", "Em Andamento", "Concluído", "Cancelado"]);
export const projectEnum = pgEnum("project", ["ribeira", "sanea"]);
export const governanceNodeTypeEnum = pgEnum("governance_node_type", ["root", "committee", "board", "focal", "entity"]);
export const localUserRoleEnum = pgEnum("local_user_role", ["super_admin", "admin", "setorial", "viewer"]);
export const auditEventTypeEnum = pgEnum("audit_event_type", ["comment", "document"]);
export const notificationTypeEnum = pgEnum("notification_type", ["item_change", "comment_doc"]);
export const contactChannelEnum = pgEnum("contact_channel", ["email", "whatsapp"]);

// ---- TABLES ----

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Ações/Itens das 4 áreas temáticas
export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  area: areaEnum("area").notNull(),
  itemCode: varchar("itemCode", { length: 20 }).notNull(),
  parentCode: varchar("parentCode", { length: 20 }),
  isGroup: integer("isGroup").default(0).notNull(),
  description: text("description").notNull(),
  priority: priorityEnum("priority"),
  status: statusEnum("status").default("Pendente").notNull(),
  dueDate: timestamp("dueDate"),
  requestDate: timestamp("requestDate"),
  receiptDate: timestamp("receiptDate"),
  documentBase: text("documentBase"),
  observacoes: text("observacoes"),
  orgao: varchar("orgao", { length: 50 }),
  responsavelNome: varchar("responsavelNome", { length: 200 }),
  responsavelCargo: varchar("responsavelCargo", { length: 200 }),
  responsavelTel: varchar("responsavelTel", { length: 50 }),
  responsavelEmail: varchar("responsavelEmail", { length: 320 }),
  sortOrder: integer("sortOrder").default(0).notNull(),
  project: projectEnum("project").default("ribeira").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Action = typeof actions.$inferSelect;
export type InsertAction = typeof actions.$inferInsert;

// Comentários por item
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  actionId: integer("actionId").notNull(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// Histórico de alterações por item
export const history = pgTable("history", {
  id: serial("id").primaryKey(),
  actionId: integer("actionId").notNull(),
  userId: integer("userId").notNull(),
  fieldChanged: varchar("fieldChanged", { length: 100 }).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type History = typeof history.$inferSelect;
export type InsertHistory = typeof history.$inferInsert;

// Nós da estrutura de governança
export const governanceNodes = pgTable("governance_nodes", {
  id: serial("id").primaryKey(),
  parentId: integer("parentId"),
  title: varchar("title", { length: 200 }).notNull(),
  subtitle: text("subtitle"),
  type: governanceNodeTypeEnum("type").notNull(),
  theme: varchar("theme", { length: 50 }),
  sortOrder: integer("sortOrder").default(0).notNull(),
});

export type GovernanceNode = typeof governanceNodes.$inferSelect;
export type InsertGovernanceNode = typeof governanceNodes.$inferInsert;

// Usuários locais do sistema (criados pelo super-admin, autenticam com nome+senha)
export const localUsers = pgTable("local_users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: localUserRoleEnum("role").default("viewer").notNull(),
  position: varchar("position", { length: 200 }),
  organization: varchar("organization", { length: 200 }),
  telefone: varchar("telefone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  active: integer("active").default(1).notNull(),
  pendingApproval: integer("pendingApproval").default(0).notNull(),
  allowedProjects: json("allowedProjects").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastAccessAt: bigint("lastAccessAt", { mode: "number" }),
});

export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;

// Links de documentos entregues por ação
export const actionDocuments = pgTable("action_documents", {
  id: serial("id").primaryKey(),
  actionId: integer("actionId").notNull(),
  label: varchar("label", { length: 300 }).notNull(),
  url: text("url").notNull(),
  uploadedBy: integer("uploadedBy").notNull(),
  uploaderName: varchar("uploaderName", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  docStatus: varchar("docStatus", { length: 30 }),
  statusUpdatedAt: timestamp("statusUpdatedAt"),
  statusUpdatedBy: varchar("statusUpdatedBy", { length: 200 }),
});

export type ActionDocument = typeof actionDocuments.$inferSelect;
export type InsertActionDocument = typeof actionDocuments.$inferInsert;

// Múltiplos órgãos responsáveis pela entrega de um item de ação
export const actionOrgaos = pgTable("action_orgaos", {
  id: serial("id").primaryKey(),
  actionId: integer("actionId").notNull(),
  orgao: varchar("orgao", { length: 100 }).notNull(),
  responsavelNome: varchar("responsavelNome", { length: 200 }),
  responsavelCargo: varchar("responsavelCargo", { length: 200 }),
  responsavelTel: varchar("responsavelTel", { length: 50 }),
  responsavelEmail: varchar("responsavelEmail", { length: 320 }),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActionOrgao = typeof actionOrgaos.$inferSelect;
export type InsertActionOrgao = typeof actionOrgaos.$inferInsert;

// Órgãos permitidos para usuários setoriais
export const userOrgaos = pgTable("user_orgaos", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  orgao: varchar("orgao", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserOrgao = typeof userOrgaos.$inferSelect;
export type InsertUserOrgao = typeof userOrgaos.$inferInsert;

// Auditoria de acesso setorial
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  actionId: integer("actionId").notNull(),
  userId: integer("userId").notNull(),
  userName: varchar("userName", { length: 200 }).notNull(),
  userRole: varchar("userRole", { length: 50 }).notNull(),
  userOrgao: varchar("userOrgao", { length: 100 }),
  eventType: auditEventTypeEnum("eventType").notNull(),
  detail: text("detail"),
  project: projectEnum("project"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

// Notificações/Alertas do sistema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  body: text("body"),
  actionId: integer("actionId"),
  actionCode: varchar("actionCode", { length: 50 }),
  orgao: varchar("orgao", { length: 100 }),
  isRead: integer("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Tabela de responsáveis por órgão
export const orgaoResponsaveis = pgTable("orgao_responsaveis", {
  id: serial("id").primaryKey(),
  orgao: varchar("orgao", { length: 100 }).notNull(),
  nome: varchar("nome", { length: 200 }).notNull(),
  cargo: varchar("cargo", { length: 200 }),
  telefone: varchar("telefone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  localUserId: integer("localUserId"),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrgaoResponsavel = typeof orgaoResponsaveis.$inferSelect;
export type InsertOrgaoResponsavel = typeof orgaoResponsaveis.$inferInsert;

// Histórico de contatos enviados a responsáveis de itens
export const contactHistory = pgTable("contact_history", {
  id: serial("id").primaryKey(),
  actionId: integer("actionId").notNull(),
  channel: contactChannelEnum("channel").notNull(),
  recipientName: varchar("recipientName", { length: 200 }),
  recipientContact: varchar("recipientContact", { length: 320 }),
  message: text("message"),
  sentBy: varchar("sentBy", { length: 200 }),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type ContactHistory = typeof contactHistory.$inferSelect;
export type InsertContactHistory = typeof contactHistory.$inferInsert;
