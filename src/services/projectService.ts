export interface ProjectData {
  _id?: string;
  projectId: string;
  name: string;
  description?: string;
  department?: string;
  state: string;
  district: string;
  projectType?: string;
  startDate?: string;
  expectedCompletionDate?: string;
  status?: 'Planning' | 'Acquisition' | 'Compensation' | 'R&R' | 'Possession' | 'Completed';
  estimatedLandRequirement?: number;
  acquiredLand?: number;
  assignedAuthorities?: any[];
  createdAt?: string;
  updatedAt?: string;
}

const getHeaders = () => {
  const token = localStorage.getItem('bhoomisetu_token');
  const headers: any = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const getProjects = async () => {
  const response = await fetch('/api/projects', {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch projects');
  }
  return response.json();
};

export const getProject = async (id: string) => {
  const response = await fetch(`/api/projects/${id}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch project');
  }
  return response.json();
};

export const createProject = async (projectData: Partial<ProjectData>) => {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(projectData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create project');
  }
  return response.json();
};

export const updateProject = async (id: string, projectData: Partial<ProjectData>) => {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(projectData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update project');
  }
  return response.json();
};

export const deleteProject = async (id: string) => {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete project');
  }
  return response.json();
};

export const getProjectBlockers = async (id: string) => {
  const response = await fetch(`/api/projects/${id}/blockers`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch project blockers');
  }
  return response.json();
};
