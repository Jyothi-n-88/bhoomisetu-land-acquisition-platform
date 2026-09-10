import { ParcelData } from './parcelService';
import { getHeaders, handleApiResponse } from './apiUtils';

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

export const createOrUpdateRnr = async (data: Partial<RnrData>) => {
  const response = await fetch('/api/rnr', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleApiResponse(response, 'Failed to create/update R&R record');
};

export const getProjectRnr = async (projectId: string) => {
  const response = await fetch(`/api/rnr/project/${projectId}`, {
    headers: getHeaders(),
  });
  return handleApiResponse(response, 'Failed to fetch project R&R');
};
