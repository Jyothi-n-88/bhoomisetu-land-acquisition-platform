<<<<<<< HEAD
import React, { useEffect, useState, useCallback } from 'react';
=======
import React, { useEffect, useState } from 'react';
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
import Layout from '../components/Layout';
import { getProjects, ProjectData, createProject } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { 
  Plus, Briefcase, MapPin, Calendar, Activity, 
  Scale, IndianRupee, Layers, Landmark, Building2, 
  FileText, CheckCircle2, X, AlertCircle
} from 'lucide-react';
<<<<<<< HEAD
import { useDataSync, triggerDataSync } from '../utils/eventSync';
=======
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9

const STATUTORY_FRAMEWORKS = [
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

const SPONSORING_MINISTRIES = [
  'Ministry of Road Transport & Highways (MoRTH)',
  'Ministry of Railways',
  'Ministry of Power & Renewable Energy',
  'Ministry of Coal & Mines',
  'Ministry of Ports, Shipping and Waterways',
  'Ministry of Housing and Urban Affairs',
  'Ministry of Jal Shakti',
  'Ministry of Heavy Industries',
  'State Government / Dept. of Revenue',
  'Other Statutory Authority',
];

const PROJECT_TYPES = [
  'Expressway / National Highway',
  'Rail Corridor / High-Speed Freight',
  'Industrial Hub / Mega Food Park / SEZ',
  'Irrigation / Dam / Waterways',
  'Renewable Energy (Solar / Wind Park)',
  'Airport / Port Multi-Modal Hub',
  'Metro Rail / Urban Transit',
  'Mining / Coal Block',
  'Other Public Infrastructure',
];

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
    }
  }, [location.state]);
  
  const [newProject, setNewProject] = useState<Partial<ProjectData>>({
    projectId: '',
    projectCode: '',
    name: '',
    description: '',
    state: '',
    district: '',
    department: '',
    implementingAgency: '',
    sponsoringMinistry: 'Ministry of Road Transport & Highways (MoRTH)',
    statutoryFramework: 'RFCTLARR Act, 2013',
    currentStage: 'Proposal & Feasibility',
    totalProposedArea: undefined,
    sanctionedBudget: undefined,
    projectType: 'Expressway / National Highway',
    startDate: '',
    expectedCompletion: '',
  });

<<<<<<< HEAD
  const fetchProjects = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await getProjects();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (err: any) {
      if (isInitial) setError(err.message || 'Failed to load projects');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects(true);
  }, [fetchProjects]);

  useDataSync(fetchProjects);
=======
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
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9

  const canCreate = user?.role === 'CENTRAL_AUTHORITY' || user?.role === 'STATE_AUTHORITY';

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      const code = (newProject.projectCode || newProject.projectId || '').trim();
      const agency = (newProject.implementingAgency || newProject.department || '').trim();
      
      const payload: Partial<ProjectData> = {
        ...newProject,
        projectId: code,
        projectCode: code,
        department: agency,
        implementingAgency: agency,
        totalProposedArea: newProject.totalProposedArea ? Number(newProject.totalProposedArea) : undefined,
        estimatedLandRequirement: newProject.totalProposedArea ? Number(newProject.totalProposedArea) : undefined,
        sanctionedBudget: newProject.sanctionedBudget ? Number(newProject.sanctionedBudget) : undefined,
        startDate: newProject.startDate ? newProject.startDate : undefined,
        expectedCompletion: newProject.expectedCompletion ? newProject.expectedCompletion : undefined,
        expectedCompletionDate: newProject.expectedCompletion ? newProject.expectedCompletion : undefined,
      };

      await createProject(payload);
      setShowCreateModal(false);
<<<<<<< HEAD
      triggerDataSync({ type: 'project_created' });
      fetchProjects(false);
