import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { ProjectData, deleteProject } from '../../services/projectService';
import { triggerDataSync } from '../../utils/eventSync';

interface DeleteProjectModalProps {
  project: ProjectData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteProjectModal({ project, isOpen, onClose, onSuccess }: DeleteProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !project) return null;

  const targetId = project._id || project.projectId;

  const handleConfirmDelete = async () => {
    if (!targetId) return;
    setLoading(true);
    setError('');

    try {
      await deleteProject(targetId);

      // Trigger global synchronization so dashboard/project lists reflect the deletion immediately
      triggerDataSync({
        type: 'project_deleted',
        projectId: targetId,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to delete project. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/60">
          <div className="flex items-center gap-2.5 text-rose-700">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Confirm Deletion</h3>
              <p className="text-xs text-rose-600 font-medium">Irreversible Administrative Action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              Are you sure you want to delete this project and all its associated land parcels?
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action will permanently delete the project record, its cadastral boundaries, all registered land parcels, compensation logs, and rehabilitation records.
            </p>
          </div>

          {/* Project Summary Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {project.projectCode || project.projectId}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {project.district}, {project.state}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 line-clamp-2">
              {project.name}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={loading}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {loading ? 'Deleting Project & Parcels...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
