import { ParcelData } from './parcelService';
import { getHeaders, handleApiResponse } from './apiUtils';

export interface CompensationData {
  _id?: string;
  parcelId: string | ParcelData;
  projectId: string;
  assessedAmount: number;
  approvedAmount: number;
  disbursedAmount: number;
  paymentStatus: 'PENDING' | 'APPROVED' | 'PARTIALLY_PAID' | 'DISBURSED' | 'HELD_IN_ESCROW';
  disbursementDate?: string;
  bankReferenceNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompensationSummary {
  totalAssessed: number;
  totalApproved: number;
  totalDisbursed: number;
  totalPending: number;
}

export const createOrUpdateCompensation = async (data: Partial<CompensationData>) => {
  const response = await fetch('/api/compensation', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleApiResponse(response, 'Failed to create/update compensation');
};

export const getProjectCompensation = async (projectId: string) => {
  const response = await fetch(`/api/compensation/project/${projectId}`, {
    headers: getHeaders(),
  });
  return handleApiResponse(response, 'Failed to fetch project compensation');
};

export const disburseCompensation = async (id: string, data: { disbursedAmount: number, bankReferenceNumber?: string }) => {
  const response = await fetch(`/api/compensation/${id}/disburse`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleApiResponse(response, 'Failed to disburse compensation');
};
