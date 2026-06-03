import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createComment,
  createHistory,
  getActionById,
  getActions,
  getDashboardStats,
  getExportData,
  getGovernanceNodes,
  getCommentsByActionId,
  getHistoryByActionId,
  updateAction,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
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

    update: localOrOauthAdminProcedure
      .input(
        z.object({
          id: z.number(),
          status: statusEnum.optional(),
          priority: priorityEnum.optional(),
          responsible: z.string().optional(),
          requestDate: z.date().optional(),
          receiptDate: z.date().optional(),
          documentBase: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { id, ...fields } = input;
        const current = await getActionById(id);
        if (!current) throw new TRPCError({ code: "NOT_FOUND" });

        const fieldLabels: Record<string, string> = {
          status: "Status",
          priority: "Prioridade",
          responsible: "Responsável",
          requestDate: "Data da Solicitação",
          receiptDate: "Data do Recebimento",
          documentBase: "Base Documental",
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
  }),

  // ---- COMMENTS ----
  comments: router({
    list: publicProcedure
      .input(z.object({ actionId: z.number() }))
      .query(async ({ input }) => {
        return getCommentsByActionId(input.actionId);
      }),

    create: localOrOauthAdminProcedure
      .input(z.object({ actionId: z.number(), content: z.string().min(1).max(2000) }))
      .mutation(async ({ input, ctx }) => {
        const localUser = (ctx as any).localUser;
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
        }).optional()
      )
      .query(async ({ input }) => {
        return getExportData(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
