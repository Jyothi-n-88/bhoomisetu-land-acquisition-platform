import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getProjects, ProjectData, createProject } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Briefcase, MapPin, Calendar, Activity } from 'lucide-react';

export default function Projects() {
  const { user } = useAuth();
  const location = useLocation();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (location.state?.action === 'create') {
      setShowCreateModal(true);
      // Clean up state so refresh doesn't trigger modal again if desired,
      // but simple is fine for now
    }
  }, [location.state]);
  
  const [newProject, setNewProject] = useState<Partial<ProjectData>>({
    projectId: '',
    name: '',
    state: '',
    district: '',
    department: '',
    projectType: '',
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data.projects);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const canCreate = user?.role === 'CENTRAL_AUTHORITY' || user?.role === 'STATE_AUTHORITY';

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      await createProject(newProject);
      setShowCreateModal(false);
      setNewProject({ projectId: '', name: '', state: '', district: '', department: '', projectType: '' });
      fetchProjects();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project');
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Planning': return 'bg-slate-100 text-slate-700';
      case 'Acquisition': return 'bg-blue-100 text-blue-700';
      case 'Compensation': return 'bg-amber-100 text-amber-700';
      case 'R&R': return 'bg-purple-100 text-purple-700';
      case 'Possession': return 'bg-emerald-100 text-emerald-700';
      case 'Completed': return 'bg-teal-100 text-teal-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Layout>
      <div className="flex-grow w-full max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-emerald-600" />
              Acquisition Projects
            </h2>
            <p className="text-sm text-slate-500 mt-1">Manage and track all national land acquisition projects.</p>
          </div>
          
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No Projects Found</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              There are currently no land acquisition projects in the system. 
              {canCreate && ' Create a new project to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link 
                key={project._id} 
                to={`/projects/${project._id}`}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-500 hover:shadow-md transition-all group flex flex-col h-full cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded">
                    {project.projectId}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {project.name}
                </h3>
                
                <div className="mt-auto pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{project.district}, {project.state}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Activity className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{project.department || 'Unassigned Dept.'}</span>
                  </div>
                  {project.startDate && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Create New Project
            </h3>
            
            {createError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project ID *</label>
                  <input
                    type="text"
                    required
                    value={newProject.projectId}
                    onChange={(e) => setNewProject({ ...newProject, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    placeholder="e.g. NHAI-2026-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Highway Expansion Phase 1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newProject.description || ''}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    placeholder="Brief description of the acquisition project..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newProject.state}
                    onChange={(e) => setNewProject({ ...newProject, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={newProject.district}
                    onChange={(e) => setNewProject({ ...newProject, district: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Pune"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newProject.department || ''}
                    onChange={(e) => setNewProject({ ...newProject, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. NHAI, Ministry of Railways"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project Type</label>
                  <input
                    type="text"
                    value={newProject.projectType || ''}
                    onChange={(e) => setNewProject({ ...newProject, projectType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Highway, Railway, Industrial"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {createLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
