import { getHeaders, handleApiResponse } from './apiUtils';

export interface ParcelData {
  _id?: string;
  parcelId: string;
  projectId: string;
  surveyNumber: string;
  ownerName: string;
  ownerContact?: string;
  area: number; // In Hectares
  compensationAmount?: number;
  disbursementStatus?: 'Pending' | 'Disbursed' | 'Held in Escrow' | string;
  landType: 'Agricultural' | 'Commercial' | 'Residential' | 'Forest' | 'Government' | 'Industrial';
  latitude?: number;
  longitude?: number;
  geometry?: {
    type: string;
    coordinates: any;
  };
  geoJsonPolygon?: string;
  polygonCoordinates?: string | number[][];
  acquisitionStatus?: 'PROPOSED' | 'SURVEYED' | 'UNDER_NOTIFICATION' | 'AWARD_PENDING' | 'COMPENSATION_PENDING' | 'COMPENSATION_PAID' | 'R_AND_R_PENDING' | 'POSSESSION_PENDING' | 'ACQUIRED' | 'COMPLETED' | string;
  compensationStatus?: 'PENDING' | 'ASSESSED' | 'APPROVED' | 'DISBURSED' | string;
  rnrStatus?: 'NOT_APPLICABLE' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | string;
  possessionStatus?: 'Notice Issued' | 'Stayed/Litigation' | 'Possession Handover' | 'PENDING' | 'TAKEN' | string;
  disputeStatus?: 'None' | 'Active Dispute' | 'NONE' | 'ACTIVE' | 'RESOLVED' | string;
  disputeDetails?: string;
  has3DBuilding?: boolean;
  affectedFloor?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getParcels = async (projectId?: string) => {
  const url = projectId ? `/api/parcels?projectId=${projectId}` : '/api/parcels';
  const response = await fetch(url, {
    headers: getHeaders(),
  });
  return handleApiResponse(response, 'Failed to fetch parcels');
};

export const getParcel = async (id: string) => {
  const response = await fetch(`/api/parcels/${id}`, {
    headers: getHeaders(),
  });
  return handleApiResponse(response, 'Failed to fetch parcel');
};

export const createParcel = async (parcelData: Partial<ParcelData>) => {
  const response = await fetch('/api/parcels', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(parcelData),
  });
  return handleApiResponse(response, 'Failed to create parcel');
};

export const updateParcel = async (id: string, parcelData: Partial<ParcelData>) => {
  const response = await fetch(`/api/parcels/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(parcelData),
  });
  return handleApiResponse(response, 'Failed to update parcel');
};

export const deleteParcel = async (id: string) => {
  const response = await fetch(`/api/parcels/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleApiResponse(response, 'Failed to delete parcel');
};

export const updateParcelWorkflow = async (id: string, acquisitionStatus: string) => {
  const response = await fetch(`/api/parcels/${id}/workflow`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ acquisitionStatus }),
  });
  return handleApiResponse(response, 'Failed to update parcel workflow');
};

export const getProjectGeoJSON = async (projectId: string) => {
  const response = await fetch(`/api/parcels/project/${projectId}/geojson`, {
    headers: getHeaders(),
  });
  return handleApiResponse(response, 'Failed to fetch project geojson');
};
