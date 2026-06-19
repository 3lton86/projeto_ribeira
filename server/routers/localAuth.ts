import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import {
  createLocalUser,
  createNotification,
  deleteLocalUser,
  getAdminAndSuperAdminIds,
  getLocalUserById,
  getLocalUserByUsername,
  getLocalUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
  getUserOrgaos,
  updateLocalUser,
  upsertUserOrgaos,
} from "../db";
import { ENV } from "../_core/env";
import { publicProcedure, router } from "../_core/trpc";

const LOCAL_AUTH_COOKIE = "ribeira_local_session";
const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret || "ribeira-local-secret-2026");

// ---- JWT helpers ----

export async function signLocalJwt(payload: { id: number; username: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyLocalJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: number; username: string; role: string };
  } catch {
    return null;
  }
}

// ---- Helpers to extract token from cookie or Authorization header ----

function extractToken(ctx: { req: { cookies?: Record<string, string>; headers: Record<string, string | string[] | undefined> } }): string | null {
  const cookie = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
  if (cookie) return cookie;
  const authHeader = ctx.req.headers["authorization"];
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

// ---- Middleware: require local auth (any role) ----

const localAuthProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = extractToken(ctx);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para continuar." });
  const payload = await verifyLocalJwt(token);
  if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada. Faça login novamente." });
  const user = await getLocalUserById(payload.id);
  if (!user || !user.active) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário inativo ou não encontrado." });
  return next({ ctx: { ...ctx, localUser: user } });
});

// Admin or super_admin
const localAdminProcedure = localAuthProcedure.use(({ ctx, next }) => {
  const role = (ctx as any).localUser.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
  return next({ ctx });
});

// Super-admin only
const localSuperAdminProcedure = localAuthProcedure.use(({ ctx, next }) => {
  if ((ctx as any).localUser.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao super-administrador." });
  }
  return next({ ctx });
});

// Admin or super_admin (for user management — admins can create setorial users)
const localAdminOrSuperProcedure = localAuthProcedure.use(({ ctx, next }) => {
  const role = (ctx as any).localUser.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
  return next({ ctx });
});

// ---- Router ----

