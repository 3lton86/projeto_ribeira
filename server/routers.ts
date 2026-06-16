import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createAction,
  createComment,
  createHistory,
  deleteAction,
  getActionById,
  getActions,
  getDashboardStats,
  getExportData,
  getGovernanceNodes,
  getCommentsByActionId,
  getHistoryByActionId,
  updateAction,
  updateGroupDescription,
  reorderActions,
  createSubItem,
  setorialUserHasOrgaoAccess,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { ORGAOS_MUNICIPAIS } from "@shared/orgaos";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { localAuthRouter, localAdminProcedure, localSuperAdminProcedure, verifyLocalJwt } from "./routers/localAuth";
import { documentsRouter } from "./routers/documents";
import { getLocalUserById } from "./db";

const LOCAL_AUTH_COOKIE = "ribeira_local_session";

const areaEnum = z.enum(["Governança", "Técnico", "Jurídico", "Eco-Fin"]);
const statusEnum = z.enum(["Pendente", "Em Andamento", "Concluído", "Cancelado"]);
const priorityEnum = z.enum(["Alta", "Média", "Baixa"]);

// Helper: extract JWT token from cookie or Authorization header
function extractLocalToken(ctx: { req: { cookies?: Record<string, string>; headers: Record<string, string | string[] | undefined> } }): string | null {
  const cookie = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
  if (cookie) return cookie;
  const authHeader = ctx.req.headers["authorization"];
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

// Middleware: resolve localUser from cookie or Authorization header (for procedures that accept both auth systems)
const localOrOauthAdminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  // Try local session first (cookie or Bearer header)
  const token = extractLocalToken(ctx);
  if (token) {
    const payload = await verifyLocalJwt(token);
    if (payload) {
      const localUser = await getLocalUserById(payload.id);
      if (localUser && localUser.active && (localUser.role === "admin" || localUser.role === "super_admin")) {
        return next({ ctx: { ...ctx, localUser } });
      }
    }
  }
  // Fall back to OAuth admin
  if (ctx.user && ctx.user.role === "admin") {
    return next({ ctx: { ...ctx, localUser: null } });
  }
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para continuar." });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ---- LOCAL AUTH ----
  localAuth: localAuthRouter,

  // ---- ACTIONS ----
  actions: router({
    list: publicProcedure
      .input(
        z.object({
          area: z.array(areaEnum).optional(),
          priority: z.array(priorityEnum).optional(),
          status: z.array(statusEnum).optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getActions(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const action = await getActionById(input.id);
        if (!action) throw new TRPCError({ code: "NOT_FOUND" });
        return action;
      }),

    create: localOrOauthAdminProcedure
      .input(
        z.object({
          area: areaEnum,
          description: z.string().min(3).max(2000),
          priority: priorityEnum.optional().default("Média"),
          status: statusEnum.optional().default("Pendente"),
          dueDate: z.date().nullable().optional(),
          requestDate: z.date().optional(),
          receiptDate: z.date().optional(),
          documentBase: z.string().optional(),
          orgao: z.enum([...ORGAOS_MUNICIPAIS, ""]).optional(),
          responsavelNome: z.string().optional(),
          responsavelCargo: z.string().optional(),
          responsavelTel: z.string().optional(),
          responsavelEmail: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const newId = await createAction({
          area: input.area,
          description: input.description,
          priority: input.priority,
          status: input.status,
          dueDate: input.dueDate ?? null,
          requestDate: input.requestDate,
          receiptDate: input.receiptDate,
          documentBase: input.documentBase,
          orgao: input.orgao,
          responsavelNome: input.responsavelNome,
          responsavelCargo: input.responsavelCargo,
          responsavelTel: input.responsavelTel,
          responsavelEmail: input.responsavelEmail,
        });
        return { success: true, id: newId };
      }),

    update: localOrOauthAdminProcedure
      .input(
        z.object({
          id: z.number(),
          status: statusEnum.optional(),
          priority: priorityEnum.optional(),
          dueDate: z.date().nullable().optional(),
          requestDate: z.date().optional(),
          receiptDate: z.date().optional(),
          documentBase: z.string().optional(),
          orgao: z.enum([...ORGAOS_MUNICIPAIS, ""]).optional(),
          responsavelNome: z.string().optional(),
          responsavelCargo: z.string().optional(),
          responsavelTel: z.string().optional(),
          responsavelEmail: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { id, ...fields } = input;
        const current = await getActionById(id);
        if (!current) throw new TRPCError({ code: "NOT_FOUND" });

        const fieldLabels: Record<string, string> = {
          status: "Status",
          priority: "Prioridade",
          dueDate: "Prazo Previsto",
          requestDate: "Data da Solicitação",
          receiptDate: "Data do Recebimento",
          documentBase: "Base Documental",
          orgao: "Órgão Responsável",
          responsavelNome: "Nome do Responsável",
          responsavelCargo: "Cargo do Responsável",
          responsavelTel: "Telefone do Responsável",
          responsavelEmail: "E-mail do Responsável",
        };

        // Determine userId for history: localUser or OAuth user
        const localUser = (ctx as any).localUser;
        const userId = localUser ? localUser.id : ctx.user!.id;
        // For history, we use a negative ID for local users to avoid collision with OAuth users
        const historyUserId = localUser ? -(localUser.id) : userId;

        for (const [key, newVal] of Object.entries(fields)) {
          if (newVal === undefined) continue;
          const oldVal = (current as any)[key];
          const oldStr = oldVal instanceof Date ? oldVal.toISOString() : String(oldVal ?? "");
          const newStr = newVal instanceof Date ? newVal.toISOString() : String(newVal ?? "");
          if (oldStr !== newStr) {
            await createHistory({
              actionId: id,
              userId: Math.abs(historyUserId),
              fieldChanged: fieldLabels[key] ?? key,
              oldValue: oldStr || null,
              newValue: newStr || null,
            });
          }
        }

        await updateAction(id, fields as any);
        return { success: true };
      }),

    delete: localOrOauthAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const existing = await getActionById(input.id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Ação não encontrada." });
        await deleteAction(input.id);
        return { success: true };
      }),

    editInline: localOrOauthAdminProcedure
      .input(
        z.object({
          id: z.number(),
          description: z.string().min(3).max(2000).optional(),
          area: areaEnum.optional(),
          status: statusEnum.optional(),
          priority: priorityEnum.optional(),
          dueDate: z.date().nullable().optional(),
          orgao: z.enum([...ORGAOS_MUNICIPAIS, ""]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { id, description, ...fields } = input;
        const current = await getActionById(id);
        if (!current) throw new TRPCError({ code: "NOT_FOUND" });

        const localUser = (ctx as any).localUser;
        const historyUserId = localUser ? localUser.id : ctx.user!.id;

        const fieldLabels: Record<string, string> = {
          description: "Descrição",
          area: "Frente Temática",
          status: "Status",
          priority: "Prioridade",
          dueDate: "Prazo Previsto",
          orgao: "Órgão Responsável",
        };

        const allFields: Record<string, any> = { ...fields };
        if (description !== undefined) allFields.description = description;

        for (const [key, newVal] of Object.entries(allFields)) {
          if (newVal === undefined) continue;
          const oldVal = (current as any)[key];
          const oldStr = oldVal instanceof Date ? oldVal.toISOString() : String(oldVal ?? "");
          const newStr = newVal instanceof Date ? newVal.toISOString() : String(newVal ?? "");
          if (oldStr !== newStr) {
            await createHistory({
              actionId: id,
              userId: Math.abs(historyUserId),
              fieldChanged: fieldLabels[key] ?? key,
              oldValue: oldStr || null,
              newValue: newStr || null,
            });
          }
        }

        // updateAction only accepts certain fields, handle description separately
        const updateFields: any = { ...fields };
        if (description !== undefined) {
          // description is not in updateAction's type, but we can pass it through
          updateFields.description = description;
        }
        await updateAction(id, updateFields);
        return { success: true };
      }),

    updateGroup: localOrOauthAdminProcedure
      .input(
        z.object({
          id: z.number(),
          description: z.string().min(3).max(500),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await getActionById(input.id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Grupo não encontrado." });
        if (existing.isGroup !== 1) throw new TRPCError({ code: "BAD_REQUEST", message: "Este item não é um cabeçalho de grupo." });

        const localUser = (ctx as any).localUser;
        const historyUserId = localUser ? localUser.id : ctx.user!.id;

        if (existing.description !== input.description) {
          await createHistory({
            actionId: input.id,
            userId: Math.abs(historyUserId),
            fieldChanged: "Descrição do Grupo",
            oldValue: existing.description,
            newValue: input.description,
          });
        }

        await updateGroupDescription(input.id, input.description);
        return { success: true };
      }),

    reorder: localOrOauthAdminProcedure
      .input(
        z.object({
          items: z.array(
            z.object({ id: z.number(), sortOrder: z.number() })
          ).min(1).max(500),
        })
      )
      .mutation(async ({ input }) => {
        await reorderActions(input.items);
        return { success: true };
      }),

    createSubItem: localOrOauthAdminProcedure
      .input(
        z.object({
          parentId: z.number(),
          parentCode: z.string().min(1),
          area: areaEnum,
          description: z.string().min(3).max(500),
          priority: priorityEnum.optional(),
          status: statusEnum.optional(),
          dueDate: z.date().optional().nullable(),
          orgao: z.string().optional(),
          responsavelNome: z.string().optional(),
          responsavelCargo: z.string().optional(),
          responsavelTel: z.string().optional(),
          responsavelEmail: z.string().email().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const newId = await createSubItem({
          area: input.area,
          parentId: input.parentId,
          parentCode: input.parentCode,
          description: input.description,
          priority: input.priority,
          status: input.status,
          dueDate: input.dueDate,
          orgao: input.orgao,
          responsavelNome: input.responsavelNome,
          responsavelCargo: input.responsavelCargo,
          responsavelTel: input.responsavelTel,
          responsavelEmail: input.responsavelEmail,
        });

        const localUser = (ctx as any).localUser;
        const historyUserId = localUser ? localUser.id : ctx.user!.id;
        await createHistory({
          actionId: newId,
          userId: Math.abs(historyUserId),
          fieldChanged: "Criação de Sub-item",
          oldValue: null,
          newValue: input.description,
        });

        return { success: true, id: newId };
      }),
  }),

  // ---- COMMENTS ----
  comments: router({
    list: publicProcedure
      .input(z.object({ actionId: z.number() }))
      .query(async ({ input }) => {
        return getCommentsByActionId(input.actionId);
      }),

    // Admin, super_admin, OAuth admin OR setorial user (if action orgão is in their allowed list)
    create: publicProcedure
      .use(async ({ ctx, next }) => {
        // Try local session first
        const token = ctx.req.cookies?.["ribeira_local_session"] ||
          (ctx.req.headers["authorization"] as string)?.replace("Bearer ", "");
        if (token) {
          const { verifyLocalJwt } = await import("./routers/localAuth");
          const payload = await verifyLocalJwt(token);
          if (payload) {
            const localUser = await getLocalUserById(payload.id);
            if (localUser && localUser.active) {
              return next({ ctx: { ...ctx, localUser } });
            }
          }
        }
        // Fall back to OAuth admin
        if (ctx.user && ctx.user.role === "admin") {
          return next({ ctx: { ...ctx, localUser: null } });
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para comentar." });
      })
      .input(z.object({ actionId: z.number(), content: z.string().min(1).max(2000) }))
      .mutation(async ({ input, ctx }) => {
        const localUser = (ctx as any).localUser;

        // Setorial users: check orgão access
        if (localUser && localUser.role === "setorial") {
          const action = await getActionById(input.actionId);
          if (!action) throw new TRPCError({ code: "NOT_FOUND", message: "Ação não encontrada." });
          const hasAccess = await setorialUserHasOrgaoAccess(localUser.id, action.orgao);
          if (!hasAccess) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Seu perfil setorial não tem acesso ao órgão responsável por esta ação.",
            });
          }
        } else if (localUser && localUser.role === "viewer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Visualizadores não podem comentar." });
        }

        const userId = localUser ? localUser.id : ctx.user!.id;
        await createComment({
          actionId: input.actionId,
          userId: Math.abs(userId),
          content: input.content,
        });
        return { success: true };
      }),
  }),

  // ---- HISTORY ----
  history: router({
    list: publicProcedure
      .input(z.object({ actionId: z.number() }))
      .query(async ({ input }) => {
        return getHistoryByActionId(input.actionId);
      }),
  }),

  // ---- GOVERNANCE ----
  governance: router({
    nodes: publicProcedure.query(async () => {
      return getGovernanceNodes();
    }),
  }),

  // ---- DASHBOARD ----
  dashboard: router({
    stats: publicProcedure.query(async () => {
      return getDashboardStats();
    }),
  }),

  // ---- DOCUMENTS ----
  documents: documentsRouter,

  // ---- EXPORT ----
  export: router({
    data: publicProcedure
      .input(
        z.object({
          area: z.array(areaEnum).optional(),
          priority: z.array(priorityEnum).optional(),
          status: z.array(statusEnum).optional(),
          orgao: z.array(z.string()).optional(),
          searchText: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getExportData(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
