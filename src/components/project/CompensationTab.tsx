import React, { useState, useEffect, useMemo } from 'react';
import {
  getProjectCompensation,
  disburseCompensation,
  createOrUpdateCompensation,
  calculateAwardPreview,
  RfctlarrBreakdown,
} from '../../services/compensationService';
import { ParcelData } from '../../services/parcelService';
import { IndianRupee, FileCheck, Landmark, CheckCircle, Edit3, Calculator, Scale, Info, ChevronRight, X } from 'lucide-react';
import { triggerDataSync } from '../../utils/eventSync';

interface CompensationTabProps {
  projectId: string;
  parcels: ParcelData[];
  onRefresh: () => void;
  canEdit: boolean;
}

export default function CompensationTab({ projectId, parcels, onRefresh, canEdit }: CompensationTabProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [compensations, setCompensations] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedParcelId, setSelectedParcelId] = useState<string>('');
  const [formMode, setFormMode] = useState<'ASSESS' | 'DISBURSE'>('ASSESS');
  
  const [assessForm, setAssessForm] = useState({ assessedAmount: 0, approvedAmount: 0 });
  const [disburseForm, setDisburseForm] = useState({ disbursedAmount: 0, bankReferenceNumber: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // RFCTLARR Statutory Calculator State
  const [useRfctlarrMode, setUseRfctlarrMode] = useState(true);
  const [rfctlarrInputs, setRfctlarrInputs] = useState({
    baseMarketRate: 1500000,
    areaInAcres: 1.0,
    isRural: true,
    multiplierFactor: 2.0,
    assetsValue: 0,
    yearsFromNotification: 1.0,
  });
  const [activeBreakdown, setActiveBreakdown] = useState<RfctlarrBreakdown | null>(null);
  const [inspectingBreakdown, setInspectingBreakdown] = useState<{ parcel: ParcelData; comp: any } | null>(null);

  const fetchCompensation = async () => {
    try {
      setLoading(true);
      const data = await getProjectCompensation(projectId);
      setSummary(data.summary);
      setCompensations(data.compensations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompensation();
  }, [projectId]);

  // Selected parcel lookup
  const currentParcel = useMemo(() => {
    return parcels.find((p) => p._id === selectedParcelId);
  }, [parcels, selectedParcelId]);

  // Compute live RFCTLARR preview
  useEffect(() => {
    if (useRfctlarrMode && formMode === 'ASSESS' && showModal) {
      const rate = Math.max(0, Number(rfctlarrInputs.baseMarketRate) || 0);
      const area = Math.max(0, Number(rfctlarrInputs.areaInAcres) || 0);
      const mult = rfctlarrInputs.isRural
        ? Math.min(2.0, Math.max(1.0, Number(rfctlarrInputs.multiplierFactor) || 2.0))
        : 1.0;
      const assets = Math.max(0, Number(rfctlarrInputs.assetsValue) || 0);
      const years = Math.max(0.1, Number(rfctlarrInputs.yearsFromNotification) || 1.0);

      const baseLand = Math.round(rate * area);
      const multipliedLand = Math.round(baseLand * mult);
      const subtotal = multipliedLand + assets;
      const solatium = Math.round(1.0 * subtotal);
      const additionalMarket = Math.round(0.12 * multipliedLand * years);
      const totalAward = subtotal + solatium + additionalMarket;

      const breakdown: RfctlarrBreakdown = {
        baseMarketRate: rate,
        areaInAcres: Number(area.toFixed(4)),
        baseLandValue: baseLand,
        isRural: rfctlarrInputs.isRural,
        multiplierFactor: mult,
        multipliedLandValue: multipliedLand,
        assetsValue: assets,
        subtotalBeforeSolatium: subtotal,
        solatium,
        solatiumPercentage: 100,
        additionalMarketValue: additionalMarket,
        additionalMarketValuePercentage: 12,
        yearsFromNotification: years,
        totalCompensationAward: totalAward,
        legalReference: 'RFCTLARR Act, 2013 (First Schedule, Sections 26, 29, 30(1), & 30(3))',
      };

      setActiveBreakdown(breakdown);
      setAssessForm({
        assessedAmount: totalAward,
        approvedAmount: totalAward,
      });
    }
  }, [rfctlarrInputs, useRfctlarrMode, formMode, showModal]);

  const openAssessModal = (parcelId: string, existingRecord: any) => {
    setSelectedParcelId(parcelId);
    setFormMode('ASSESS');
    const parcel = parcels.find((p) => p._id === parcelId);

    // Auto-calculate acres from hectares (1 Ha = ~2.471 Acres)
    const areaAcres = parcel?.area ? Number((Number(parcel.area) * 2.47105).toFixed(3)) : 1.0;
    const isRural = parcel ? ['Agricultural', 'Forest'].includes(parcel.landType || '') : true;

    if (existingRecord?.calculationBreakdown) {
      const cb = existingRecord.calculationBreakdown;
      setRfctlarrInputs({
        baseMarketRate: cb.baseMarketRate || 1500000,
        areaInAcres: cb.areaInAcres || areaAcres,
        isRural: cb.isRural ?? isRural,
        multiplierFactor: cb.multiplierFactor || (isRural ? 2.0 : 1.0),
        assetsValue: cb.assetsValue || 0,
        yearsFromNotification: cb.yearsFromNotification || 1.0,
      });
      setAssessForm({
        assessedAmount: existingRecord.assessedAmount || 0,
        approvedAmount: existingRecord.approvedAmount || 0,
      });
      setUseRfctlarrMode(true);
    } else if (existingRecord) {
      setAssessForm({
        assessedAmount: existingRecord.assessedAmount || 0,
        approvedAmount: existingRecord.approvedAmount || 0,
      });
      setRfctlarrInputs({
        baseMarketRate: 1500000,
        areaInAcres: areaAcres,
        isRural,
        multiplierFactor: isRural ? 2.0 : 1.0,
        assetsValue: 0,
        yearsFromNotification: 1.0,
      });
      setUseRfctlarrMode(false);
    } else {
      setRfctlarrInputs({
        baseMarketRate: 1500000,
        areaInAcres: areaAcres,
        isRural,
        multiplierFactor: isRural ? 2.0 : 1.0,
        assetsValue: 0,
        yearsFromNotification: 1.0,
      });
      setUseRfctlarrMode(true);
    }
    setShowModal(true);
  };

  const openDisburseModal = (parcelId: string, existingRecord: any) => {
    setSelectedParcelId(parcelId);
    setFormMode('DISBURSE');
    setDisburseForm({ disbursedAmount: 0, bankReferenceNumber: '' });
    setShowModal(true);
  };

  const handleAssessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload: any = {
        parcelId: selectedParcelId,
        projectId,
        assessedAmount: assessForm.assessedAmount,
        approvedAmount: assessForm.approvedAmount,
      };

      if (useRfctlarrMode) {
        payload.calculateRfctlarr = true;
        payload.baseMarketRate = rfctlarrInputs.baseMarketRate;
        payload.areaInAcres = rfctlarrInputs.areaInAcres;
        payload.isRural = rfctlarrInputs.isRural;
        payload.multiplierFactor = rfctlarrInputs.multiplierFactor;
        payload.assetsValue = rfctlarrInputs.assetsValue;
        payload.yearsFromNotification = rfctlarrInputs.yearsFromNotification;
      }

      await createOrUpdateCompensation(payload);
      setShowModal(false);
      triggerDataSync({ projectId, parcelId: selectedParcelId, type: 'compensation_assessed' });
      fetchCompensation();
      onRefresh();
    } catch (err) {
      alert('Failed to update assessment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const comp = compensations.find((c) => (c.parcelId?._id || c.parcelId) === selectedParcelId);
      if (comp) {
        await disburseCompensation(comp._id, disburseForm);
        setShowModal(false);
        triggerDataSync({ projectId, parcelId: selectedParcelId, type: 'compensation_disbursed' });
        fetchCompensation();
        onRefresh();
      }
    } catch (err) {
      alert('Failed to disburse');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-sm text-slate-500">Loading compensation data...</div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Assessed</p>
          <p className="text-2xl font-light text-slate-900 flex items-center">
            <IndianRupee className="w-4 h-4 mr-1" /> {summary?.totalAssessed?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Approved</p>
          <p className="text-2xl font-light text-slate-900 flex items-center">
            <IndianRupee className="w-4 h-4 mr-1" /> {summary?.totalApproved?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Disbursed</p>
          <p className="text-2xl font-light text-emerald-600 flex items-center">
            <IndianRupee className="w-4 h-4 mr-1" /> {summary?.totalDisbursed?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 shadow-sm">
          <p className="text-xs text-amber-700 font-medium mb-1">Total Pending</p>
          <p className="text-2xl font-light text-amber-700 flex items-center">
            <IndianRupee className="w-4 h-4 mr-1" /> {summary?.totalPending?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Parcel List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Compensation by Parcel</h3>
            <p className="text-xs text-slate-500 mt-0.5">Statutory First Schedule RFCTLARR Act (2013) determinations</p>
          </div>
          <div className="flex items-center text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <Scale className="w-3.5 h-3.5 mr-1" />
            <span>RFCTLARR 2013 Formula Enabled</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <th className="px-6 py-4">Parcel ID</th>
                <th className="px-6 py-4">Classification</th>
                <th className="px-6 py-4">Assessed</th>
                <th className="px-6 py-4">Approved</th>
                <th className="px-6 py-4">Disbursed</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {parcels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <p className="text-sm font-medium text-slate-900 mb-1">No Parcels Available</p>
                    <p className="text-xs">Add land parcels to this project to manage compensation.</p>
                  </td>
                </tr>
              ) : (
                parcels.map((parcel) => {
                  const comp = compensations.find(
                    (c) => (c.parcelId?._id || c.parcelId?.toString()) === parcel._id?.toString()
                  );
                  const hasBreakdown = Boolean(comp?.calculationBreakdown);

                  return (
                    <tr key={parcel._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        {parcel.parcelId}
                        <span className="block text-xs font-sans text-slate-500 font-normal">{parcel.ownerName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-700">{parcel.landType || 'Agricultural'}</span>
                        <span className="block text-xs text-slate-400">{parcel.area} Ha (~{(Number(parcel.area) * 2.471).toFixed(2)} Ac)</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span>₹{comp?.assessedAmount?.toLocaleString() || 0}</span>
                          {hasBreakdown && (
                            <button
                              type="button"
                              onClick={() => setInspectingBreakdown({ parcel, comp })}
                              className="text-indigo-600 hover:text-indigo-800 p-0.5 rounded hover:bg-indigo-50"
                              title="View RFCTLARR Statutory Award Breakdown"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">₹{comp?.approvedAmount?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-emerald-600 font-medium">
                        ₹{comp?.disbursedAmount?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4">
                        {comp?.paymentStatus === 'DISBURSED' ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                            Disbursed
                          </span>
                        ) : comp?.paymentStatus === 'PARTIALLY_PAID' ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Partial
                          </span>
                        ) : comp?.paymentStatus === 'HELD_IN_ESCROW' ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            In Escrow
                          </span>
                        ) : comp?.paymentStatus === 'APPROVED' ? (
                          <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {hasBreakdown && (
                          <button
                            onClick={() => setInspectingBreakdown({ parcel, comp })}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-2 py-1 rounded bg-indigo-50/50"
                          >
                            Breakdown
                          </button>
                        )}
                        {canEdit && (
                          <>
                            <button
                              onClick={() => openAssessModal(parcel._id!, comp)}
                              className="text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-300 px-2.5 py-1 rounded bg-white hover:bg-slate-50"
                            >
                              Assess
                            </button>
                            {comp?.approvedAmount > 0 && comp?.paymentStatus !== 'DISBURSED' && (
                              <button
                                onClick={() => openDisburseModal(parcel._id!, comp)}
                                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100"
                              >
                                Disburse
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assessment / Disbursement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-xl p-6 border border-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {formMode === 'ASSESS' ? 'Statutory Compensation Assessment' : 'Record Disbursement'}
                </h3>
                {currentParcel && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Parcel ID: <span className="font-mono font-medium">{currentParcel.parcelId}</span> • Owner:{' '}
                    {currentParcel.ownerName} • Extent: {currentParcel.area} Ha
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formMode === 'ASSESS' ? (
              <form onSubmit={handleAssessSubmit} className="space-y-4">
                {/* Toggle between Formula Engine vs Manual */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">RFCTLARR Act (2013) Formula Mode</p>
                      <p className="text-[11px] text-slate-500">
                        First Schedule automated computation (Multiplier, 100% Solatium, 12% Addl. Value)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseRfctlarrMode(!useRfctlarrMode)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                      useRfctlarrMode ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        useRfctlarrMode ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {useRfctlarrMode ? (
                  <div className="space-y-3 bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Base Market Rate (₹ / Acre)
                        </label>
                        <input
                          type="number"
                          required
                          value={rfctlarrInputs.baseMarketRate || ''}
                          onChange={(e) =>
                            setRfctlarrInputs({ ...rfctlarrInputs, baseMarketRate: Number(e.target.value) })
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Acquisition Extent (Acres)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          required
                          value={rfctlarrInputs.areaInAcres || ''}
                          onChange={(e) =>
                            setRfctlarrInputs({ ...rfctlarrInputs, areaInAcres: Number(e.target.value) })
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Land Classification</label>
                        <select
                          value={rfctlarrInputs.isRural ? 'rural' : 'urban'}
                          onChange={(e) =>
                            setRfctlarrInputs({
                              ...rfctlarrInputs,
                              isRural: e.target.value === 'rural',
                              multiplierFactor: e.target.value === 'rural' ? 2.0 : 1.0,
                            })
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                        >
                          <option value="rural">Rural (Multiplier Factor: 1.0 - 2.0x)</option>
                          <option value="urban">Urban (Multiplier Factor: 1.0x)</option>
                        </select>
                      </div>

                      {rfctlarrInputs.isRural && (
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Rural Multiplier Factor (1.0 to 2.0)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="1.0"
                            max="2.0"
                            value={rfctlarrInputs.multiplierFactor || 2.0}
                            onChange={(e) =>
                              setRfctlarrInputs({ ...rfctlarrInputs, multiplierFactor: Number(e.target.value) })
                            }
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Assets Attached (Trees/Structures ₹)
                        </label>
                        <input
                          type="number"
                          value={rfctlarrInputs.assetsValue || 0}
                          onChange={(e) =>
                            setRfctlarrInputs({ ...rfctlarrInputs, assetsValue: Number(e.target.value) })
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Years from Sec 3(A) Notification
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={rfctlarrInputs.yearsFromNotification || 1.0}
                          onChange={(e) =>
                            setRfctlarrInputs({
                              ...rfctlarrInputs,
                              yearsFromNotification: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                        />
                      </div>
                    </div>

                    {/* Realtime Statutory Formula Breakdown */}
                    {activeBreakdown && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-200 text-xs space-y-1.5">
                        <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1 flex justify-between">
                          <span>Statutory Award Breakdown</span>
                          <span className="text-emerald-700">RFCTLARR First Schedule</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Base Land Value (Rate × Extent):</span>
                          <span className="font-mono">₹{activeBreakdown.baseLandValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Multiplied Land Value ({activeBreakdown.multiplierFactor}×):</span>
                          <span className="font-mono">₹{activeBreakdown.multipliedLandValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Attached Assets (Section 29):</span>
                          <span className="font-mono">₹{activeBreakdown.assetsValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>100% Solatium (Section 30(1)):</span>
                          <span className="font-mono font-medium text-emerald-700">
                            +₹{activeBreakdown.solatium.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>12% Addl. Market Value (Section 30(3)):</span>
                          <span className="font-mono font-medium text-emerald-700">
                            +₹{activeBreakdown.additionalMarketValue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-200 text-sm">
                          <span>Total Statutory Award:</span>
                          <span className="font-mono text-emerald-700">
                            ₹{activeBreakdown.totalCompensationAward.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Assessed Amount (₹)</label>
                      <input
                        type="number"
                        required
                        value={assessForm.assessedAmount || ''}
                        onChange={(e) => setAssessForm({ ...assessForm, assessedAmount: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Approved Amount (₹)</label>
                      <input
                        type="number"
                        required
                        value={assessForm.approvedAmount || ''}
                        onChange={(e) => setAssessForm({ ...assessForm, approvedAmount: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                  >
                    {actionLoading ? 'Saving...' : 'Save Statutory Assessment'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleDisburseSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount to Disburse (₹)</label>
                  <input
                    type="number"
                    required
                    value={disburseForm.disbursedAmount || ''}
                    onChange={(e) => setDisburseForm({ ...disburseForm, disbursedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bank Reference Number</label>
                  <input
                    type="text"
                    required
                    value={disburseForm.bankReferenceNumber}
                    onChange={(e) => setDisburseForm({ ...disburseForm, bankReferenceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="e.g. UTR-2026-9988112"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    {actionLoading ? 'Processing...' : 'Disburse Funds'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Inspect RFCTLARR Breakdown Modal */}
      {inspectingBreakdown && inspectingBreakdown.comp?.calculationBreakdown && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">RFCTLARR First Schedule Statutory Award</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Parcel ID: {inspectingBreakdown.parcel.parcelId} • Owner: {inspectingBreakdown.parcel.ownerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingBreakdown(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const b: RfctlarrBreakdown = inspectingBreakdown.comp.calculationBreakdown;
              return (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-500 block">Base Market Rate:</span>
                      <span className="font-semibold text-slate-900 font-mono">₹{b.baseMarketRate?.toLocaleString()} / Acre</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Acquired Extent:</span>
                      <span className="font-semibold text-slate-900 font-mono">{b.areaInAcres} Acres</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Classification:</span>
                      <span className="font-semibold text-slate-900">{b.isRural ? 'Rural Area' : 'Urban Area'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Multiplier Factor:</span>
                      <span className="font-semibold text-slate-900 font-mono">{b.multiplierFactor}×</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                    <div className="flex justify-between p-2.5 bg-slate-50/50">
                      <span className="text-slate-600">1. Market Value of Land (Section 26):</span>
                      <span className="font-mono font-medium">₹{b.baseLandValue?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2.5">
                      <span className="text-slate-600">2. Multiplied Land Value ({b.multiplierFactor}×):</span>
                      <span className="font-mono font-medium">₹{b.multipliedLandValue?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-slate-50/50">
                      <span className="text-slate-600">3. Assets Attached to Land (Section 29):</span>
                      <span className="font-mono font-medium">₹{b.assetsValue?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-emerald-50/40">
                      <span className="text-emerald-900 font-medium">4. 100% Solatium Award (Section 30(1)):</span>
                      <span className="font-mono font-bold text-emerald-700">+₹{b.solatium?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-emerald-50/40">
                      <span className="text-emerald-900 font-medium">5. 12% Additional Market Value (Section 30(3)):</span>
                      <span className="font-mono font-bold text-emerald-700">+₹{b.additionalMarketValue?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-emerald-100/50 font-bold text-sm">
                      <span className="text-slate-900">Total Statutory Compensation Award:</span>
                      <span className="font-mono text-emerald-800">₹{b.totalCompensationAward?.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    {b.legalReference || 'RFCTLARR Act, 2013 (First Schedule, Sections 26, 29, 30(1), & 30(3))'}
                  </p>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setInspectingBreakdown(null)}
                      className="px-4 py-1.5 text-xs bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

