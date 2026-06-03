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
  getUserByOpenId,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// Admin-only procedure: only users with role='admin' can execute
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
  return next({ ctx });
});

const areaEnum = z.enum(["Governança", "Técnico", "Jurídico", "Eco-Fin"]);
const statusEnum = z.enum(["Pendente", "Em Andamento", "Concluído", "Cancelado"]);
const priorityEnum = z.enum(["Alta", "Média", "Baixa"]);

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

    update: adminProcedure
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

        // Record history for each changed field
        for (const [key, newVal] of Object.entries(fields)) {
          if (newVal === undefined) continue;
          const oldVal = (current as any)[key];
          const oldStr = oldVal instanceof Date ? oldVal.toISOString() : String(oldVal ?? "");
          const newStr = newVal instanceof Date ? newVal.toISOString() : String(newVal ?? "");
          if (oldStr !== newStr) {
            await createHistory({
              actionId: id,
              userId: ctx.user.id,
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

    create: adminProcedure
      .input(z.object({ actionId: z.number(), content: z.string().min(1).max(2000) }))
      .mutation(async ({ input, ctx }) => {
        await createComment({
          actionId: input.actionId,
          userId: ctx.user.id,
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
