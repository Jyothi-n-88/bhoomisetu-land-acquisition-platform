import { ParcelData } from './parcelService';

export interface CompensationData {
  _id?: string;
  parcelId: string | ParcelData;
  projectId: string;
  assessedAmount: number;
  approvedAmount: number;
  disbursedAmount: number;
  paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'DISBURSED';
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

export const createOrUpdateCompensation = async (data: Partial<CompensationData>) => {
  const response = await fetch('/api/compensation', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create/update compensation');
  }
  return response.json();
};

export const getProjectCompensation = async (projectId: string) => {
  const response = await fetch(`/api/compensation/project/${projectId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch project compensation');
  }
  return response.json();
};

export const disburseCompensation = async (id: string, data: { disbursedAmount: number, bankReferenceNumber?: string }) => {
  const response = await fetch(`/api/compensation/${id}/disburse`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to disburse compensation');
  }
  return response.json();
};
