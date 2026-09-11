import React, { useState } from 'react';
import { ParcelData, updateParcelWorkflow } from '../../services/parcelService';
import { MapPin, AlertCircle, Plus, ChevronRight, Edit3, CheckCircle2 } from 'lucide-react';
import EditParcelModal from './EditParcelModal';
import { triggerDataSync } from '../../utils/eventSync';

interface ParcelsTabProps {
  parcels: ParcelData[];
  loadingParcels: boolean;
  onAddClick: () => void;
  canEdit: boolean;
  onRefresh: () => void;
}

export default function ParcelsTab({ parcels, loadingParcels, onAddClick, canEdit, onRefresh }: ParcelsTabProps) {
  const [editingParcel, setEditingParcel] = useState<ParcelData | null>(null);
  
  const handleStatusAdvance = async (id: string, currentStatus: string, projectId?: string) => {
    const workflowOrder = [
      'PROPOSED', 'SURVEYED', 'UNDER_NOTIFICATION', 'AWARD_PENDING', 
      'COMPENSATION_PENDING', 'COMPENSATION_PAID', 'R_AND_R_PENDING', 
      'POSSESSION_PENDING', 'ACQUIRED', 'COMPLETED'
    ];
    const currentIndex = workflowOrder.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < workflowOrder.length - 1) {
      const nextStatus = workflowOrder[currentIndex + 1];
      if (window.confirm(`Advance status to ${nextStatus}?`)) {
        try {
          await updateParcelWorkflow(id, nextStatus);
          triggerDataSync({ projectId, type: 'workflow_updated' });
          onRefresh();
        } catch (e) {
          alert('Failed to advance workflow');
        }
      }
    }
  };

  const getParcelStatusBadge = (status: string) => {
    switch(status) {
      case 'ACQUIRED':
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{status}</span>;
      case 'COMPENSATION_PAID':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">COMPENSATION PAID</span>;
      case 'COMPENSATION_PENDING':
      case 'AWARD_PENDING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{status}</span>;
      case 'PROPOSED':
      case 'SURVEYED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{status}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Land Parcels
          </h2>
          <p className="text-xs text-slate-500 mt-1">Manage survey numbers, ownership, compensation, and possession status.</p>
        </div>
        
        <button
          onClick={onAddClick}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Land Parcel
        </button>
      </div>
      
      <div className="overflow-x-auto">
        {loadingParcels ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading parcels...</div>
        ) : parcels.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-medium text-slate-900">No Land Parcels</h4>
            <p className="text-xs text-slate-500 mt-1">There are no land parcels registered for this project yet.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <th className="px-6 py-4">Parcel ID / Survey No</th>
                <th className="px-6 py-4">Owner & Land Type</th>
                <th className="px-6 py-4">Area (Hectares)</th>
                <th className="px-6 py-4">Compensation (₹)</th>
                <th className="px-6 py-4">Status & Possession</th>
                <th className="px-6 py-4">Dispute Status</th>
                {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {parcels.map((parcel) => (
                <tr key={parcel._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono font-medium text-slate-900">{parcel.parcelId}</div>
                    <div className="text-xs text-slate-500">Survey: {parcel.surveyNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{parcel.ownerName}</div>
                    <div className="text-xs text-slate-500">{parcel.landType}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-900">
                    <span className="font-semibold">{parcel.area}</span> <span className="text-xs text-slate-500">Ha</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono font-semibold text-slate-900">
                      ₹{(parcel.compensationAmount || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="mt-1">
                      {parcel.disbursementStatus === 'Disbursed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Disbursed
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {parcel.disbursementStatus || 'Pending'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getParcelStatusBadge(parcel.acquisitionStatus || 'PROPOSED')}
                    <div className="mt-1">
                      {parcel.possessionStatus === 'Possession Handover' ? (
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Handed Over
                        </span>
                      ) : parcel.possessionStatus === 'Stayed/Litigation' ? (
                        <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Stayed
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {parcel.possessionStatus || 'Notice Issued'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {parcel.disputeStatus === 'ACTIVE' || parcel.disputeStatus === 'Active Dispute' ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 w-fit">
                        <AlertCircle className="w-3 h-3" /> Active Dispute
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">{parcel.disputeStatus || 'None'}</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setEditingParcel(parcel)}
                          className="text-xs font-medium text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-md bg-white hover:bg-emerald-50 inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Edit Parcel Status, Possession, or Compensation"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        {parcel.acquisitionStatus !== 'COMPLETED' && (
                          <button 
                            onClick={() => handleStatusAdvance(parcel._id!, parcel.acquisitionStatus, parcel.projectId)}
                            className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-2 py-1 rounded-md bg-white inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Advance to next statutory stage"
                          >
                            Advance <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Parcel Modal */}
      {editingParcel && (
        <EditParcelModal
          parcel={editingParcel}
          isOpen={!!editingParcel}
          onClose={() => setEditingParcel(null)}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
