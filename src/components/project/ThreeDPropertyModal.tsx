import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  X,
  Building2,
  MapPin,
  IndianRupee,
  Home,
  AlertCircle,
  Trees,
  Factory,
  Wheat,
  ShieldAlert,
  CheckCircle2,
  Layers,
  RotateCcw
} from 'lucide-react';
import {
  Parcel3DGeometry,
  getStatusColor,
  MultiStoryBuildingModel,
} from './Land3DModels';

interface ThreeDPropertyModalProps {
  parcel: any;
  onClose: () => void;
}

export default function ThreeDPropertyModal({ parcel, onClose }: ThreeDPropertyModalProps) {
  if (!parcel) return null;

  const parcelData = parcel.properties || parcel;
  const originalLandType =
    parcelData.landClassification || parcelData.landType || 'Agricultural';

  // Allow live preview of different land classifications
  const [selectedLandType, setSelectedLandType] = useState<string>(originalLandType);
  const [viewMode, setViewMode] = useState<'land' | 'floors'>('land');

  const statusColor = getStatusColor(
    parcelData.disputeStatus,
    parcelData.acquisitionStatus,
<<<<<<< HEAD
    parcelData.possessionStatus,
    parcelData.disbursementStatus,
    parcelData.compensationStatus
=======
    parcelData.possessionStatus
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
  );

  const getStatusBadge = () => {
    const disp = (parcelData.disputeStatus || '').toUpperCase();
    if (disp === 'ACTIVE' || disp === 'LITIGATION') {
      return {
        label: 'Active Dispute / Litigation',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: ShieldAlert,
        color: '#ef4444',
      };
    }

    const poss = (parcelData.possessionStatus || '').toUpperCase();
    const acq = (parcelData.acquisitionStatus || '').toUpperCase();
<<<<<<< HEAD
    const disb = (parcelData.disbursementStatus || '').toUpperCase();
    const comp = (parcelData.compensationStatus || '').toUpperCase();

    if (
      disb === 'DISBURSED' ||
      disb === 'COMPENSATION PAID' ||
      acq === 'COMPENSATION_PAID' ||
      acq === 'COMPENSATION PAID' ||
      comp === 'DISBURSED' ||
=======
    if (
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
      poss === 'TAKEN' ||
      poss.includes('HANDOVER') ||
      acq === 'ACQUIRED' ||
      acq === 'COMPLETED' ||
      acq.includes('POSSESSION')
    ) {
      return {
<<<<<<< HEAD
        label: 'Possession Handover / Disbursed / Acquired',
=======
        label: 'Possession Handover / Acquired',
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
        color: '#10b981',
      };
    }

    return {
      label: 'Pending Compensation / Award Declared',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertCircle,
      color: '#f59e0b',
    };
  };

  const statusInfo = getStatusBadge();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: statusColor }}
            >
              {selectedLandType.toLowerCase().includes('agri') ? (
                <Wheat className="w-5 h-5" />
              ) : selectedLandType.toLowerCase().includes('forest') ? (
                <Trees className="w-5 h-5" />
              ) : selectedLandType.toLowerCase().includes('ind') ||
                selectedLandType.toLowerCase().includes('com') ? (
                <Factory className="w-5 h-5" />
              ) : (
                <Home className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  3D Parcel Land Classification & Twin
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.bg}`}>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Parcel ID: <span className="font-semibold text-slate-700">{parcelData.parcelId}</span> • 
                Survey No: <span className="font-semibold text-slate-700">{parcelData.surveyNumber || 'N/A'}</span> •
                Area: <span className="font-semibold text-slate-700">{parcelData.area || 1} Hectares</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-slate-200/80 p-0.5 rounded-lg flex items-center text-xs">
              <button
                onClick={() => setViewMode('land')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === 'land'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Land 3D Geometry
              </button>
              {parcelData.affectedFloor && (
                <button
                  onClick={() => setViewMode('floors')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                    viewMode === 'floors'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Floor Levels
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Split */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          
          {/* 3D Canvas Viewport */}
          <div className="flex-1 bg-gradient-to-b from-slate-900 to-slate-950 relative cursor-move border-b md:border-b-0 md:border-r border-slate-800">
            {/* Floating 3D Badge */}
            <div className="absolute top-4 left-4 z-10 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-slate-700/60 pointer-events-none">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: statusColor }}
                ></span>
                {selectedLandType} 3D Geometry
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Orbit with left click • Zoom with scroll • Pan with right click
              </p>
            </div>

            {/* Quick Land Type Switcher in 3D Viewport */}
            <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-700/60 flex items-center gap-1">
              {[
                { type: 'Agricultural', label: 'Agricultural' },
                { type: 'Forest', label: 'Forest' },
                { type: 'Commercial', label: 'Commercial' },
                { type: 'Industrial', label: 'Industrial' },
                { type: 'Residential', label: 'Residential' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setSelectedLandType(item.type)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                    selectedLandType.toLowerCase().includes(item.type.toLowerCase())
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Canvas camera={{ position: [10, 8, 12], fov: 45 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[15, 20, 10]} intensity={1.2} castShadow />
              <directionalLight position={[-10, 10, -10]} intensity={0.3} />

              {viewMode === 'floors' ? (
                <MultiStoryBuildingModel affectedFloor={parcelData.affectedFloor} />
              ) : (
                <Parcel3DGeometry
                  landType={selectedLandType}
                  landClassification={selectedLandType}
                  acquisitionStatus={parcelData.acquisitionStatus}
                  possessionStatus={parcelData.possessionStatus}
                  disputeStatus={parcelData.disputeStatus}
                  affectedFloor={parcelData.affectedFloor}
                  area={parcelData.area}
                />
              )}

              <OrbitControls makeDefault minDistance={5} maxDistance={35} />
            </Canvas>
          </div>

          {/* Data & Specifications Panel */}
          <div className="w-full md:w-88 bg-white p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
                Corridor Parcel Profile
              </h3>

              {/* Classification Specifications Box */}
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                  Land Classification Model
                </span>
                <p className="text-xs text-indigo-950 font-medium">
                  {selectedLandType.toLowerCase().includes('agri') &&
                    'Rendered as flat/undulating agricultural terrain plane with crop furrows and farmland soil foundation.'}
                  {selectedLandType.toLowerCase().includes('forest') &&
                    'Rendered as bumpy forest terrain with dense evergreen and deciduous foliage clusters.'}
                  {(selectedLandType.toLowerCase().includes('com') ||
                    selectedLandType.toLowerCase().includes('ind')) &&
                    'Rendered as extruded grey/blue high-bay box geometry representing industrial factories and warehouses.'}
                  {selectedLandType.toLowerCase().includes('res') &&
                    'Rendered as clusters of smaller extruded residential blocks with pitched roofs and community lanes.'}
                </p>
              </div>

              {/* Status Specification Box */}
              <div className="p-3.5 rounded-xl border space-y-1.5" style={{ backgroundColor: `${statusColor}10`, borderColor: `${statusColor}35` }}>
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: statusColor }}>
                  Acquisition Corridor Status
                </span>
                <p className="text-xs text-slate-800 font-semibold">
                  {statusInfo.label}
                </p>
                <p className="text-[11px] text-slate-600">
                  {statusColor === '#10b981' &&
                    'Parcel possession is cleared. Solid green corridor footprint merges with adjacent acquired expressway segments.'}
                  {statusColor === '#f59e0b' &&
                    'Pending compensation disbursement or award inquiry proceedings.'}
                  {statusColor === '#ef4444' &&
                    'Active legal dispute or litigation pending court/tribunal arbitration.'}
                </p>
              </div>

              {/* Parcel Details */}
              <div className="space-y-3 pt-1">
                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Owner & Survey Details
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Owner Name:</span>
                      <span className="font-semibold text-slate-800">{parcelData.ownerName || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Survey Number:</span>
                      <span className="font-semibold text-slate-800">{parcelData.surveyNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Land Area:</span>
                      <span className="font-semibold text-slate-800">{parcelData.area || 1} Hectares</span>
                    </div>
                  </div>
                </div>

                {parcelData.affectedFloor && (
                  <div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Affected Vertical Floor
                    </p>
                    <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                      {parcelData.affectedFloor}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" /> Statutory Compensation
                  </p>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Award Amount:</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{(parcelData.compensationAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Disbursement:</span>
                      <span className="font-semibold text-indigo-700">
                        {parcelData.disbursementStatus || parcelData.compensationStatus || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={onClose}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close 3D View
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
