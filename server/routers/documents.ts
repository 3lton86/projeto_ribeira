import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createActionDocument,
  createAuditLog,
  createNotificationsForAdmins,
  deleteActionDocument,
  getActionById,
  getActionOrgaos,
  getAdminAndSuperAdminIds,
  getDocumentById,
  getDocumentsByActionId,
  getSetorialUserIdsForOrgao,
  setorialUserHasAccessToAction,
  updateAction,
  updateDocumentStatus,
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

      // Setorial users: check orgão access (legacy field + co-responsible orgãos)
      if (localUser.role === "setorial") {
        const action = await getActionById(input.actionId);
        if (!action) throw new TRPCError({ code: "NOT_FOUND", message: "Ação não encontrada." });
        const hasAccess = await setorialUserHasAccessToAction(localUser.id, input.actionId, action.orgao);
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

      // Auto-update status to "Em Andamento" if not already Concluído or Cancelado
      try {
        const actionForStatus = await getActionById(input.actionId);
        if (actionForStatus && actionForStatus.status !== "Concluído" && actionForStatus.status !== "Cancelado") {
          await updateAction(input.actionId, { status: "Em Andamento" });
        }
      } catch (_) {}

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

      // Disparar alertas: admins + setoriais de todos os órgãos do item
      try {
        const action = await getActionById(input.actionId);
        const adminIds = await getAdminAndSuperAdminIds();
        const itemOrgaos = await getActionOrgaos(input.actionId);
        const setorialIds: number[] = [];
        for (const o of itemOrgaos) {
          const ids = await getSetorialUserIdsForOrgao(o.orgao);
          setorialIds.push(...ids);
        }
        const combined = [...adminIds, ...setorialIds];
        const allIds = combined.filter((v, i, a) => a.indexOf(v) === i);
        const recipientIds = allIds.filter(id => id !== localUser.id);
        if (recipientIds.length > 0) {
          await createNotificationsForAdmins({
            type: "comment_doc",
            title: `Novo documento incluído`,
            body: `${localUser.name} incluíu o documento "${input.label}" no item ${action?.itemCode ?? ""}`,
            actionId: input.actionId,
            actionCode: action?.itemCode ?? null,
            orgao: null,
          }, recipientIds);
        }
      } catch (_) {}

      return { success: true };
    }),

  // Only admin or super_admin can delete documents
  delete: localAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteActionDocument(input.id);
      return { success: true };
    }),

  // Only admin or super_admin can update document status
  updateStatus: localAdminProcedure
    .input(
      z.object({
        id: z.number(),
        docStatus: z.enum(["accepted", "pending"]).nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const localUser = (ctx as any).localUser;
      await updateDocumentStatus(input.id, input.docStatus, localUser.name);

      // Auto-update action status to "Em Andamento" when doc receives "DOC COM PENDÊNCIA"
      if (input.docStatus === "pending") {
        try {
          const docForStatus = await getDocumentById(input.id);
          if (docForStatus) {
            const actionForStatus = await getActionById(docForStatus.actionId);
            if (actionForStatus && actionForStatus.status !== "Concluído" && actionForStatus.status !== "Cancelado") {
              await updateAction(docForStatus.actionId, { status: "Em Andamento" });
            }
          }
        } catch (_) {}
      }

      // Disparar notificação ao setorial quando doc recebe pendência
      if (input.docStatus === "pending") {
        try {
          const doc = await getDocumentById(input.id);
          if (doc) {
            const action = await getActionById(doc.actionId);
            if (action) {
              const itemOrgaos = await getActionOrgaos(doc.actionId);
              const setorialIds: number[] = [];
              for (const o of itemOrgaos) {
                const ids = await getSetorialUserIdsForOrgao(o.orgao);
                setorialIds.push(...ids);
              }
              const recipientIds = setorialIds.filter((v, i, a) => a.indexOf(v) === i).filter(id => id !== localUser.id);
              if (recipientIds.length > 0) {
                await createNotificationsForAdmins({
                  type: "comment_doc",
                  title: "Documento com pendência",
                  body: `O documento "${doc.label}" no item ${action.itemCode} foi marcado com pendência pelo administrador ${localUser.name}. Por favor, revise e reenvie.`,
                  actionId: action.id,
                  actionCode: action.itemCode ?? null,
                  orgao: null,
                }, recipientIds);
              }
            }
          }
        } catch (_) {}
      }

      return { success: true };
    }),
});
