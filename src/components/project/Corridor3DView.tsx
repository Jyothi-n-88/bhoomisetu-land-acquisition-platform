import React, { useState, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box } from '@react-three/drei';
import {
  Parcel3DGeometry,
  getStatusColor,
} from './Land3DModels';
import {
  Layers,
  Compass,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Maximize2
} from 'lucide-react';

interface Corridor3DViewProps {
  features: any[];
  onSelectParcel?: (feature: any) => void;
  onOpen3DModal?: (feature: any) => void;
}

export default function Corridor3DView({
  features = [],
  onSelectParcel,
  onOpen3DModal,
}: Corridor3DViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'aerial' | 'top' | 'ground'>('aerial');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const controlsRef = useRef<any>(null);

  // Normalize parcel coordinates along the linear corridor
  const corridorParcels = useMemo(() => {
    if (!features || features.length === 0) return [];

    // Filter features
    return features
      .filter((f) => {
        const type = (f.properties?.landClassification || f.properties?.landType || '').toLowerCase();
        if (filterType !== 'all') {
          if (filterType === 'agricultural' && !type.includes('agri') && !type.includes('forest')) return false;
          if (filterType === 'commercial' && !type.includes('com') && !type.includes('ind')) return false;
          if (filterType === 'residential' && !type.includes('res')) return false;
        }

        const disp = (f.properties?.disputeStatus || '').toUpperCase();
        const poss = (f.properties?.possessionStatus || '').toUpperCase();
        const acq = (f.properties?.acquisitionStatus || '').toUpperCase();
        const isDispute = disp === 'ACTIVE' || disp === 'LITIGATION';
        const isAcquired =
          poss === 'TAKEN' ||
          poss.includes('HANDOVER') ||
          acq === 'ACQUIRED' ||
          acq === 'COMPLETED' ||
          acq.includes('POSSESSION');

        if (filterStatus === 'acquired' && (!isAcquired || isDispute)) return false;
        if (filterStatus === 'pending' && (isAcquired || isDispute)) return false;
        if (filterStatus === 'dispute' && !isDispute) return false;

        return true;
      })
      .map((f, index, arr) => {
        // Space parcels along an expressway corridor line (X-axis) with alternating left/right road buffer
        const spacing = 14;
        const total = arr.length;
        const xOffset = (index - total / 2) * spacing;
        // Slight natural roadway curvature
        const zOffset = Math.sin(index * 0.45) * 3;

        return {
          ...f,
          corridorX: xOffset,
          corridorZ: zOffset,
          originalIndex: index,
        };
      });
  }, [features, filterType, filterStatus]);

  const activeFeature = useMemo(() => {
    const targetId = selectedId || hoveredId;
    return features.find(
      (f) => (f.properties?.parcelId || f.properties?.id || f.id) === targetId
    );
  }, [features, selectedId, hoveredId]);

  // Set camera positions based on selected camera mode
  const cameraConfig = useMemo(() => {
    if (cameraMode === 'top') {
      return { position: [0, 45, 0.1] as [number, number, number], fov: 40 };
    }
    if (cameraMode === 'ground') {
      return { position: [0, 5, 25] as [number, number, number], fov: 55 };
    }
    return { position: [15, 24, 30] as [number, number, number], fov: 45 };
  }, [cameraMode]);

  const corridorLength = Math.max(80, corridorParcels.length * 15 + 20);

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden flex flex-col select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Legend & View Modes */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/70 shadow-xl flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-white tracking-wide">3D Corridor Digital Twin</span>
          </div>

          <div className="h-4 w-px bg-slate-700"></div>

          {/* Camera Angles */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCameraMode('aerial')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                cameraMode === 'aerial'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Aerial 3D
            </button>
            <button
              onClick={() => setCameraMode('top')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                cameraMode === 'top'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Top Plan
            </button>
            <button
              onClick={() => setCameraMode('ground')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                cameraMode === 'ground'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Corridor Elevation
            </button>
          </div>
        </div>

        {/* Right: Filters */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 shadow-xl flex items-center gap-2 pointer-events-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">All Land Classifications</option>
            <option value="agricultural">Agricultural / Forest</option>
            <option value="commercial">Commercial / Industrial</option>
            <option value="residential">Residential</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="acquired">Acquired / Possession</option>
            <option value="pending">Pending Compensation</option>
            <option value="dispute">Active Disputes</option>
          </select>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas camera={cameraConfig}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[30, 40, 20]} intensity={1.3} castShadow />
          <directionalLight position={[-20, 20, -20]} intensity={0.4} />

          {/* Continuous Expressway / Linear Corridor Roadway */}
          <group position={[0, -0.4, 0]}>
            {/* Asphalt Highway Corridor */}
            <Box args={[corridorLength, 0.25, 4.8]} position={[0, 0, 0]}>
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </Box>
            {/* White Lane Markings */}
            <Box args={[corridorLength, 0.26, 0.2]} position={[0, 0.01, 0]}>
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </Box>
            <Box args={[corridorLength, 0.26, 0.15]} position={[0, 0.01, -1.8]}>
              <meshStandardMaterial color="#eab308" roughness={0.5} />
            </Box>
            <Box args={[corridorLength, 0.26, 0.15]} position={[0, 0.01, 1.8]}>
              <meshStandardMaterial color="#eab308" roughness={0.5} />
            </Box>

            {/* Continuous Ground Plane Underneath */}
            <Box args={[corridorLength + 40, 0.1, 80]} position={[0, -0.3, 0]}>
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </Box>
          </group>

          {/* Render All Corridor Parcels with Land Type 3D Geometries */}
          {corridorParcels.map((parcel) => {
            const pid = parcel.properties?.parcelId || parcel.properties?.id || parcel.id;
            const isSelected = selectedId === pid;
            const isHovered = hoveredId === pid;
            const statusColor = getStatusColor(
              parcel.properties?.disputeStatus,
              parcel.properties?.acquisitionStatus,
              parcel.properties?.possessionStatus,
              parcel.properties?.disbursementStatus,
              parcel.properties?.compensationStatus
            );

            return (
              <group
                key={pid}
                position={[parcel.corridorX, 0, parcel.corridorZ]}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(pid);
                  if (onSelectParcel) onSelectParcel(parcel);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredId(pid);
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  setHoveredId(null);
                }}
              >
                {/* Visual Selection / Hover Indicator Ring */}
                {(isSelected || isHovered) && (
                  <Box args={[11.5, 0.3, 11.5]} position={[0, -0.35, 0]}>
                    <meshStandardMaterial
                      color={isSelected ? '#6366f1' : '#38bdf8'}
                      emissive={isSelected ? '#4f46e5' : '#0284c7'}
                      emissiveIntensity={0.6}
                      wireframe
                    />
                  </Box>
                )}

                {/* Overhead Survey Label */}
                <Text
                  position={[0, 5.2, 0]}
                  fontSize={0.65}
                  color="#ffffff"
                  anchorX="center"
                  anchorY="bottom"
                  outlineWidth={0.06}
                  outlineColor="#090d16"
                >
                  {parcel.properties?.surveyNumber
                    ? `Survey #${parcel.properties.surveyNumber}`
                    : parcel.properties?.parcelId || 'Parcel'}
                </Text>

                {/* Land Classification & Status Tag */}
                <Text
                  position={[0, 4.4, 0]}
                  fontSize={0.42}
                  color={statusColor}
                  anchorX="center"
                  anchorY="bottom"
                  outlineWidth={0.04}
                  outlineColor="#000000"
                >
                  {`${parcel.properties?.landClassification || parcel.properties?.landType || 'Agricultural'} • ${parcel.properties?.area || '1'} Ha`}
                </Text>

                {/* The 3D Geometry for this land parcel */}
                <Parcel3DGeometry
                  landType={parcel.properties?.landType}
                  landClassification={parcel.properties?.landClassification}
                  acquisitionStatus={parcel.properties?.acquisitionStatus}
                  possessionStatus={parcel.properties?.possessionStatus}
                  disputeStatus={parcel.properties?.disputeStatus}
                  disbursementStatus={parcel.properties?.disbursementStatus}
                  compensationStatus={parcel.properties?.compensationStatus}
                  affectedFloor={parcel.properties?.affectedFloor}
                  area={parcel.properties?.area}
                />
              </group>
            );
          })}

          <OrbitControls
            ref={controlsRef}
            makeDefault
            minDistance={8}
            maxDistance={90}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        </Canvas>
      </div>

      {/* Bottom Floating Info Card for Hovered/Selected Parcel */}
      {activeFeature && (
        <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700/80 shadow-2xl z-20 text-white animate-in fade-in duration-150">
          <div className="flex items-start justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Linear Corridor Parcel
              </span>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                {activeFeature.properties?.parcelId}
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{
                    backgroundColor: getStatusColor(
                      activeFeature.properties?.disputeStatus,
                      activeFeature.properties?.acquisitionStatus,
                      activeFeature.properties?.possessionStatus,
                      activeFeature.properties?.disbursementStatus,
                      activeFeature.properties?.compensationStatus
                    ),
                  }}
                ></span>
              </h4>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {activeFeature.properties?.landClassification ||
                activeFeature.properties?.landType ||
                'Agricultural'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div>
              <span className="text-slate-400">Survey No:</span>
              <p className="font-semibold text-slate-200">
                {activeFeature.properties?.surveyNumber || 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Land Area:</span>
              <p className="font-semibold text-slate-200">
                {activeFeature.properties?.area || '0'} Hectares
              </p>
            </div>
            <div>
              <span className="text-slate-400">Owner:</span>
              <p className="font-semibold text-slate-200 truncate">
                {activeFeature.properties?.ownerName || 'Unknown'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Acquisition:</span>
              <p className="font-semibold text-slate-200">
                {(activeFeature.properties?.acquisitionStatus || '').replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Quick Action to open dedicated 3D Inspector modal */}
          {onOpen3DModal && (
            <button
              onClick={() => onOpen3DModal(activeFeature)}
              className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Inspect 3D Land Architecture
            </button>
          )}
        </div>
      )}

      {/* Bottom Left Status Legend */}
      <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/70 text-xs text-white z-10 hidden sm:block">
        <h5 className="font-bold text-slate-200 mb-2 text-[11px] uppercase tracking-wider">
          Corridor Color Codes
        </h5>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-[#10b981]"></span>
            <span className="text-slate-300">Possession Handover / Acquired</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-[#f59e0b]"></span>
            <span className="text-slate-300">Pending Compensation / Award Declared</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-[#ef4444]"></span>
            <span className="text-slate-300">Active Dispute / Litigation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
