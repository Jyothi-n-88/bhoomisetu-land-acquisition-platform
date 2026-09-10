import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { getProject, deleteProject, ProjectData, getProjectBlockers } from '../services/projectService';
import { getParcels, createParcel, ParcelData } from '../services/parcelService';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, MapPin, Calendar, Activity, ArrowLeft, Trash2, Edit3, 
  Plus, AlertCircle, LayoutDashboard, FileText, IndianRupee, Home, 
  Map as MapIcon, Scale, Layers, Landmark, CheckCircle2, ChevronRight, Clock,
  Building2
} from 'lucide-react';
import BlockerSummary from '../components/project/BlockerSummary';
import CompensationTab from '../components/project/CompensationTab';
import RnrTab from '../components/project/RnrTab';
import ParcelsTab from '../components/project/ParcelsTab';
import GisTab from '../components/project/GisTab';
import AiInsightsTab from '../components/project/AiInsightsTab';
import AddParcelModal from '../components/project/AddParcelModal';

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

export interface StatutoryStepItem {
  stage: string;
  primary: string;
  secondary: string;
}

export const STATUTORY_STEPS: StatutoryStepItem[] = [
  {
    stage: 'Proposal & Feasibility',
    primary: 'Proposal & Feasibility',
    secondary: 'Project Formulation',
  },
  {
    stage: 'Section 3(A) (Preliminary Notification)',
    primary: 'Section 3(A)',
    secondary: '(Preliminary Notification)',
  },
  {
    stage: 'Joint Measurement Survey (JMS)',
    primary: 'Joint Survey (JMS)',
    secondary: 'Cadastral Ground Truth',
  },
  {
    stage: 'Section 3(D) (Declaration & Acquisition)',
    primary: 'Section 3(D)',
    secondary: '(Declaration & Acquisition)',
  },
  {
    stage: 'Section 3(G) (Award Inquiry)',
    primary: 'Section 3(G)',
    secondary: '(Award Inquiry)',
  },
  {
    stage: 'Compensation Disbursement (DBT)',
    primary: 'Compensation (DBT)',
    secondary: 'Direct Benefit Transfer',
  },
  {
    stage: 'Section 3(E) (Possession Handover)',
    primary: 'Section 3(E)',
    secondary: '(Possession Handover)',
  },
  {
    stage: 'Project Handed Over / Closed',
    primary: 'Handed Over',
    secondary: 'Project Closed',
  },
];

