import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Building2, Scale, Layers, MapPin, CheckCircle2 } from 'lucide-react';
import { ProjectData, updateProject } from '../../services/projectService';
import { triggerDataSync } from '../../utils/eventSync';

export const STATUTORY_FRAMEWORKS = [
  'RFCTLARR Act, 2013',
  'National Highways Act, 1956',
  'Railways Act, 1989',
  'Coal Bearing Areas Act, 1957',
  'State Specific Land Acquisition Act',
];

export const STATUTORY_STAGES = [
  'Proposal & Feasibility',
  'Section 3(A) (Preliminary Notification)',
  'Joint Measurement Survey (JMS)',
  'Section 3(D) (Declaration & Acquisition)',
  'Section 3(G) (Award Inquiry)',
  'Compensation Disbursement (DBT)',
  'Section 3(E) (Possession Handover)',
  'Project Handed Over / Closed',
];

export const PROJECT_STATUSES: ('Planning' | 'Acquisition' | 'Compensation' | 'R&R' | 'Possession' | 'Completed')[] = [
  'Planning',
  'Acquisition',
  'Compensation',
  'R&R',
  'Possession',
  'Completed',
];

interface EditProjectModalProps {
  project: ProjectData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProjectModal({ project, isOpen, onClose, onSuccess }: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    projectCode: '',
    description: '',
    statutoryFramework: 'RFCTLARR Act, 2013',
    currentStage: 'Proposal & Feasibility',
    state: '',
    district: '',
    status: 'Planning' as ProjectData['status'],
    implementingAgency: '',
    sponsoringMinistry: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        projectCode: project.projectCode || project.projectId || '',
        description: project.description || '',
        statutoryFramework: project.statutoryFramework || STATUTORY_FRAMEWORKS[0],
        currentStage: project.currentStage || STATUTORY_STAGES[0],
        state: project.state || '',
        district: project.district || '',
        status: project.status || 'Planning',
        implementingAgency: project.implementingAgency || project.department || '',
        sponsoringMinistry: project.sponsoringMinistry || '',
      });
      setError('');
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Project name is required.');
      return;
    }
    if (!formData.state.trim()) {
      setError('State is required.');
      return;
    }
    if (!formData.district.trim()) {
      setError('District is required.');
      return;
    }

    setLoading(true);
    try {
      const targetId = project._id || project.projectId;
      const payload: Partial<ProjectData> = {
        name: formData.name.trim(),
        projectCode: formData.projectCode.trim() || undefined,
        description: formData.description.trim(),
        statutoryFramework: formData.statutoryFramework,
        currentStage: formData.currentStage,
        state: formData.state.trim(),
        district: formData.district.trim(),
        status: formData.status,
        implementingAgency: formData.implementingAgency.trim() || undefined,
        department: formData.implementingAgency.trim() || undefined,
        sponsoringMinistry: formData.sponsoringMinistry.trim() || undefined,
      };

      await updateProject(targetId, payload);

      // Trigger global synchronization so all dashboard/overview views stay updated
      triggerDataSync({
        projectId: targetId,
        type: 'project_updated',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update project details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Edit Project Details
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Code: <span className="font-mono font-medium text-emerald-700">{project.projectCode || project.projectId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Project Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              Project Identity
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Delhi-Mumbai Expressway Corridor Phase 3"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Code
                </label>
                <input
                  type="text"
                  value={formData.projectCode}
                  onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                  placeholder="e.g. NHAI-2026-DEL-MUM"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Purpose
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Comprehensive alignment description, purpose, and key corridor nodes..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none text-slate-800"
              />
            </div>
          </div>

          {/* Section: Statutory Act & Regulatory Stage */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              Statutory Framework & Acquisition Stage
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statutory Act / Law
                </label>
                <select
                  value={formData.statutoryFramework}
                  onChange={(e) => setFormData({ ...formData, statutoryFramework: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                >
                  {STATUTORY_FRAMEWORKS.map((act) => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Governing notification and land determination law.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statutory Stage
                </label>
                <select
                  value={formData.currentStage}
                  onChange={(e) => setFormData({ ...formData, currentStage: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                >
                  {STATUTORY_STAGES.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Current milestone in statutory land acquisition.</p>
              </div>
            </div>
          </div>

          {/* Section: Jurisdiction & Location */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Jurisdiction & Lifecycle
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="e.g. Pune"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lifecycle Status
                </label>
                <select
                  value={formData.status || 'Planning'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                >
                  {PROJECT_STATUSES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Implementing Agency / Department
                </label>
                <input
                  type="text"
                  value={formData.implementingAgency}
                  onChange={(e) => setFormData({ ...formData, implementingAgency: e.target.value })}
                  placeholder="e.g. NHAI / CIDCO / WR"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sponsoring Ministry
                </label>
                <input
                  type="text"
                  value={formData.sponsoringMinistry}
                  onChange={(e) => setFormData({ ...formData, sponsoringMinistry: e.target.value })}
                  placeholder="e.g. Ministry of Road Transport & Highways"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
