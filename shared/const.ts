export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

// Projetos disponíveis na plataforma
export const PROJECTS = [
  { id: "ribeira", label: "Ribeira PMI", color: "#1E4D8C", shortLabel: "Ribeira" },
  { id: "sanea", label: "SANEA+ NATAL", color: "#0e7c4a", shortLabel: "SANEA+" },
] as const;

export type ProjectId = "ribeira" | "sanea";
export const DEFAULT_PROJECT: ProjectId = "ribeira";
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
