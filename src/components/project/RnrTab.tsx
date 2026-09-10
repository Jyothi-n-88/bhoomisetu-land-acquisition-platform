import React, { useState, useEffect } from 'react';
import { getProjectRnr, createOrUpdateRnr } from '../../services/rnrService';
import { ParcelData } from '../../services/parcelService';
import { Users, Home, CheckCircle } from 'lucide-react';

interface RnrTabProps {
  projectId: string;
  parcels: ParcelData[];
  onRefresh: () => void;
  canEdit: boolean;
}

export default function RnrTab({ projectId, parcels, onRefresh, canEdit }: RnrTabProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [rnrs, setRnrs] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedParcelId, setSelectedParcelId] = useState<string>('');
  const [form, setForm] = useState<any>({
    affectedFamiliesCount: 0,
    displacedFamiliesCount: 0,
    rnrRequired: false,
    rnrStatus: 'NOT_REQUIRED',
    resettlementSite: '',
    assistanceDetails: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRnr = async () => {
    try {
      setLoading(true);
      const data = await getProjectRnr(projectId);
      setSummary(data.summary);
      setRnrs(data.rnrs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRnr();
  }, [projectId]);

  const openModal = (parcelId: string, existingRecord: any) => {
    setSelectedParcelId(parcelId);
    if (existingRecord) {
      setForm({
        affectedFamiliesCount: existingRecord.affectedFamiliesCount || 0,
        displacedFamiliesCount: existingRecord.displacedFamiliesCount || 0,
        rnrRequired: existingRecord.rnrRequired || false,
        rnrStatus: existingRecord.rnrStatus || 'NOT_REQUIRED',
        resettlementSite: existingRecord.resettlementSite || '',
        assistanceDetails: existingRecord.assistanceDetails || ''
      });
    } else {
      setForm({
        affectedFamiliesCount: 0,
        displacedFamiliesCount: 0,
        rnrRequired: false,
        rnrStatus: 'NOT_REQUIRED',
        resettlementSite: '',
        assistanceDetails: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createOrUpdateRnr({ parcelId: selectedParcelId, projectId, ...form });
      setShowModal(false);
      fetchRnr();
      onRefresh();
    } catch (err) {
      alert('Failed to update R&R record');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-sm text-slate-500">Loading R&R data...</div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Affected</p>
          <p className="text-2xl font-light text-slate-900 flex items-center"><Users className="w-4 h-4 mr-2"/> {summary?.totalAffected || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Displaced</p>
          <p className="text-2xl font-light text-slate-900 flex items-center"><Home className="w-4 h-4 mr-2"/> {summary?.totalDisplaced || 0}</p>
        </div>
        <div className="bg-rose-50 p-5 rounded-xl border border-rose-200 shadow-sm">
          <p className="text-xs text-rose-700 font-medium mb-1">Pending Cases</p>
          <p className="text-2xl font-light text-rose-700">{summary?.pendingCases || 0}</p>
        </div>
        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 shadow-sm">
          <p className="text-xs text-emerald-700 font-medium mb-1">Completed Cases</p>
          <p className="text-2xl font-light text-emerald-700 flex items-center"><CheckCircle className="w-4 h-4 mr-2"/> {summary?.completedCases || 0}</p>
        </div>
      </div>

      {/* Parcel List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-900">R&R by Parcel</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <th className="px-6 py-4">Parcel ID</th>
                <th className="px-6 py-4">Affected</th>
                <th className="px-6 py-4">Displaced</th>
                <th className="px-6 py-4">Required</th>
                <th className="px-6 py-4">Status</th>
                {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {parcels.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                    <p className="text-sm font-medium text-slate-900 mb-1">No Parcels Available</p>
                    <p className="text-xs">Add land parcels to this project to manage R&R cases.</p>
                  </td>
                </tr>
              ) : (
                parcels.map((parcel) => {
                  const rnr = rnrs.find(r => r.parcelId._id === parcel._id);
                  return (
                    <tr key={parcel._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono">{parcel.parcelId}</td>
                      <td className="px-6 py-4">{rnr?.affectedFamiliesCount || 0}</td>
                      <td className="px-6 py-4">{rnr?.displacedFamiliesCount || 0}</td>
                      <td className="px-6 py-4">
                        {rnr?.rnrRequired ? <span className="text-rose-600 font-medium">Yes</span> : <span className="text-slate-500">No</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                          {rnr?.rnrStatus?.replace(/_/g, ' ') || 'NOT REQUIRED'}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openModal(parcel._id!, rnr)} className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-2 py-1 rounded bg-white">
                            Update R&R
                          </button>
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
          <div className="bg-white rounded-xl w-full max-w-md p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Update R&R Status
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox" id="rnrReq"
                  checked={form.rnrRequired}
                  onChange={(e) => setForm({ ...form, rnrRequired: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded"
                />
                <label htmlFor="rnrReq" className="text-sm font-medium text-slate-700">R&R Required for this Parcel</label>
              </div>

              {form.rnrRequired && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Affected Families</label>
                      <input
                        type="number"
                        value={form.affectedFamiliesCount}
                        onChange={(e) => setForm({ ...form, affectedFamiliesCount: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Displaced Families</label>
                      <input
                        type="number"
                        value={form.displacedFamiliesCount}
                        onChange={(e) => setForm({ ...form, displacedFamiliesCount: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                      value={form.rnrStatus}
                      onChange={(e) => setForm({ ...form, rnrStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="NOT_REQUIRED">Not Required</option>
                      <option value="IDENTIFIED">Identified</option>
                      <option value="PACKAGE_APPROVED">Package Approved</option>
                      <option value="RESETTLED">Resettled</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Resettlement Site</label>
                    <input
                      type="text"
                      value={form.resettlementSite}
                      onChange={(e) => setForm({ ...form, resettlementSite: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assistance Details</label>
                    <textarea
                      value={form.assistanceDetails}
                      onChange={(e) => setForm({ ...form, assistanceDetails: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      rows={2}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg">{actionLoading ? 'Saving...' : 'Save Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