export const calculateActiveStageIndex = (currentStage?: string, projectStatus?: string): number => {
  if (!currentStage) {
    if (projectStatus === 'Completed') return 7;
    if (projectStatus === 'Possession') return 6;
    if (projectStatus === 'Compensation') return 5;
    if (projectStatus === 'Acquisition') return 3;
    return 0;
  }

  const raw = currentStage.trim();
  const lower = raw.toLowerCase();

  // 1. Direct exact match
  const exactIdx = STATUTORY_STAGES.findIndex(s => s.toLowerCase() === lower);
  if (exactIdx !== -1) return exactIdx;

  // 2. Normalized alphanumeric match
  const clean = (s: string) => s.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const cleanCurrent = clean(raw);
  const cleanIdx = STATUTORY_STAGES.findIndex(s => clean(s) === cleanCurrent);
  if (cleanIdx !== -1) return cleanIdx;

  // 3. Keyword / statutory subsection matching for legacy or variant values in database
  if (lower.includes('proposal') || lower.includes('feasibility')) return 0;
  if (lower.includes('3(a)') || lower.includes('3a') || lower.includes('section 4') || lower.includes('preliminary notification')) return 1;
  if (lower.includes('jms') || lower.includes('joint measurement') || (lower.includes('survey') && !lower.includes('preliminary'))) return 2;
  if (lower.includes('3(d)') || lower.includes('3d') || lower.includes('section 19') || lower.includes('declaration')) return 3;
  if (lower.includes('3(g)') || lower.includes('3g') || lower.includes('section 23') || lower.includes('award')) return 4;
  if (lower.includes('compensation') || lower.includes('dbt') || lower.includes('disbursement')) return 5;
  if (lower.includes('3(e)') || lower.includes('3e') || lower.includes('section 38') || lower.includes('possession')) return 6;
  if (lower.includes('closed') || lower.includes('handed over') || lower.includes('completed')) return 7;

  return 0;
};

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [blockers, setBlockers] = useState<any>(null);
  
  const searchParams = new URLSearchParams(location.search);
  const initialTab = (searchParams.get('tab') as any) || 'Overview';
  const [activeTab, setActiveTab] = useState<'Overview' | 'Parcels' | 'Compensation' | 'RnR' | 'GIS' | 'AI'>(initialTab);

  // Sync tab with URL if needed, but for now just taking initial is fine, 
  // or we can update activeTab when URL changes:
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab) {
      setActiveTab(tab as any);
    }
  }, [location.search]);

  // Parcel States
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loadingParcels, setLoadingParcels] = useState(false);
  const [showParcelModal, setShowParcelModal] = useState(false);
  const [parcelError, setParcelError] = useState('');
  const [createParcelLoading, setCreateParcelLoading] = useState(false);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      if (!id) return;
      
      const projectRes = await getProject(id);
      setProject(projectRes.project);
      
      setLoadingParcels(true);
      const parcelsRes = await getParcels(id);
      setParcels(parcelsRes.parcels);
      setLoadingParcels(false);
      
      const blockersRes = await getProjectBlockers(id);
      setBlockers(blockersRes.blockers);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    try {
      setDeleteLoading(true);
      if (!id) return;
      await deleteProject(id);
      navigate('/projects');
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
      setDeleteLoading(false);
    }
  };

  const canEdit = user?.role === 'CENTRAL_AUTHORITY' || user?.role === 'STATE_AUTHORITY' || user?.role === 'DISTRICT_AUTHORITY' || user?.role === 'FIELD_OFFICER';
  const canDelete = user?.role === 'CENTRAL_AUTHORITY';

  const handleCreateParcel = async (parcelPayload: Partial<ParcelData>) => {
    if (!id) return;
    
    setCreateParcelLoading(true);
    setParcelError('');
    try {
      await createParcel({ ...parcelPayload, projectId: id });
      setShowParcelModal(false);
      fetchProjectData();
    } catch (err: any) {
      setParcelError(err.message || 'Failed to add land parcel');
      throw err;
    } finally {
      setCreateParcelLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-grow flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="flex-grow flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
            {error || 'Project not found'}
          </div>
          <button 
            onClick={() => navigate('/projects')}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </button>
        </div>
      </Layout>
    );
  }

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

  const tabs = [
    { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'Parcels', label: 'Land Parcels', icon: FileText },
    { id: 'Compensation', label: 'Compensation', icon: IndianRupee },
    { id: 'RnR', label: 'R&R', icon: Home },
    { id: 'GIS', label: 'GIS Map', icon: MapIcon },
    { id: 'AI', label: 'AI Advisor', icon: Activity },
  ];

  return (
    <Layout>
      <div className="flex-grow w-full max-w-6xl mx-auto space-y-6">

        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <button 
              onClick={() => navigate('/projects')}
              className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center gap-1 mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Projects
            </button>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {project.projectCode || project.projectId}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(project.status)}`}>
                {project.status || 'Planning'}
              </span>
              {project.statutoryFramework && (
                <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  {project.statutoryFramework}
                </span>
              )}
              {project.currentStage && (
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {project.currentStage}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {project.name}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {canEdit && (
              <button
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer
                    ${activeTab === tab.id 
                      ? 'border-emerald-500 text-emerald-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-4">
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              {/* Executive Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Statutory Framework</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Scale className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-base font-bold text-slate-900 leading-snug">
                    {project.statutoryFramework || 'RFCTLARR Act, 2013'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Notification & Determination Act</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Stage</span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Activity className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="line-clamp-2">{project.currentStage || 'Proposal & Feasibility'}</span>
                  </div>
                  <div className="text-[11px] text-blue-700 font-medium mt-1">Statutory Benchmark</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sanctioned Budget</span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {project.sanctionedBudget !== undefined 
                      ? `₹${Number(project.sanctionedBudget).toLocaleString('en-IN')} Cr` 
                      : 'Not Sanctioned'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Cabinet / Ministry allocation</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Proposed Area</span>
                    <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {Number(project.totalProposedArea || project.estimatedLandRequirement || 0).toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-600">Ha</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {Number(project.acquiredLand || 0).toLocaleString('en-IN')} Ha possessed
                  </div>
                </div>
              </div>

              {/* Statutory Stage Progress Pipeline */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                {(() => {
                  const activeStep = calculateActiveStageIndex(project.currentStage, project.status);
                  const isProjectCompleted = project.status === 'Completed' || activeStep === 7;

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Statutory Acquisition Pipeline
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            National Statutory Milestones & RFCTLARR Timeline
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            isProjectCompleted 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${isProjectCompleted ? 'bg-emerald-600' : 'bg-blue-600 animate-pulse'}`}></span>
                            Stage {activeStep + 1} of 8: {STATUTORY_STAGES[activeStep]}
                          </span>
                        </div>
                      </div>

                      {/* Stepper Pipeline */}
                      <div className="overflow-x-auto pb-2">
                        <div className="min-w-[760px] grid grid-cols-8 gap-2 relative">
                          {STATUTORY_STEPS.map((step, idx) => {
                            const isDone = isProjectCompleted ? true : idx < activeStep;
                            const isCurrent = isProjectCompleted ? false : idx === activeStep;

                            return (
                              <div 
                                key={step.stage} 
                                title={`${idx + 1}. ${step.stage}`}
                                className="flex flex-col items-center text-center group"
                              >
                                <div className="w-full flex items-center justify-center relative mb-2.5">
                                  {idx > 0 && (
                                    <div className={`absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-0.5 transition-colors ${
                                      isDone || isCurrent ? 'bg-emerald-500' : 'bg-slate-200'
                                    }`} />
                                  )}
                                  {idx < STATUTORY_STEPS.length - 1 && (
                                    <div className={`absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-0.5 transition-colors ${
                                      isDone && idx < activeStep - 1 ? 'bg-emerald-500' : 'bg-slate-200'
                                    }`} />
                                  )}
                                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                    isDone 
                                      ? 'bg-emerald-600 text-white shadow-xs' 
                                      : isCurrent 
                                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs' 
                                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                                  }`}>
                                    {isDone ? '✓' : idx + 1}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-center justify-start min-h-[46px] w-full px-0.5">
                                  <span className={`text-[11px] leading-tight font-bold text-center transition-colors ${
                                    isCurrent 
                                      ? 'text-blue-700' 
                                      : isDone 
                                      ? 'text-slate-800' 
                                      : 'text-slate-400'
                                  }`}>
                                    {step.primary}
                                  </span>
                                  {step.secondary && (
                                    <span className={`text-[10px] leading-tight text-center mt-0.5 transition-colors ${
                                      isCurrent 
                                        ? 'text-blue-600 font-medium' 
                                        : isDone 
                                        ? 'text-slate-500' 
                                        : 'text-slate-400'
                                    }`}>
                                      {step.secondary}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <BlockerSummary blockers={blockers} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">General Details</h3>
                  
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Description / Public Purpose</p>
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Landmark className="w-3 h-3 text-slate-400" /> Sponsoring Ministry</p>
                      <p className="text-sm font-medium text-slate-900 leading-tight">
                        {project.sponsoringMinistry || 'Ministry of Road Transport & Highways'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Building2 className="w-3 h-3 text-slate-400" /> Implementing Agency</p>
                      <p className="text-sm font-medium text-slate-900 leading-tight">
                        {project.implementingAgency || project.department || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Scale className="w-3 h-3 text-slate-400" /> Statutory Law</p>
                      <p className="text-sm font-medium text-slate-900 leading-tight">
                        {project.statutoryFramework || 'RFCTLARR Act, 2013'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3 text-slate-400" /> Project Type</p>
                      <p className="text-sm font-medium text-slate-900 leading-tight">{project.projectType || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> Start Date</p>
                      <p className="text-sm font-medium text-slate-900">
                        {(() => {
                          if (!project.startDate) return 'Not Set';
                          const d = new Date(project.startDate);
                          return isNaN(d.getTime()) ? 'Not Set' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> Expected Completion</p>
                      <p className="text-sm font-medium text-slate-900">
                        {(() => {
                          const dateVal = project.expectedCompletion || project.expectedCompletionDate;
                          if (!dateVal) return 'Not Set';
                          const d = new Date(dateVal);
                          return isNaN(d.getTime()) ? 'Not Set' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" /> Administrative Jurisdiction
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">State</p>
                        <p className="text-sm font-bold text-slate-900">{project.state}</p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">District</p>
                        <p className="text-sm font-bold text-slate-900">{project.district}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400" /> Land Scale & Acquisition Progress
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Proposed Area</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {Number(project.totalProposedArea || project.estimatedLandRequirement || 0).toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-500">Ha</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 mb-1">Acquired & Handed Over</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {Number(project.acquiredLand || 0).toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-500">Ha</span>
                          </p>
                        </div>
                      </div>
                      
                      {(() => {
                        const total = Number(project.totalProposedArea || project.estimatedLandRequirement || 0);
                        const acquired = Number(project.acquiredLand || 0);
                        const pct = total > 0 ? Math.min(100, Math.round((acquired / total) * 100)) : 0;
                        return (
                          <div className="space-y-1.5">
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-3 rounded-full transition-all duration-1000"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>{pct}% of corridor acquired</span>
                              <span>Balance: {Math.max(0, total - acquired).toFixed(2)} Ha</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Parcels' && (
            <ParcelsTab 
              parcels={parcels} 
              loadingParcels={loadingParcels} 
              onAddClick={() => setShowParcelModal(true)} 
              canEdit={canEdit}
              onRefresh={fetchProjectData}
            />
          )}

          {activeTab === 'Compensation' && (
            <CompensationTab 
              projectId={project._id!} 
              parcels={parcels} 
              onRefresh={fetchProjectData}
              canEdit={canEdit}
            />
          )}

          {activeTab === 'RnR' && (
            <RnrTab 
              projectId={project._id!} 
              parcels={parcels} 
              onRefresh={fetchProjectData}
              canEdit={canEdit}
            />
          )}

          {activeTab === 'GIS' && (
            <GisTab projectId={project._id!} />
          )}

          {activeTab === 'AI' && (
            <AiInsightsTab projectId={project._id!} />
          )}
        </div>

      </div>

      {/* Add Parcel Modal */}
      <AddParcelModal
        projectId={id || ''}
        isOpen={showParcelModal}
        onClose={() => setShowParcelModal(false)}
        onSubmit={handleCreateParcel}
        onSuccess={fetchProjectData}
        loading={createParcelLoading}
        error={parcelError}
      />
    </Layout>
  );
}