=======
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
      setNewProject({
        projectId: '',
        projectCode: '',
        name: '',
        description: '',
        state: '',
        district: '',
        department: '',
        implementingAgency: '',
        sponsoringMinistry: 'Ministry of Road Transport & Highways (MoRTH)',
        statutoryFramework: 'RFCTLARR Act, 2013',
        currentStage: 'Proposal & Feasibility',
        totalProposedArea: undefined,
        sanctionedBudget: undefined,
        projectType: 'Expressway / National Highway',
        startDate: '',
        expectedCompletion: '',
      });
      fetchProjects();
    } catch (err: any) {
      const rawMsg = err?.message || '';
      if (
        rawMsg.includes('Unexpected token') ||
        rawMsg.includes('<') ||
        rawMsg.includes('doctype') ||
        rawMsg.includes('HTML')
      ) {
        setCreateError(
          'Server routing or authentication error: Access forbidden or network routing failed. Please ensure you are logged in with Central or State authority privileges.'
        );
      } else {
        setCreateError(rawMsg || 'Server routing or authentication error');
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Planning': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Acquisition': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Compensation': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'R&R': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Possession': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Completed': return 'bg-teal-100 text-teal-700 border-teal-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <Layout>
      <div className="flex-grow w-full max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-emerald-600" />
              National Land Acquisition Projects
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              End-to-end statutory tracking, land gazette monitoring, and Direct Benefit Transfer across strategic corridors.
            </p>
          </div>
          
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
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
            {projects.map((project) => {
              const displayArea = project.totalProposedArea || project.estimatedLandRequirement;
              return (
                <Link 
                  key={project._id} 
                  to={`/projects/${project._id}`}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-500 hover:shadow-md transition-all group flex flex-col h-full cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2.5">
                    <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                      {project.projectCode || project.projectId}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getStatusColor(project.status)}`}>
                      {project.status || 'Planning'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {project.name}
                  </h3>

                  {project.statutoryFramework && (
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        <Scale className="w-3 h-3 text-emerald-600" />
                        {project.statutoryFramework}
                      </span>
                    </div>
                  )}

                  {project.currentStage && (
                    <div className="mb-3 bg-slate-50 border border-slate-100 rounded-md p-2">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Statutory Stage</div>
                      <div className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                        {project.currentStage}
                      </div>
                    </div>
                  )}

                  {(project.sanctionedBudget || displayArea) && (
                    <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50/70 border border-slate-100 rounded-lg mb-3">
                      {project.sanctionedBudget !== undefined && (
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Budget</div>
                          <div className="text-xs font-bold text-slate-800">
                            ₹{Number(project.sanctionedBudget).toLocaleString('en-IN')} Cr
                          </div>
                        </div>
                      )}
                      {displayArea !== undefined && (
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Proposed Area</div>
                          <div className="text-xs font-bold text-emerald-700">
                            {Number(displayArea).toLocaleString('en-IN')} Ha
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-auto pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{project.district}, {project.state}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{project.implementingAgency || project.department || 'Unassigned Agency'}</span>
                    </div>
                    {(project.startDate || project.expectedCompletion || project.expectedCompletionDate) && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {project.startDate 
                            ? new Date(project.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) 
                            : 'Start TBA'} 
                          {(project.expectedCompletion || project.expectedCompletionDate) && (
                            ` → ${new Date((project.expectedCompletion || project.expectedCompletionDate)!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  Create New Land Acquisition Project
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure national statutory framework, administrative jurisdiction, and scale parameters.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {createError && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-rose-800">Registration Error</div>
                  <div className="text-xs text-rose-700 mt-0.5 leading-relaxed">{createError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              
              {/* Section 1: Basic Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">1</div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Basic Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Project ID / Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newProject.projectCode || newProject.projectId || ''}
                      onChange={(e) => setNewProject({ 
                        ...newProject, 
                        projectCode: e.target.value,
                        projectId: e.target.value 
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
                      placeholder="e.g. NHAI-2026-DEL-MUM"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Project Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newProject.name || ''}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="e.g. Delhi-Mumbai Expressway Corridor Phase 3"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Description / Strategic Alignment
                    </label>
                    <textarea
                      rows={2}
                      value={newProject.description || ''}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                      placeholder="Comprehensive alignment description, public utility purpose, and key corridor nodes..."
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Jurisdiction & Implementing Bodies */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">2</div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Jurisdiction & Implementing Bodies</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newProject.state || ''}
                      onChange={(e) => setNewProject({ ...newProject, state: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="e.g. Maharashtra"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      District <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newProject.district || ''}
                      onChange={(e) => setNewProject({ ...newProject, district: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="e.g. Pune"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Implementing Agency / Department
                    </label>
                    <input
                      type="text"
                      value={newProject.implementingAgency || newProject.department || ''}
                      onChange={(e) => setNewProject({ 
                        ...newProject, 
                        implementingAgency: e.target.value,
                        department: e.target.value 
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="e.g. NHAI, Western Railway, CIDCO"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Sponsoring Ministry
                    </label>
                    <select
                      value={newProject.sponsoringMinistry || SPONSORING_MINISTRIES[0]}
                      onChange={(e) => setNewProject({ ...newProject, sponsoringMinistry: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                    >
                      {SPONSORING_MINISTRIES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Statutory Framework & Stage */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">3</div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Statutory Framework & Stage</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Statutory Framework
                    </label>
                    <select
                      value={newProject.statutoryFramework || STATUTORY_FRAMEWORKS[0]}
                      onChange={(e) => setNewProject({ ...newProject, statutoryFramework: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white font-medium"
                    >
                      {STATUTORY_FRAMEWORKS.map((act) => (
                        <option key={act} value={act}>{act}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">Governing notification, inquiry, and award determination law.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Current Statutory Stage
                    </label>
                    <select
                      value={newProject.currentStage || STATUTORY_STAGES[0]}
                      onChange={(e) => setNewProject({ ...newProject, currentStage: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white font-medium"
                    >
                      {STATUTORY_STAGES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">Active regulatory benchmark in the acquisition lifecycle.</p>
                  </div>
                </div>
              </div>

              {/* Section 4: Scale & Budget */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">4</div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Scale & Budget</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Total Proposed Area (in Hectares)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProject.totalProposedArea ?? ''}
                        onChange={(e) => setNewProject({ 
                          ...newProject, 
                          totalProposedArea: e.target.value ? parseFloat(e.target.value) : undefined 
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono pr-10"
                        placeholder="e.g. 145.50"
                      />
                      <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">Ha</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Sanctioned Budget (in ₹ Crores)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProject.sanctionedBudget ?? ''}
                        onChange={(e) => setNewProject({ 
                          ...newProject, 
                          sanctionedBudget: e.target.value ? parseFloat(e.target.value) : undefined 
                        })}
                        className="w-full pl-8 pr-12 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
                        placeholder="e.g. 2450.00"
                      />
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                      <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">Cr</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Project Type
                    </label>
                    <select
                      value={newProject.projectType || PROJECT_TYPES[0]}
                      onChange={(e) => setNewProject({ ...newProject, projectType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                    >
                      {PROJECT_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 5: Project Timeline */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">5</div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Project Timeline</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newProject.startDate || ''}
                      onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Notification, project kickoff, or commencement date.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Expected Completion
                    </label>
                    <input
                      type="date"
                      value={newProject.expectedCompletion || ''}
                      onChange={(e) => setNewProject({ ...newProject, expectedCompletion: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Target handover date for land acquisition and works.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {createLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registering Project...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
