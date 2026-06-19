import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export type LocalUser = {
  id: number;
  name: string;
  username: string;
  role: "super_admin" | "admin" | "setorial" | "viewer";
  position: string | null;
  organization: string | null;
  allowedOrgaos?: string[]; // only populated for setorial users
};

const STORAGE_KEY = "ribeira_local_user";

function getCachedUser(): LocalUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalUser;
  } catch {
    return null;
  }
}

function setCachedUser(user: LocalUser | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

type LocalAuthContextType = {
  localUser: LocalUser | null;
  loading: boolean;
  refetch: () => void;
  setLocalUser: (user: LocalUser | null) => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSetorial: boolean;
  canEdit: boolean;
  /** For setorial users: check if they can interact with a given orgão */
  canInteractWithOrgao: (orgao: string | null | undefined) => boolean;
  /** For setorial users: check if they can interact with an action that has multiple co-responsible orgãos */
  canInteractWithAnyOrgao: (orgaos: string[]) => boolean;
};

const LocalAuthContext = createContext<LocalAuthContextType>({
  localUser: null,
  loading: true,
  refetch: () => {},
  setLocalUser: () => {},
  isAdmin: false,
  isSuperAdmin: false,
  isSetorial: false,
  canEdit: false,
  canInteractWithOrgao: () => false,
  canInteractWithAnyOrgao: () => false,
});

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const [localUser, setLocalUserState] = useState<LocalUser | null>(getCachedUser);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const { data, isLoading, refetch } = trpc.localAuth.me.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isLoading) {
      const serverUser = (data as LocalUser | null | undefined) ?? null;
      setLocalUserState(serverUser);
      setCachedUser(serverUser);
      setInitialCheckDone(true);
    }
  }, [isLoading, data]);

  const setLocalUser = (user: LocalUser | null) => {
    setLocalUserState(user);
    setCachedUser(user);
  };

  const isAdmin = localUser?.role === "admin" || localUser?.role === "super_admin";
  const isSuperAdmin = localUser?.role === "super_admin";
  const isSetorial = localUser?.role === "setorial";
  const canEdit = isAdmin;

  /**
   * For setorial users: returns true if the user has access to the given orgão.
   * Admins always return true. Viewers and unauthenticated always return false.
   */
  const canInteractWithOrgao = (orgao: string | null | undefined): boolean => {
    if (isAdmin) return true;
    if (!isSetorial || !localUser?.allowedOrgaos) return false;
    const allowed = localUser.allowedOrgaos;
    if (allowed.includes("TODOS")) return true;
    if (!orgao) return false;
    return allowed.includes(orgao);
  };

  /**
   * For setorial users: returns true if the user has access to ANY of the given orgãos.
   * Used when an action has multiple co-responsible orgãos (action_orgaos table).
   * Admins always return true. Viewers and unauthenticated always return false.
   */
  const canInteractWithAnyOrgao = (orgaos: string[]): boolean => {
    if (isAdmin) return true;
    if (!isSetorial || !localUser?.allowedOrgaos) return false;
    const allowed = localUser.allowedOrgaos;
    if (allowed.includes("TODOS")) return true;
    if (orgaos.length === 0) return false;
    return orgaos.some(o => allowed.includes(o));
  };

  const loading = isLoading && !initialCheckDone && !localUser;

  return (
    <LocalAuthContext.Provider
      value={{
        localUser,
        loading,
        refetch,
        setLocalUser,
        isAdmin,
        isSuperAdmin,
        isSetorial,
        canEdit,
        canInteractWithOrgao,
        canInteractWithAnyOrgao,
      }}
    >
      {children}
    </LocalAuthContext.Provider>
  );
}

export function useLocalAuth() {
  return useContext(LocalAuthContext);
}
