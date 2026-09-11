import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, IndianRupee, Layers, CheckCircle2, MapPin } from 'lucide-react';
import { ParcelData, updateParcel } from '../../services/parcelService';
import { triggerDataSync } from '../../utils/eventSync';

interface EditParcelModalProps {
  parcel: ParcelData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditParcelModal({ parcel, isOpen, onClose, onSuccess }: EditParcelModalProps) {
  const [formData, setFormData] = useState({
    surveyNumber: '',
    ownerName: '',
    ownerContact: '',
    area: '',
    compensationAmount: '',
    disbursementStatus: 'Pending',
    possessionStatus: 'Notice Issued',
    acquisitionStatus: 'PROPOSED',
    disputeStatus: 'None',
    disputeDetails: '',
    landType: 'Agricultural',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (parcel) {
      setFormData({
        surveyNumber: parcel.surveyNumber || '',
        ownerName: parcel.ownerName || '',
        ownerContact: parcel.ownerContact || '',
        area: String(parcel.area ?? ''),
        compensationAmount: String(parcel.compensationAmount ?? ''),
        disbursementStatus: parcel.disbursementStatus || 'Pending',
        possessionStatus: parcel.possessionStatus || 'Notice Issued',
        acquisitionStatus: parcel.acquisitionStatus || 'PROPOSED',
        disputeStatus: parcel.disputeStatus || 'None',
        disputeDetails: parcel.disputeDetails || '',
        landType: parcel.landType || 'Agricultural',
      });
      setError('');
    }
  }, [parcel]);

  if (!isOpen || !parcel) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const areaNum = parseFloat(formData.area);
    if (isNaN(areaNum) || areaNum <= 0) {
      setError('Please provide a valid land area in hectares.');
      return;
    }

    const compNum = formData.compensationAmount ? parseFloat(formData.compensationAmount) : 0;
    if (isNaN(compNum) || compNum < 0) {
      setError('Please provide a valid compensation amount.');
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<ParcelData> = {
        surveyNumber: formData.surveyNumber.trim(),
        ownerName: formData.ownerName.trim(),
        ownerContact: formData.ownerContact.trim(),
        area: areaNum,
        compensationAmount: compNum,
        disbursementStatus: formData.disbursementStatus,
        possessionStatus: formData.possessionStatus,
        acquisitionStatus: formData.acquisitionStatus,
        disputeStatus: formData.disputeStatus,
        disputeDetails: formData.disputeDetails.trim(),
        landType: formData.landType as any,
      };

      // Automatically sync acquisitionStatus if disbursed
      if (formData.disbursementStatus === 'Disbursed' && formData.acquisitionStatus === 'COMPENSATION_PENDING') {
        payload.acquisitionStatus = 'COMPENSATION_PAID';
      }

      await updateParcel(parcel._id!, payload);

      // Trigger global real-time synchronization
      triggerDataSync({
        projectId: parcel.projectId,
        parcelId: parcel.parcelId,
        type: 'parcel_updated',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update parcel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Update Parcel: <span className="font-mono text-emerald-700">{parcel.parcelId}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Survey: {parcel.surveyNumber} • Project ID: {parcel.projectId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Owner Name
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Survey Number
              </label>
              <input
                type="text"
                value={formData.surveyNumber}
                onChange={(e) => setFormData({ ...formData, surveyNumber: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Area (Hectares)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Compensation Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.compensationAmount}
                  onChange={(e) => setFormData({ ...formData, compensationAmount: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Disbursement Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Disbursement Status
              </label>
              <select
                value={formData.disbursementStatus}
                onChange={(e) => setFormData({ ...formData, disbursementStatus: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="Pending">Pending</option>
                <option value="Disbursed">Disbursed (Compensation Paid)</option>
                <option value="Held in Escrow">Held in Escrow</option>
              </select>
            </div>

            {/* Possession Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Possession Status
              </label>
              <select
                value={formData.possessionStatus}
                onChange={(e) => setFormData({ ...formData, possessionStatus: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="Notice Issued">Notice Issued</option>
                <option value="Possession Handover">Possession Handover (Acquired)</option>
                <option value="Stayed/Litigation">Stayed / Litigation</option>
              </select>
            </div>

            {/* Statutory Acquisition Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statutory Acquisition Stage
              </label>
              <select
                value={formData.acquisitionStatus}
                onChange={(e) => setFormData({ ...formData, acquisitionStatus: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="PROPOSED">1. PROPOSED</option>
                <option value="SURVEYED">2. SURVEYED</option>
                <option value="UNDER_NOTIFICATION">3. UNDER_NOTIFICATION</option>
                <option value="AWARD_PENDING">4. AWARD_PENDING</option>
                <option value="COMPENSATION_PENDING">5. COMPENSATION_PENDING</option>
                <option value="COMPENSATION_PAID">6. COMPENSATION_PAID</option>
                <option value="R_AND_R_PENDING">7. R_AND_R_PENDING</option>
                <option value="POSSESSION_PENDING">8. POSSESSION_PENDING</option>
                <option value="ACQUIRED">9. ACQUIRED</option>
                <option value="COMPLETED">10. COMPLETED</option>
              </select>
            </div>

            {/* Dispute Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispute Status
              </label>
              <select
                value={formData.disputeStatus}
                onChange={(e) => setFormData({ ...formData, disputeStatus: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="None">None (Clear Title)</option>
                <option value="Active Dispute">Active Legal Dispute</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {formData.disputeStatus === 'Active Dispute' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispute / Litigation Case Details
              </label>
              <input
                type="text"
                placeholder="e.g. High Court WP 412/2024 Title verification"
                value={formData.disputeDetails}
                onChange={(e) => setFormData({ ...formData, disputeDetails: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? 'Saving Changes...' : 'Save & Propagate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
