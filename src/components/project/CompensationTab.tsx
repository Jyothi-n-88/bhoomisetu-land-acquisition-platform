import React, { useState, useEffect } from 'react';
import { getProjectCompensation, disburseCompensation, createOrUpdateCompensation } from '../../services/compensationService';
import { ParcelData } from '../../services/parcelService';
import { IndianRupee, FileCheck, Landmark, CheckCircle, Edit3 } from 'lucide-react';
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

  const openAssessModal = (parcelId: string, existingRecord: any) => {
    setSelectedParcelId(parcelId);
    setFormMode('ASSESS');
    if (existingRecord) {
      setAssessForm({ assessedAmount: existingRecord.assessedAmount || 0, approvedAmount: existingRecord.approvedAmount || 0 });
    } else {
      setAssessForm({ assessedAmount: 0, approvedAmount: 0 });
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
      await createOrUpdateCompensation({ parcelId: selectedParcelId, projectId, ...assessForm });
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
      const comp = compensations.find(c => c.parcelId._id === selectedParcelId);
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
          <p className="text-2xl font-light text-slate-900 flex items-center"><IndianRupee className="w-4 h-4 mr-1"/> {summary?.totalAssessed?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Approved</p>
          <p className="text-2xl font-light text-slate-900 flex items-center"><IndianRupee className="w-4 h-4 mr-1"/> {summary?.totalApproved?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Disbursed</p>
          <p className="text-2xl font-light text-emerald-600 flex items-center"><IndianRupee className="w-4 h-4 mr-1"/> {summary?.totalDisbursed?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 shadow-sm">
          <p className="text-xs text-amber-700 font-medium mb-1">Total Pending</p>
          <p className="text-2xl font-light text-amber-700 flex items-center"><IndianRupee className="w-4 h-4 mr-1"/> {summary?.totalPending?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Parcel List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-900">Compensation by Parcel</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <th className="px-6 py-4">Parcel ID</th>
                <th className="px-6 py-4">Assessed</th>
                <th className="px-6 py-4">Approved</th>
                <th className="px-6 py-4">Disbursed</th>
                <th className="px-6 py-4">Status</th>
                {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {parcels.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                    <p className="text-sm font-medium text-slate-900 mb-1">No Parcels Available</p>
                    <p className="text-xs">Add land parcels to this project to manage compensation.</p>
                  </td>
                </tr>
              ) : (
                parcels.map((parcel) => {
                  const comp = compensations.find(c => c.parcelId._id === parcel._id);
                  return (
                    <tr key={parcel._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono">{parcel.parcelId}</td>
                      <td className="px-6 py-4">₹{comp?.assessedAmount?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4">₹{comp?.approvedAmount?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-emerald-600">₹{comp?.disbursedAmount?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4">
                        {comp?.paymentStatus === 'DISBURSED' ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Disbursed</span>
                        ) : comp?.paymentStatus === 'PARTIALLY_PAID' ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Partial</span>
                        ) : comp?.paymentStatus === 'HELD_IN_ESCROW' ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">In Escrow</span>
                        ) : comp?.paymentStatus === 'APPROVED' ? (
                          <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">Approved</span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Pending</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => openAssessModal(parcel._id!, comp)} className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-2 py-1 rounded bg-white">
                            Assess
                          </button>
                          {comp?.approvedAmount > 0 && comp?.paymentStatus !== 'DISBURSED' && (
                            <button onClick={() => openDisburseModal(parcel._id!, comp)} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-200 px-2 py-1 rounded bg-emerald-50">
                              Disburse
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 border border-slate-200 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              {formMode === 'ASSESS' ? 'Assess Compensation' : 'Record Disbursement'}
            </h3>
            
            {formMode === 'ASSESS' ? (
              <form onSubmit={handleAssessSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assessed Amount (₹)</label>
                  <input
                    type="number" required
                    value={assessForm.assessedAmount || ''}
                    onChange={(e) => setAssessForm({ ...assessForm, assessedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Approved Amount (₹)</label>
                  <input
                    type="number" required
                    value={assessForm.approvedAmount || ''}
                    onChange={(e) => setAssessForm({ ...assessForm, approvedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button type="submit" disabled={actionLoading} className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg">{actionLoading ? 'Saving...' : 'Save Assessment'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleDisburseSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount to Disburse (₹)</label>
                  <input
                    type="number" required
                    value={disburseForm.disbursedAmount || ''}
                    onChange={(e) => setDisburseForm({ ...disburseForm, disbursedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bank Reference Number</label>
                  <input
                    type="text" required
                    value={disburseForm.bankReferenceNumber}
                    onChange={(e) => setDisburseForm({ ...disburseForm, bankReferenceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button type="submit" disabled={actionLoading} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{actionLoading ? 'Processing...' : 'Disburse Funds'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
