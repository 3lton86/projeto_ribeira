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
  responsible: text("responsible"),
  requestDate: timestamp("requestDate"),
  receiptDate: timestamp("receiptDate"),
  documentBase: text("documentBase"),
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
