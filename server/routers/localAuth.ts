import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import {
  createLocalUser,
  deleteLocalUser,
  getLocalUserById,
  getLocalUserByUsername,
  getLocalUsers,
  updateLocalUser,
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
  // 1. Try cookie first
  const cookie = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
  if (cookie) return cookie;
  // 2. Fallback: Authorization: Bearer <token>
  const authHeader = ctx.req.headers["authorization"];
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

// ---- Middleware: require local auth ----

const localAuthProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = extractToken(ctx);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para continuar." });
  const payload = await verifyLocalJwt(token);
  if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada. Faça login novamente." });
  const user = await getLocalUserById(payload.id);
  if (!user || !user.active) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário inativo ou não encontrado." });
  return next({ ctx: { ...ctx, localUser: user } });
});

const localAdminProcedure = localAuthProcedure.use(({ ctx, next }) => {
  if ((ctx as any).localUser.role !== "admin" && (ctx as any).localUser.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
  return next({ ctx });
});

const localSuperAdminProcedure = localAuthProcedure.use(({ ctx, next }) => {
  if ((ctx as any).localUser.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao super-administrador." });
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
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      position: user.position,
      organization: user.organization,
    };
  }),

  // ---- User management (super_admin only) ----
  users: router({
    list: localSuperAdminProcedure.query(async () => {
      return getLocalUsers();
    }),

    create: localSuperAdminProcedure
      .input(
        z.object({
          name: z.string().min(2).max(200),
          username: z.string().min(3).max(100).regex(/^[a-z0-9._-]+$/, "Use apenas letras minúsculas, números, ponto, hífen ou underscore"),
          password: z.string().min(6).max(100),
          role: z.enum(["admin", "viewer"]),
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
          role: input.role,
          position: input.position ?? null,
          organization: input.organization ?? null,
          active: 1,
        });
        return { success: true };
      }),

    update: localSuperAdminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(2).max(200).optional(),
          username: z.string().min(3).max(100).optional(),
          password: z.string().min(6).max(100).optional(),
          role: z.enum(["admin", "viewer"]).optional(),
          position: z.string().max(200).optional(),
          organization: z.string().max(200).optional(),
          active: z.number().min(0).max(1).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, password, ...rest } = input;
        const data: Record<string, unknown> = { ...rest };
        if (password) data.passwordHash = await bcrypt.hash(password, 12);
        if (rest.username) data.username = rest.username.toLowerCase();
        await updateLocalUser(id, data as any);
        return { success: true };
      }),

    delete: localSuperAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteLocalUser(input.id);
        return { success: true };
      }),
  }),
});

// Export helpers for use in other routers
export { localAuthProcedure, localAdminProcedure, localSuperAdminProcedure };
