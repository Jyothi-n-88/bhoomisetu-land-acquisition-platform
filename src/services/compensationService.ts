import { ParcelData } from './parcelService';
import { getHeaders, handleApiResponse } from './apiUtils';

export interface RfctlarrBreakdown {
  baseMarketRate: number;
  areaInAcres: number;
  baseLandValue: number;
  isRural: boolean;
  multiplierFactor: number;
  multipliedLandValue: number;
  assetsValue: number;
  subtotalBeforeSolatium: number;
  solatium: number;
  solatiumPercentage: number;
  additionalMarketValue: number;
  additionalMarketValuePercentage: number;
  yearsFromNotification: number;
  totalCompensationAward: number;
  legalReference: string;
}

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
  baseMarketRate?: number;
  areaInAcres?: number;
  isRural?: boolean;
  multiplierFactor?: number;
  assetsValue?: number;
  solatiumAmount?: number;
  additionalMarketValue?: number;
  calculationBreakdown?: RfctlarrBreakdown;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompensationSummary {
  totalAssessed: number;
  totalApproved: number;
  totalDisbursed: number;
  totalPending: number;
}

export const calculateAwardPreview = async (params: {
  baseMarketRate: number;
  areaInAcres?: number;
  isRural?: boolean;
  multiplierFactor?: number;
  assetsValue?: number;
  yearsFromNotification?: number;
  parcelId?: string;
}): Promise<{ success: boolean; breakdown: RfctlarrBreakdown }> => {
  const response = await fetch('/api/compensation/calculate-award', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
  });
  return handleApiResponse(response, 'Failed to calculate statutory compensation award');
};

export const createOrUpdateCompensation = async (data: Partial<CompensationData> & { calculateRfctlarr?: boolean }) => {
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
