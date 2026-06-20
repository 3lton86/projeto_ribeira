import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Ações/Itens das 4 áreas temáticas
export const actions = mysqlTable("actions", {
  id: int("id").autoincrement().primaryKey(),
  area: mysqlEnum("area", ["Governança", "Técnico", "Jurídico", "Eco-Fin"]).notNull(),
  itemCode: varchar("itemCode", { length: 20 }).notNull(), // e.g. "1", "1.1", "2.3"
  parentCode: varchar("parentCode", { length: 20 }), // null for top-level groups
  isGroup: int("isGroup").default(0).notNull(), // 1 = group header, 0 = action item
  description: text("description").notNull(),
  priority: mysqlEnum("priority", ["Alta", "Média", "Baixa"]),
  status: mysqlEnum("status", ["Pendente", "Em Andamento", "Concluído", "Cancelado"])
    .default("Pendente")
    .notNull(),
  dueDate: timestamp("dueDate"),
  requestDate: timestamp("requestDate"),
  receiptDate: timestamp("receiptDate"),
  documentBase: text("documentBase"),
  observacoes: text("observacoes"), // campo de observações livres
  orgao: varchar("orgao", { length: 50 }), // órgão responsável pela entrega
  responsavelNome: varchar("responsavelNome", { length: 200 }),
  responsavelCargo: varchar("responsavelCargo", { length: 200 }),
  responsavelTel: varchar("responsavelTel", { length: 50 }),
  responsavelEmail: varchar("responsavelEmail", { length: 320 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Action = typeof actions.$inferSelect;
export type InsertAction = typeof actions.$inferInsert;

// Comentários por item
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  actionId: int("actionId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// Histórico de alterações por item
export const history = mysqlTable("history", {
  id: int("id").autoincrement().primaryKey(),
  actionId: int("actionId").notNull(),
  userId: int("userId").notNull(),
  fieldChanged: varchar("fieldChanged", { length: 100 }).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type History = typeof history.$inferSelect;
export type InsertHistory = typeof history.$inferInsert;

// Nós da estrutura de governança
export const governanceNodes = mysqlTable("governance_nodes", {
  id: int("id").autoincrement().primaryKey(),
  parentId: int("parentId"),
  title: varchar("title", { length: 200 }).notNull(),
  subtitle: text("subtitle"),
  type: mysqlEnum("type", ["root", "committee", "board", "focal", "entity"]).notNull(),
  theme: varchar("theme", { length: 50 }), // Técnico, Jurídico, Eco-Fin, Governança
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type GovernanceNode = typeof governanceNodes.$inferSelect;
export type InsertGovernanceNode = typeof governanceNodes.$inferInsert;

// Usuários locais do sistema (criados pelo super-admin, autenticam com nome+senha)
export const localUsers = mysqlTable("local_users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(), // login identifier
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["super_admin", "admin", "setorial", "viewer"]).default("viewer").notNull(),
  position: varchar("position", { length: 200 }), // cargo
  organization: varchar("organization", { length: 200 }), // órgão
    active: int("active").default(1).notNull(), // 1 = ativo, 0 = desativado
  pendingApproval: int("pendingApproval").default(0).notNull(), // 1 = aguardando aprovação do admin
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;

// Links de documentos entregues por ação
export const actionDocuments = mysqlTable("action_documents", {
  id: int("id").autoincrement().primaryKey(),
  actionId: int("actionId").notNull(),
  label: varchar("label", { length: 300 }).notNull(), // nome/descrição do documento
  url: text("url").notNull(), // link para o arquivo
  uploadedBy: int("uploadedBy").notNull(), // localUsers.id
  uploaderName: varchar("uploaderName", { length: 200 }), // snapshot do nome
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  docStatus: varchar("docStatus", { length: 30 }), // 'accepted' | 'pending' | null
  statusUpdatedAt: timestamp("statusUpdatedAt"),
  statusUpdatedBy: varchar("statusUpdatedBy", { length: 200 }), // snapshot do nome do admin
});
export type ActionDocument = typeof actionDocuments.$inferSelect;
export type InsertActionDocument = typeof actionDocuments.$inferInsert;

// Múltiplos órgãos responsáveis pela entrega de um item de ação
export const actionOrgaos = mysqlTable("action_orgaos", {
  id: int("id").autoincrement().primaryKey(),
  actionId: int("actionId").notNull(),
  orgao: varchar("orgao", { length: 100 }).notNull(),
  responsavelNome: varchar("responsavelNome", { length: 200 }),
  responsavelCargo: varchar("responsavelCargo", { length: 200 }),
  responsavelTel: varchar("responsavelTel", { length: 50 }),
  responsavelEmail: varchar("responsavelEmail", { length: 320 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ActionOrgao = typeof actionOrgaos.$inferSelect;
export type InsertActionOrgao = typeof actionOrgaos.$inferInsert;

// Órgãos permitidos para usuários setoriais
// Se não houver nenhuma linha para um usuário setorial, ele não acessa nada.
// O valor especial "TODOS" indica acesso irrestrito a todos os órgãos.
export const userOrgaos = mysqlTable("user_orgaos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),         // local_users.id
  orgao: varchar("orgao", { length: 100 }).notNull(), // nome do órgão ou "TODOS"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserOrgao = typeof userOrgaos.$inferSelect;
export type InsertUserOrgao = typeof userOrgaos.$inferInsert;

// Auditoria de acesso setorial — registra ações de usuários setoriais (comentários e documentos)
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  actionId: int("actionId").notNull(),           // ação relacionada
  userId: int("userId").notNull(),               // local_users.id
  userName: varchar("userName", { length: 200 }).notNull(), // snapshot do nome
  userRole: varchar("userRole", { length: 50 }).notNull(),  // snapshot do role
  userOrgao: varchar("userOrgao", { length: 100 }), // órgão do usuário no momento
  eventType: mysqlEnum("eventType", ["comment", "document"]).notNull(),
  detail: text("detail"),                        // descrição do evento
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

// Notificações/Alertas do sistema
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),               // local_users.id do destinatário
  type: mysqlEnum("type", ["item_change", "comment_doc"]).notNull(), // tipo de alerta
  title: varchar("title", { length: 300 }).notNull(),
  body: text("body"),                            // descrição detalhada
  actionId: int("actionId"),                     // ação relacionada (opcional)
  actionCode: varchar("actionCode", { length: 50 }), // código do item
  orgao: varchar("orgao", { length: 100 }),      // órgão do item (para filtro setorial)
  isRead: int("isRead").default(0).notNull(),    // 0 = não lido, 1 = lido
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Tabela de responsáveis por órgão (independente dos itens)
// Permite cadastrar múltiplos responsáveis por órgão, opcionalmente vinculados a um usuário local
export const orgaoResponsaveis = mysqlTable("orgao_responsaveis", {
  id: int("id").autoincrement().primaryKey(),
  orgao: varchar("orgao", { length: 100 }).notNull(),
  nome: varchar("nome", { length: 200 }).notNull(),
  cargo: varchar("cargo", { length: 200 }),
  telefone: varchar("telefone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  localUserId: int("localUserId"),  // nullable: vinculado a local_users.id se já cadastrado
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrgaoResponsavel = typeof orgaoResponsaveis.$inferSelect;
export type InsertOrgaoResponsavel = typeof orgaoResponsaveis.$inferInsert;
