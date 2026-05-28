import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Project, ToolItem } from '@/types';

export interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  tools: ToolItem[];
}

const initialState: ProjectState = {
  projects: [],
  selectedProject: null,
  tools: [],
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setProjects(state, action: PayloadAction<Project[]>) {
      state.projects = action.payload;
    },
    addProject(state, action: PayloadAction<Project>) {
      state.projects.unshift(action.payload);
      state.selectedProject = action.payload;
    },
    removeProject(state, action: PayloadAction<string>) {
      state.projects = state.projects.filter((project) => project.id !== action.payload);
      if (state.selectedProject?.id === action.payload) {
        state.selectedProject = null;
        state.tools = [];
      }
    },
    selectProject(state, action: PayloadAction<string>) {
      state.selectedProject = state.projects.find((project) => project.id === action.payload) ?? null;
      state.tools = state.selectedProject?.tools ?? [];
    },
    setTools(state, action: PayloadAction<ToolItem[]>) {
      state.tools = action.payload;
      if (state.selectedProject) {
        state.selectedProject.tools = action.payload;
      }
    },
    addToolToProject(state, action: PayloadAction<ToolItem>) {
      state.tools.unshift(action.payload);
      if (state.selectedProject) {
        state.selectedProject.tools = state.tools;
        state.selectedProject.totalTools = state.tools.length;
      }
    },
  },
});

export const {
  addProject,
  addToolToProject,
  removeProject,
  selectProject,
  setProjects,
  setTools,
} = projectSlice.actions;
export const projectReducer = projectSlice.reducer;
