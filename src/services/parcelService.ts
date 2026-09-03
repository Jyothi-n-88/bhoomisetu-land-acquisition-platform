export interface ParcelData {
  _id?: string;
  parcelId: string;
  projectId: string;
  surveyNumber: string;
  ownerName: string;
  ownerContact?: string;
  area: number;
  landType: 'Agricultural' | 'Commercial' | 'Residential' | 'Forest' | 'Government' | 'Industrial';
  latitude: number;
  longitude: number;
  acquisitionStatus: 'PROPOSED' | 'SURVEYED' | 'UNDER_NOTIFICATION' | 'AWARD_PENDING' | 'COMPENSATION_PENDING' | 'COMPENSATION_PAID' | 'R_AND_R_PENDING' | 'POSSESSION_PENDING' | 'ACQUIRED' | 'COMPLETED';
  compensationStatus: 'PENDING' | 'ASSESSED' | 'APPROVED' | 'DISBURSED';
  rnrStatus: 'NOT_APPLICABLE' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  possessionStatus: 'PENDING' | 'TAKEN';
  disputeStatus: 'NONE' | 'ACTIVE' | 'RESOLVED';
  disputeDetails?: string;
  has3DBuilding?: boolean;
  affectedFloor?: string;
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

export const getParcels = async (projectId?: string) => {
  const url = projectId ? `/api/parcels?projectId=${projectId}` : '/api/parcels';
  const response = await fetch(url, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch parcels');
  }
  return response.json();
};

export const getParcel = async (id: string) => {
  const response = await fetch(`/api/parcels/${id}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch parcel');
  }
  return response.json();
};

export const createParcel = async (parcelData: Partial<ParcelData>) => {
  const response = await fetch('/api/parcels', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(parcelData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create parcel');
  }
  return response.json();
};

export const updateParcel = async (id: string, parcelData: Partial<ParcelData>) => {
  const response = await fetch(`/api/parcels/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(parcelData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update parcel');
  }
  return response.json();
};

export const deleteParcel = async (id: string) => {
  const response = await fetch(`/api/parcels/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete parcel');
  }
  return response.json();
};

export const updateParcelWorkflow = async (id: string, acquisitionStatus: string) => {
  const response = await fetch(`/api/parcels/${id}/workflow`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ acquisitionStatus }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update parcel workflow');
  }
  return response.json();
};

export const getProjectGeoJSON = async (projectId: string) => {
  const response = await fetch(`/api/parcels/project/${projectId}/geojson`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch project geojson');
  }
  return response.json();
};
