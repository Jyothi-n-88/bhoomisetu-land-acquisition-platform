import { ParcelData } from './parcelService';

export interface RnrData {
  _id?: string;
  parcelId: string | ParcelData;
  projectId: string;
  affectedFamiliesCount: number;
  displacedFamiliesCount: number;
  rnrRequired: boolean;
  rnrStatus: 'NOT_REQUIRED' | 'IDENTIFIED' | 'PACKAGE_APPROVED' | 'RESETTLED' | 'COMPLETED';
  resettlementSite?: string;
  assistanceDetails?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RnrSummary {
  totalAffected: number;
  totalDisplaced: number;
  pendingCases: number;
  completedCases: number;
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

export const createOrUpdateRnr = async (data: Partial<RnrData>) => {
  const response = await fetch('/api/rnr', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create/update R&R record');
  }
  return response.json();
};

export const getProjectRnr = async (projectId: string) => {
  const response = await fetch(`/api/rnr/project/${projectId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch project R&R');
  }
  return response.json();
};