export const localAuthRouter = router({
  // Login with username + password
  login: publicProcedure
    .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const user = await getLocalUserByUsername(input.username.trim().toLowerCase());
      if (!user || !user.active) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha inválidos." });
      }
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha inválidos." });
      }
      const token = await signLocalJwt({ id: user.id, username: user.username, role: user.role });
      const isSecure = ctx.req.protocol === "https" || ctx.req.headers["x-forwarded-proto"] === "https";
      ctx.res.cookie(LOCAL_AUTH_COOKIE, token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: isSecure ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      // For setorial users, also return their allowed orgãos
      let allowedOrgaos: string[] = [];
      if (user.role === "setorial") {
        allowedOrgaos = await getUserOrgaos(user.id);
      }

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          position: user.position,
          organization: user.organization,
          allowedOrgaos,
        },
      };
    }),

  // Logout
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(LOCAL_AUTH_COOKIE, { path: "/" });
    return { success: true };
  }),

  // Get current local session
  me: publicProcedure.query(async ({ ctx }) => {
    const token = extractToken(ctx);
    if (!token) return null;
    const payload = await verifyLocalJwt(token);
    if (!payload) return null;
    const user = await getLocalUserById(payload.id);
    if (!user || !user.active) return null;

    let allowedOrgaos: string[] = [];
    if (user.role === "setorial") {
      allowedOrgaos = await getUserOrgaos(user.id);
    }

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      position: user.position,
      organization: user.organization,
      allowedOrgaos,
    };
  }),

  // ---- User management (admin and super_admin) ----
  users: router({
    list: localAdminOrSuperProcedure.query(async () => {
      const users = await getLocalUsers();
      // Enrich setorial users with their orgãos
      const enriched = await Promise.all(
        users.map(async (u) => {
          if (u.role === "setorial") {
            const orgaos = await getUserOrgaos(u.id);
            return { ...u, allowedOrgaos: orgaos };
          }
          return { ...u, allowedOrgaos: [] as string[] };
        })
      );
      return enriched;
    }),

    create: localAdminOrSuperProcedure
      .input(
        z.object({
          name: z.string().min(2).max(200),
          username: z.string().min(3).max(100),
          password: z.string().min(6).max(100),
          role: z.enum(["admin", "setorial", "viewer"]),
          position: z.string().max(200).optional(),
          organization: z.string().max(200).optional(),
          allowedOrgaos: z.array(z.string()).optional(), // for setorial users
        })
      )
      .mutation(async ({ input, ctx }) => {
        const callerRole = (ctx as any).localUser.role;
        // Only super_admin can create admin users
        if (input.role === "admin" && callerRole !== "super_admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o super-administrador pode criar administradores." });
        }
        const existing = await getLocalUserByUsername(input.username.toLowerCase());
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Nome de usuário já existe." });
        const passwordHash = await bcrypt.hash(input.password, 12);
        await createLocalUser({
          name: input.name,
          username: input.username.toLowerCase(),
          passwordHash,
          role: input.role,
          position: input.position ?? null,
          organization: input.organization ?? null,
          active: 1,
        });
        // Save orgãos for setorial users
        if (input.role === "setorial" && input.allowedOrgaos && input.allowedOrgaos.length > 0) {
          const newUser = await getLocalUserByUsername(input.username.toLowerCase());
          if (newUser) await upsertUserOrgaos(newUser.id, input.allowedOrgaos);
        }
        return { success: true };
      }),

    update: localAdminOrSuperProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(2).max(200).optional(),
          username: z.string().min(3).max(100).optional(),
          password: z.string().min(6).max(100).optional(),
          role: z.enum(["admin", "setorial", "viewer"]).optional(),
          position: z.string().max(200).optional(),
          organization: z.string().max(200).optional(),
          active: z.number().min(0).max(1).optional(),
          allowedOrgaos: z.array(z.string()).optional(), // for setorial users
        })
      )
      .mutation(async ({ input, ctx }) => {
        const callerRole = (ctx as any).localUser.role;
        // Only super_admin can promote/demote to admin
        if (input.role === "admin" && callerRole !== "super_admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o super-administrador pode promover a administrador." });
        }
        const { id, password, allowedOrgaos, ...rest } = input;
        const data: Record<string, unknown> = { ...rest };
        if (password) data.passwordHash = await bcrypt.hash(password, 12);
        if (rest.username) data.username = rest.username.toLowerCase();
        await updateLocalUser(id, data as any);
        // Update orgãos if provided (for setorial users)
        if (allowedOrgaos !== undefined) {
          await upsertUserOrgaos(id, allowedOrgaos);
        }
        return { success: true };
      }),

    delete: localAdminOrSuperProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const callerRole = (ctx as any).localUser.role;
        const target = await getLocalUserById(input.id);
        // Only super_admin can delete admin users
        if (target?.role === "admin" && callerRole !== "super_admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o super-administrador pode excluir administradores." });
        }
        await deleteLocalUser(input.id);
        return { success: true };
      }),

    // Get orgãos for a specific user
    getOrgaos: localAdminOrSuperProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return getUserOrgaos(input.userId);
      }),

    // List users pending approval (self-registered)
    listPending: localAdminOrSuperProcedure.query(async () => {
      return getPendingUsers();
    }),

    // Approve a self-registered user
    approve: localAdminOrSuperProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await approveUser(input.id);
        return { success: true };
      }),

    // Reject (delete) a self-registered user
    reject: localAdminOrSuperProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await rejectUser(input.id);
        return { success: true };
      }),
  }),

  // ---- Change password (any authenticated local user) ----
  changePassword: localAuthProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const localUser = (ctx as any).localUser;
      const user = await getLocalUserById(localUser.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado." });
      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "BAD_REQUEST", message: "Senha atual incorreta." });
      const newHash = await bcrypt.hash(input.newPassword, 12);
      await updateLocalUser(user.id, { passwordHash: newHash } as any);
      return { success: true };
    }),

  // ---- Public self-registration (requires admin approval) ----
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(200),
        username: z.string().min(3).max(100),
        password: z.string().min(6).max(100),
        position: z.string().max(200).optional(),
        organization: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await getLocalUserByUsername(input.username.toLowerCase());
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Nome de usuário já existe." });
      const passwordHash = await bcrypt.hash(input.password, 12);
      await createLocalUser({
        name: input.name,
        username: input.username.toLowerCase(),
        passwordHash,
        role: "viewer",
        position: input.position ?? null,
        organization: input.organization ?? null,
        active: 0,
        pendingApproval: 1,
      });
      // Notify all admins
      try {
        const adminIds = await getAdminAndSuperAdminIds();
        await Promise.all(
          adminIds.map((adminId) =>
            createNotification({
              userId: adminId,
              type: "item_change",
              title: "Novo cadastro pendente de aprovação",
              body: `O usuário '${input.name}' (${input.username}) solicitou acesso à plataforma e aguarda aprovação.`,
              actionId: null,
            })
          )
        );
      } catch { /* non-critical */ }
      return { success: true };
    }),
});

// Export helpers for use in other routers
export { localAuthProcedure, localAdminProcedure, localSuperAdminProcedure };
