import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export type LocalUser = {
  id: number;
  name: string;
  username: string;
  role: "super_admin" | "admin" | "viewer";
  position: string | null;
  organization: string | null;
};

type LocalAuthContextType = {
  localUser: LocalUser | null;
  loading: boolean;
  refetch: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canEdit: boolean;
};

const LocalAuthContext = createContext<LocalAuthContextType>({
  localUser: null,
  loading: true,
  refetch: () => {},
  isAdmin: false,
  isSuperAdmin: false,
  canEdit: false,
});

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = trpc.localAuth.me.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  const localUser = (data as LocalUser | null | undefined) ?? null;
  const isAdmin = localUser?.role === "admin" || localUser?.role === "super_admin";
  const isSuperAdmin = localUser?.role === "super_admin";
  const canEdit = isAdmin;

  return (
    <LocalAuthContext.Provider
      value={{
        localUser,
        loading: isLoading,
        refetch,
        isAdmin,
        isSuperAdmin,
        canEdit,
      }}
    >
      {children}
    </LocalAuthContext.Provider>
  );
}

export function useLocalAuth() {
  return useContext(LocalAuthContext);
}
