import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Project, CreateProjectInput } from '@manuscry/shared';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    const res = await api.get<{ projects: Project[] }>('/api/projects');
    set({ projects: res.projects, loading: false });
  },

  fetchProject: async (id: string) => {
    set({ loading: true });
    const res = await api.get<{ project: Project }>(`/api/projects/${id}`);
    set({ currentProject: res.project, loading: false });
  },

  createProject: async (input: CreateProjectInput) => {
    const res = await api.post<{ project: Project }>('/api/projects', input);
    set((state) => ({ projects: [res.project, ...state.projects] }));
    return res.project;
  },

  updateProject: (id, data) => {
    set((state) => ({
      currentProject: state.currentProject?.id === id
        ? { ...state.currentProject, ...data }
        : state.currentProject,
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...data } : p,
      ),
    }));
  },
}));
