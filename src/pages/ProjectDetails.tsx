import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getProject, deleteProject, ProjectData, getProjectBlockers } from '../services/projectService';
import { getParcels, createParcel, ParcelData } from '../services/parcelService';
import { useAuth } from '../context/AuthContext';
import { Briefcase, MapPin, Calendar, Activity, ArrowLeft, Trash2, Edit3, Plus, AlertCircle, LayoutDashboard, FileText, IndianRupee, Home, Map as MapIcon } from 'lucide-react';
import BlockerSummary from '../components/project/BlockerSummary';
import CompensationTab from '../components/project/CompensationTab';
import RnrTab from '../components/project/RnrTab';
import ParcelsTab from '../components/project/ParcelsTab';
import GisTab from '../components/project/GisTab';

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [blockers, setBlockers] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'Overview' | 'Parcels' | 'Compensation' | 'RnR' | 'GIS'>('Overview');


  // Parcel States
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loadingParcels, setLoadingParcels] = useState(false);
  const [showParcelModal, setShowParcelModal] = useState(false);
  const [parcelError, setParcelError] = useState('');
  const [createParcelLoading, setCreateParcelLoading] = useState(false);
  const [newParcel, setNewParcel] = useState<Partial<ParcelData>>({
    parcelId: '',
    surveyNumber: '',
    ownerName: '',
    ownerContact: '',
    area: 0,
    landType: 'Agricultural',
    latitude: 0,
    longitude: 0,
    acquisitionStatus: 'PROPOSED',
    disputeStatus: 'NONE'
  });

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

  const handleCreateParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setCreateParcelLoading(true);
    setParcelError('');
    try {
      await createParcel({ ...newParcel, projectId: id });
      setShowParcelModal(false);
      setNewParcel({
        parcelId: '', surveyNumber: '', ownerName: '', ownerContact: '',
        area: 0, landType: 'Agricultural', latitude: 0, longitude: 0,
        acquisitionStatus: 'PROPOSED', disputeStatus: 'NONE'
      });
      fetchProjectData();
    } catch (err: any) {
      setParcelError(err.message || 'Failed to add land parcel');
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
  ];

  return (
    <Layout>
      <div className="flex-grow w-full max-w-6xl mx-auto space-y-6">

        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <button 
              onClick={() => navigate('/projects')}
              className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center gap-1 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Projects
            </button>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {project.projectId}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
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
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
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
              <BlockerSummary blockers={blockers} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">General Details</h3>
                  
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Description</p>
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Department</p>
                      <p className="text-sm font-medium text-slate-900">{project.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Type</p>
                      <p className="text-sm font-medium text-slate-900">{project.projectType || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Start Date</p>
                      <p className="text-sm font-medium text-slate-900">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not Set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Expected Completion</p>
                      <p className="text-sm font-medium text-slate-900">
                        {project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toLocaleDateString() : 'Not Set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" /> Geography
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">State</p>
                        <p className="text-sm font-semibold text-slate-900">{project.state}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">District</p>
                        <p className="text-sm font-semibold text-slate-900">{project.district}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Land Requirements</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Estimated Area (Acres/Ha)</p>
                          <p className="text-2xl font-light text-slate-900">{project.estimatedLandRequirement || '0'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 mb-1">Acquired Area</p>
                          <p className="text-2xl font-light text-emerald-600">{project.acquiredLand || '0'}</p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${Math.min(100, (project.estimatedLandRequirement && project.estimatedLandRequirement > 0) 
                              ? ((project.acquiredLand || 0) / project.estimatedLandRequirement) * 100 
                              : 0)}%` 
                          }}
                        ></div>
                      </div>
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
        </div>

      </div>

      {/* Add Parcel Modal */}
      {showParcelModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Add Land Parcel
            </h3>
            
            {parcelError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                {parcelError}
              </div>
            )}

            <form onSubmit={handleCreateParcel} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parcel ID *</label>
                  <input
                    type="text"
                    required
                    value={newParcel.parcelId}
                    onChange={(e) => setNewParcel({ ...newParcel, parcelId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    placeholder="e.g. P-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Survey Number *</label>
                  <input
                    type="text"
                    required
                    value={newParcel.surveyNumber}
                    onChange={(e) => setNewParcel({ ...newParcel, surveyNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. 45/2A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    value={newParcel.ownerName}
                    onChange={(e) => setNewParcel({ ...newParcel, ownerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Area (Acres) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newParcel.area || ''}
                    onChange={(e) => setNewParcel({ ...newParcel, area: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Land Type</label>
                  <select
                    value={newParcel.landType}
                    onChange={(e) => setNewParcel({ ...newParcel, landType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="Agricultural">Agricultural</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                    <option value="Forest">Forest</option>
                    <option value="Government">Government</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dispute Status</label>
                  <select
                    value={newParcel.disputeStatus}
                    onChange={(e) => setNewParcel({ ...newParcel, disputeStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="NONE">None</option>
                    <option value="ACTIVE">Active Dispute</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 md:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newParcel.latitude || ''}
                      onChange={(e) => setNewParcel({ ...newParcel, latitude: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                      placeholder="e.g. 18.5204"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newParcel.longitude || ''}
                      onChange={(e) => setNewParcel({ ...newParcel, longitude: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                      placeholder="e.g. 73.8567"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowParcelModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createParcelLoading}
                  className="px-5 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {createParcelLoading ? 'Saving...' : 'Save Parcel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
