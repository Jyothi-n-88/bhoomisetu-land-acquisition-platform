import { getHeaders, handleApiResponse } from './apiUtils';

export interface ProjectData {
  _id?: string;
  projectId: string;
  projectCode?: string;
  name: string;
  description?: string;
  department?: string;
  implementingAgency?: string;
  sponsoringMinistry?: string;
  statutoryFramework?: string;
  currentStage?: string;
  totalProposedArea?: number;
  sanctionedBudget?: number;
  state: string;
  district: string;
  projectType?: string;
  startDate?: string;
  expectedCompletion?: string;
  expectedCompletionDate?: string;
  status?: 'Planning' | 'Acquisition' | 'Compensation' | 'R&R' | 'Possession' | 'Completed';
  estimatedLandRequirement?: number;
  acquiredLand?: number;
  assignedAuthorities?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export const getProjects = async () => {
  const response = await fetch('/api/projects', {
    headers: getHeaders(),
  });
  return handleApiResponse(response, 'Failed to fetch projects');
};

export const getProject = async (id: string) => {
  const response = await fetch(`/api/projects/${id}`, {
    headers: getHeaders(),
  });
  return handleApiResponse(response, 'Failed to fetch project');
};

export const createProject = async (projectData: Partial<ProjectData>) => {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(projectData),
  });
  return handleApiResponse(response, 'Failed to create project');
};

export const updateProject = async (id: string, projectData: Partial<ProjectData>) => {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(projectData),
  });
  return handleApiResponse(response, 'Failed to update project');
};

export const deleteProject = async (id: string) => {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleApiResponse(response, 'Failed to delete project');
};

export const getProjectBlockers = async (id: string) => {
  const response = await fetch(`/api/projects/${id}/blockers`, {
    headers: getHeaders(),
  });
  return handleApiResponse(response, 'Failed to fetch project blockers');
};

export const getDashboardMetrics = async () => {
  const response = await fetch('/api/projects/dashboard/metrics', {
    headers: getHeaders(),
  });
  return handleApiResponse(response, 'Failed to fetch dashboard metrics');
};
