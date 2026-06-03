import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getActions: vi.fn().mockResolvedValue([
    {
      id: 1, area: "Técnico", itemCode: "1", parentCode: null, isGroup: 1,
      description: "Diagnóstico Territorial", priority: null, status: "Pendente",
      responsible: null, requestDate: null, receiptDate: null, documentBase: null,
      sortOrder: 10, createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 2, area: "Técnico", itemCode: "1.1", parentCode: "1", isGroup: 0,
      description: "Levantamento físico-funcional dos ativos", priority: "Alta", status: "Pendente",
      responsible: null, requestDate: null, receiptDate: null, documentBase: null,
      sortOrder: 11, createdAt: new Date(), updatedAt: new Date(),
    },
  ]),
  getActionById: vi.fn().mockResolvedValue({
    id: 2, area: "Técnico", itemCode: "1.1", parentCode: "1", isGroup: 0,
    description: "Levantamento físico-funcional dos ativos", priority: "Alta", status: "Pendente",
    responsible: null, requestDate: null, receiptDate: null, documentBase: null,
    sortOrder: 11, createdAt: new Date(), updatedAt: new Date(),
  }),
  updateAction: vi.fn().mockResolvedValue(undefined),
  createHistory: vi.fn().mockResolvedValue(undefined),
  createComment: vi.fn().mockResolvedValue(undefined),
  getCommentsByActionId: vi.fn().mockResolvedValue([
    {
      id: 1, actionId: 2, content: "Documento recebido via email",
      createdAt: new Date(), userId: 1, userName: "Admin User",
    },
  ]),
  getHistoryByActionId: vi.fn().mockResolvedValue([
    {
      id: 1, actionId: 2, fieldChanged: "Status", oldValue: "Pendente", newValue: "Em Andamento",
      createdAt: new Date(), userId: 1, userName: "Admin User",
    },
  ]),
  getGovernanceNodes: vi.fn().mockResolvedValue([
    { id: 1, parentId: null, title: "Consórcio Ribeira Sustentável", subtitle: "Estrutura de Governança", type: "root", theme: null, sortOrder: 0 },
    { id: 2, parentId: 1, title: "Comitê Executivo", subtitle: "Instância máxima", type: "committee", theme: null, sortOrder: 1 },
  ]),
  getDashboardStats: vi.fn().mockResolvedValue({
    total: 63,
    byStatus: { Pendente: 63, "Em Andamento": 0, Concluído: 0, Cancelado: 0 },
    byArea: [
      { area: "Governança", total: 5, Pendente: 5, "Em Andamento": 0, Concluído: 0, Cancelado: 0, completion: 0 },
      { area: "Técnico", total: 24, Pendente: 24, "Em Andamento": 0, Concluído: 0, Cancelado: 0, completion: 0 },
      { area: "Jurídico", total: 16, Pendente: 16, "Em Andamento": 0, Concluído: 0, Cancelado: 0, completion: 0 },
      { area: "Eco-Fin", total: 18, Pendente: 18, "Em Andamento": 0, Concluído: 0, Cancelado: 0, completion: 0 },
    ],
    byPriority: { Alta: 55, Média: 8, Baixa: 0 },
    completionRate: 0,
  }),
  getExportData: vi.fn().mockResolvedValue([]),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getLocalUserById: vi.fn().mockResolvedValue(null),
  getLocalUserByUsername: vi.fn().mockResolvedValue(null),
  getLocalUsers: vi.fn().mockResolvedValue([]),
  createLocalUser: vi.fn().mockResolvedValue(undefined),
  updateLocalUser: vi.fn().mockResolvedValue(undefined),
  deleteLocalUser: vi.fn().mockResolvedValue(undefined),
  getDocumentsByActionId: vi.fn().mockResolvedValue([]),
  createActionDocument: vi.fn().mockResolvedValue(undefined),
  deleteActionDocument: vi.fn().mockResolvedValue(undefined),
}));

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@ribeira.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("actions.list", () => {
  it("returns all actions for public users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.actions.list({});
    expect(result).toHaveLength(2);
    expect(result[0].area).toBe("Técnico");
  });

  it("includes both group headers and action items", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.actions.list({});
    const groups = result.filter((a) => a.isGroup === 1);
    const items = result.filter((a) => a.isGroup === 0);
    expect(groups).toHaveLength(1);
    expect(items).toHaveLength(1);
  });
});

describe("actions.getById", () => {
  it("returns action by id", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.actions.getById({ id: 2 });
    expect(result.id).toBe(2);
    expect(result.description).toContain("Levantamento");
  });
});

describe("actions.update", () => {
  it("requires authentication (unauthenticated user)", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.actions.update({ id: 2, status: "Em Andamento" })
    ).rejects.toThrow();
  });

  it("rejects non-admin authenticated user", async () => {
    const nonAdminCtx: TrpcContext = {
      user: {
        id: 2, openId: "regular-user", email: "user@ribeira.com",
        name: "Regular User", loginMethod: "manus", role: "user",
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(nonAdminCtx);
    await expect(
      caller.actions.update({ id: 2, status: "Em Andamento" })
    ).rejects.toThrow();
  });

  it("allows admin to update status", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.actions.update({ id: 2, status: "Em Andamento" });
    expect(result.success).toBe(true);
  });
});

describe("comments.list", () => {
  it("returns comments for an action", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.comments.list({ actionId: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Documento recebido via email");
    expect(result[0].userName).toBe("Admin User");
  });
});

describe("comments.create", () => {
  it("requires authentication to post comment", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.comments.create({ actionId: 2, content: "Comentário teste" })
    ).rejects.toThrow();
  });

  it("allows admin to post comment", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.comments.create({ actionId: 2, content: "Comentário de teste" });
    expect(result.success).toBe(true);
  });
});

describe("history.list", () => {
  it("returns history for an action", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.history.list({ actionId: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].fieldChanged).toBe("Status");
    expect(result[0].oldValue).toBe("Pendente");
    expect(result[0].newValue).toBe("Em Andamento");
  });
});

describe("dashboard.stats", () => {
  it("returns KPI statistics", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const stats = await caller.dashboard.stats();
    expect(stats).not.toBeNull();
    expect(stats!.total).toBe(63);
    expect(stats!.byArea).toHaveLength(4);
    expect(stats!.byArea.map((a) => a.area)).toEqual(["Governança", "Técnico", "Jurídico", "Eco-Fin"]);
  });
});

describe("governance.nodes", () => {
  it("returns governance structure nodes", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const nodes = await caller.governance.nodes();
    expect(nodes).toHaveLength(2);
    expect(nodes[0].type).toBe("root");
    expect(nodes[1].type).toBe("committee");
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("localAuth.me", () => {
  it("returns null when no local session cookie is present", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.localAuth.me();
    expect(result).toBeNull();
  });
});

describe("localAuth.login", () => {
  it("rejects invalid credentials (user not found)", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.localAuth.login({ username: "nonexistent.user.xyz", password: "wrongpassword" })
    ).rejects.toThrow();
  });
});

describe("documents.list", () => {
  it("returns empty array for action with no documents (public access)", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.documents.list({ actionId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});

describe("documents.create", () => {
  it("rejects document creation without authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.documents.create({ actionId: 1, label: "Test Doc", url: "https://example.com/doc.pdf" })
    ).rejects.toThrow();
  });
});
