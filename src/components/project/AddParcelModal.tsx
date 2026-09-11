import React, { useState } from 'react';
import {
  X,
  MapPin,
  IndianRupee,
  Layers,
  Building2,
  FileCode,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { ParcelData } from '../../services/parcelService';

interface AddParcelModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSubmit: (parcelData: Partial<ParcelData>) => Promise<void>;
  loading: boolean;
  error?: string;
}

export default function AddParcelModal({
  projectId,
  isOpen,
  onClose,
  onSubmit,
  loading,
  error: externalError,
}: AddParcelModalProps) {
  const [formData, setFormData] = useState({
    parcelId: '',
    surveyNumber: '',
    ownerName: '',
    ownerContact: '',
    area: '', // Area in Hectares
    compensationAmount: '', // In ₹
    disbursementStatus: 'Pending',
    possessionStatus: 'Notice Issued',
    landType: 'Agricultural',
    disputeStatus: 'None',
    geoJsonPolygon: '',
    has3DBuilding: false,
    affectedFloor: '',
  });

  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  // Sample corridor coordinate pairs for quick testing
  const handleInsertSamplePolygon = () => {
    const sample = JSON.stringify(
      [
        [18.52043, 73.85674],
        [18.52185, 73.85792],
        [18.52261, 73.85695],
        [18.52119, 73.85577],
        [18.52043, 73.85674],
      ],
      null,
      2
    );
    setFormData((prev) => ({ ...prev, geoJsonPolygon: sample }));
    setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validate GeoJSON Polygon textarea
    const polygonStr = formData.geoJsonPolygon.trim();
    if (!polygonStr) {
      setValidationError('GeoJSON Coordinates Polygon is required.');
      return;
    }

    try {
      const parsed = JSON.parse(polygonStr);
      if (!Array.isArray(parsed) || parsed.length < 3) {
        setValidationError(
          'GeoJSON Coordinates Polygon must be a valid JSON array of at least 3 coordinate pairs, e.g. [[lat, lng], [lat, lng], [lat, lng]]'
        );
        return;
      }
    } catch (err: any) {
      setValidationError(`Invalid JSON in GeoJSON Coordinates Polygon: ${err.message}`);
      return;
    }

    const payload: Partial<ParcelData> = {
      projectId,
      parcelId: formData.parcelId.trim(),
      surveyNumber: formData.surveyNumber.trim(),
      ownerName: formData.ownerName.trim(),
      ownerContact: formData.ownerContact.trim(),
      area: parseFloat(formData.area) || 0,
      compensationAmount: parseFloat(formData.compensationAmount) || 0,
      disbursementStatus: formData.disbursementStatus,
      possessionStatus: formData.possessionStatus,
      landType: formData.landType as any,
      disputeStatus: formData.disputeStatus,
      geoJsonPolygon: polygonStr,
      has3DBuilding: formData.has3DBuilding,
      affectedFloor: formData.affectedFloor,
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      // Error handled by parent or displayed via externalError
    }
  };

  // Helper check for valid JSON live preview
  let isJsonValid = false;
  try {
    if (formData.geoJsonPolygon.trim()) {
      const parsed = JSON.parse(formData.geoJsonPolygon.trim());
      isJsonValid = Array.isArray(parsed) && parsed.length >= 3;
    }
  } catch {
    isJsonValid = false;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add Land Parcel</h3>
              <p className="text-xs text-slate-500">
                Register statutory financial data & corridor polygon coordinates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {(validationError || externalError) && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{validationError || externalError}</span>
            </div>
          )}

          <form id="add-parcel-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Identification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parcel ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.parcelId}
                  onChange={(e) => setFormData({ ...formData, parcelId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  placeholder="e.g. NHAI-P-104"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Survey Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.surveyNumber}
                  onChange={(e) => setFormData({ ...formData, surveyNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. 142/3B"
                />
              </div>
            </div>

            {/* Row 2: Ownership */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Ramesh Chandra Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Contact (Optional)
                </label>
                <input
                  type="text"
                  value={formData.ownerContact}
                  onChange={(e) => setFormData({ ...formData, ownerContact: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>

            {/* Statutory Metrics & Financial Data */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Statutory Financial & Metric Data
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Area (Hectares) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Area (Hectares) *
                    </label>
                    <span className="text-[10px] text-slate-400">1 Ha ≈ 2.47 Acres</span>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono bg-white"
                    placeholder="e.g. 1.4500"
                  />
                </div>

                {/* Compensation Amount (₹) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Compensation Amount (₹) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={formData.compensationAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, compensationAmount: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono bg-white"
                      placeholder="e.g. 4500000"
                    />
                  </div>
                </div>

                {/* Disbursement Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Disbursement Status *
                  </label>
                  <select
                    value={formData.disbursementStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, disbursementStatus: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Disbursed">Disbursed</option>
                    <option value="Held in Escrow">Held in Escrow</option>
                  </select>
                </div>

                {/* Possession Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Possession Status *
                  </label>
                  <select
                    value={formData.possessionStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, possessionStatus: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="Notice Issued">Notice Issued</option>
                    <option value="Stayed/Litigation">Stayed/Litigation</option>
                    <option value="Possession Handover">Possession Handover</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Land Classification & Dispute Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Land Type *
                </label>
                <select
                  value={formData.landType}
                  onChange={(e) => setFormData({ ...formData, landType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="Agricultural">Agricultural</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Residential">Residential</option>
                  <option value="Forest">Forest</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Maps directly to 3D terrain & architectural building geometries
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispute Status *
                </label>
                <select
                  value={formData.disputeStatus}
                  onChange={(e) => setFormData({ ...formData, disputeStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="None">None</option>
                  <option value="Active Dispute">Active Dispute</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Parcels with active disputes are color-coded red on GIS
                </p>
              </div>
            </div>

            {/* GeoJSON Coordinates Polygon Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold text-slate-800">
                    GeoJSON Coordinates Polygon *
                  </label>
                  {isJsonValid ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Valid Coordinate Array
                    </span>
                  ) : formData.geoJsonPolygon.trim() ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      <AlertCircle className="w-3 h-3" /> Invalid JSON Format
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={handleInsertSamplePolygon}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Sample Polygon
                </button>
              </div>

              <textarea
                required
                rows={4}
                value={formData.geoJsonPolygon}
                onChange={(e) => setFormData({ ...formData, geoJsonPolygon: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                placeholder='[[18.5204, 73.8567], [18.5218, 73.8579], [18.5226, 73.8569], [18.5211, 73.8557], [18.5204, 73.8567]]'
              />
              <p className="text-[10px] text-slate-500 mt-1">
                JSON array of coordinate pairs (e.g., <code className="text-indigo-600 font-mono">[[lat, lng], [lat, lng]]</code>). Defines the 2D GIS polygon footprint and 3D terrain boundaries.
              </p>
            </div>

            {/* Optional 3D Building Floor Configuration */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="has3DBuilding"
                    checked={formData.has3DBuilding}
                    onChange={(e) =>
                      setFormData({ ...formData, has3DBuilding: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label
                    htmlFor="has3DBuilding"
                    className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    Multi-Story Building on Parcel?
                  </label>
                </div>

                {formData.has3DBuilding && (
                  <div className="w-1/2">
                    <input
                      type="text"
                      value={formData.affectedFloor}
                      onChange={(e) =>
                        setFormData({ ...formData, affectedFloor: e.target.value })
                      }
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. Floor 3 / Wing B"
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-parcel-form"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving Parcel...
              </>
            ) : (
              'Save Land Parcel'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
