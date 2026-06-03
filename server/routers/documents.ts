import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createActionDocument, deleteActionDocument, getDocumentsByActionId } from "../db";
import { localAdminProcedure, localAuthProcedure } from "./localAuth";
import { publicProcedure, router } from "../_core/trpc";

export const documentsRouter = router({
  // Anyone can list documents for an action
  list: publicProcedure
    .input(z.object({ actionId: z.number() }))
    .query(async ({ input }) => {
      return getDocumentsByActionId(input.actionId);
    }),

  // Admin or super_admin can add documents
  create: localAdminProcedure
    .input(
      z.object({
        actionId: z.number(),
        label: z.string().min(1).max(300),
        url: z.string().url("Informe uma URL válida (ex: https://...)"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const localUser = (ctx as any).localUser;
      await createActionDocument({
        actionId: input.actionId,
        label: input.label,
        url: input.url,
        uploadedBy: localUser.id,
        uploaderName: localUser.name,
      });
      return { success: true };
    }),

  // Admin or super_admin can delete documents
  delete: localAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteActionDocument(input.id);
      return { success: true };
    }),
});
