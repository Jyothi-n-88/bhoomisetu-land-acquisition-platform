import { useEffect } from 'react';

export const DATA_SYNC_EVENT = 'bhoomi:data-sync';

export interface DataSyncDetail {
  projectId?: string;
  parcelId?: string;
  type?: 'parcel_created' | 'parcel_updated' | 'parcel_deleted' | 'workflow_updated' | 'compensation_disbursed' | 'compensation_assessed' | 'project_updated' | string;
  [key: string]: any;
}

/**
 * Triggers a global data synchronization event across all mounted dashboard,
 * project overview, GIS, and financial summary components.
 */
export const triggerDataSync = (detail?: DataSyncDetail) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_SYNC_EVENT, { detail }));
  }
};

/**
 * React hook to listen for global data sync notifications and trigger re-fetching.
 * Also triggers on window re-focus so user returns to fresh metrics.
 */
export const useDataSync = (callback: (detail?: DataSyncDetail) => void) => {
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<DataSyncDetail>;
      callback(customEvent.detail);
    };

    const handleFocus = () => {
      callback({ type: 'window_focus' });
    };

    window.addEventListener(DATA_SYNC_EVENT, handleSync);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener(DATA_SYNC_EVENT, handleSync);
      window.removeEventListener('focus', handleFocus);
    };
  }, [callback]);
};
