const API_URL = '/api/ai';

export interface AiInsights {
  executiveSummary: string;
  criticalRiskFactors: string[];
  recommendedActions: string[];
  metrics?: {
    totalParcels: number;
    acquiredParcels: number;
    unacquiredParcels: number;
    activeDisputes: number;
    clearedParcelIds: string[];
    unacquiredParcelIds: string[];
    disputedParcelIds: string[];
  };
}

export const analyzeProjectHealth = async (projectId: string, token: string): Promise<AiInsights> => {
  const response = await fetch(`${API_URL}/project/${projectId}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to analyze project health');
  }
  return data.data;
};

export const exportProjectReport = async (projectId: string, token: string): Promise<string> => {
  const response = await fetch(`${API_URL}/project/${projectId}/export-report`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to export report');
  }
  return data.report;
};
