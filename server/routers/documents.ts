import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createActionDocument,
  createAuditLog,
  deleteActionDocument,
  getActionById,
  getDocumentsByActionId,
  setorialUserHasOrgaoAccess,
} from "../db";
import { localAdminProcedure, localAuthProcedure } from "./localAuth";
import { publicProcedure, router } from "../_core/trpc";

export const documentsRouter = router({
  // Anyone can list documents for an action
  list: publicProcedure
    .input(z.object({ actionId: z.number() }))
    .query(async ({ input }) => {
      return getDocumentsByActionId(input.actionId);
    }),

  // Admin, super_admin OR setorial user (if action orgão is in their allowed list)
  create: localAuthProcedure
    .input(
      z.object({
        actionId: z.number(),
        label: z.string().min(1).max(300),
        url: z.string().url("Informe uma URL válida (ex: https://...)"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const localUser = (ctx as any).localUser;

      // Setorial users: check orgão access
      if (localUser.role === "setorial") {
        const action = await getActionById(input.actionId);
        if (!action) throw new TRPCError({ code: "NOT_FOUND", message: "Ação não encontrada." });
        const hasAccess = await setorialUserHasOrgaoAccess(localUser.id, action.orgao);
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Seu perfil setorial não tem acesso ao órgão responsável por esta ação.",
          });
        }
      } else if (localUser.role !== "admin" && localUser.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
      }

      await createActionDocument({
        actionId: input.actionId,
        label: input.label,
        url: input.url,
        uploadedBy: localUser.id,
        uploaderName: localUser.name,
      });
      // Audit log
      await createAuditLog({
        actionId: input.actionId,
        userId: localUser.id,
        userName: localUser.name,
        userRole: localUser.role,
        userOrgao: localUser.organization ?? null,
        eventType: "document",
        detail: `Documento incluído: "${input.label}" — ${input.url.slice(0, 100)}`,
      });
      return { success: true };
    }),

  // Only admin or super_admin can delete documents
  delete: localAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteActionDocument(input.id);
      return { success: true };
    }),
});
