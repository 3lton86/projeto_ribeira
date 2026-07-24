import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { PROJECTS, ProjectId, DEFAULT_PROJECT } from "../../../shared/const";
import { useLocalAuth } from "./LocalAuthContext";

type ProjectEntry = (typeof PROJECTS)[number];

interface ProjectContextValue {
  activeProject: ProjectId;
  setActiveProject: (id: ProjectId) => void;
  projectLabel: string;
  projectColor: string;
  availableProjects: ProjectEntry[];
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

const STORAGE_KEY = "ribeira_active_project";

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { localUser } = useLocalAuth();

  // Determine which projects this user can access
  // Admins/super_admins see all; others see only their allowedProjects (or all if empty/null)
  const isAdmin = localUser?.role === "admin" || localUser?.role === "super_admin";
  const userAllowedProjects = localUser?.allowedProjects ?? [];
  const availableProjects: ProjectEntry[] = isAdmin || userAllowedProjects.length === 0
    ? [...PROJECTS]
    : PROJECTS.filter(p => userAllowedProjects.includes(p.id));

  const [activeProject, setActiveProjectState] = useState<ProjectId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "ribeira" || stored === "sanea") return stored as ProjectId;
    } catch {}
    return DEFAULT_PROJECT;
  });

  // If the active project is not in the available list, reset to the first available
  useEffect(() => {
    if (availableProjects.length > 0 && !availableProjects.find(p => p.id === activeProject)) {
      setActiveProjectState(availableProjects[0].id);
      try { localStorage.setItem(STORAGE_KEY, availableProjects[0].id); } catch {}
    }
  }, [availableProjects, activeProject]);

  const setActiveProject = (id: ProjectId) => {
    setActiveProjectState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  };

  const projectMeta = PROJECTS.find(p => p.id === activeProject) ?? availableProjects[0] ?? PROJECTS[0];

  return (
    <ProjectContext.Provider
      value={{
        activeProject,
        setActiveProject,
        projectLabel: projectMeta.label,
        projectColor: projectMeta.color,
        availableProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
