import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Text } from '@react-three/drei';
import { X, Building2, MapPin, IndianRupee, Home, AlertCircle } from 'lucide-react';

interface ThreeDPropertyModalProps {
  parcel: any;
  onClose: () => void;
}

const BuildingModel = ({ affectedFloor }: { affectedFloor?: string }) => {
  // Simple conceptual 5-story building representation
  const floors = 5;
  const floorHeight = 1.2;
  const buildingWidth = 3;
  const buildingDepth = 3;

  // Attempt to parse a floor number if they typed something like "Floor 3"
  let targetFloorIndex = -1;
  if (affectedFloor) {
    const match = affectedFloor.match(/\d+/);
    if (match) {
      targetFloorIndex = parseInt(match[0], 10) - 1; // 1-indexed to 0-indexed
    }
  }
  
  // Cap between 0 and 4 just in case
  if (targetFloorIndex < 0) targetFloorIndex = 0;
  if (targetFloorIndex >= floors) targetFloorIndex = floors - 1;

  return (
    <group position={[0, -2, 0]}>
      {/* Base / Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Floors */}
      {Array.from({ length: floors }).map((_, index) => {
        const isAffected = index === targetFloorIndex;
        const yPos = index * floorHeight + (floorHeight / 2);

        return (
          <group key={index}>
            <Box 
              args={[buildingWidth, floorHeight - 0.05, buildingDepth]} 
              position={[0, yPos, 0]}
            >
              <meshStandardMaterial 
                color={isAffected ? '#ef4444' : '#cbd5e1'} 
                transparent
                opacity={isAffected ? 0.9 : 0.6}
              />
            </Box>
            
            {/* Outline box to give definition */}
            <Box 
              args={[buildingWidth + 0.02, floorHeight - 0.05 + 0.02, buildingDepth + 0.02]} 
              position={[0, yPos, 0]}
            >
              <meshBasicMaterial color="#334155" wireframe />
            </Box>

            {isAffected && (
              <Text
                position={[buildingWidth / 2 + 0.2, yPos, 0]}
                rotation={[0, Math.PI / 2, 0]}
                fontSize={0.4}
                color="#ef4444"
                anchorX="center"
                anchorY="middle"
              >
                AFFECTED
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default function ThreeDPropertyModal({ parcel, onClose }: ThreeDPropertyModalProps) {
  if (!parcel) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">3D Property Analysis</h2>
              <p className="text-sm text-slate-500">Parcel ID: {parcel.parcelId || parcel.properties?.parcelId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Split */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          
          {/* 3D Canvas */}
          <div className="flex-1 bg-slate-50 relative cursor-move border-b md:border-b-0 md:border-r border-slate-200">
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 pointer-events-none">
              <p className="text-xs font-bold text-slate-700">Interactive 3D View</p>
              <p className="text-[10px] text-slate-500">Left click to rotate, scroll to zoom</p>
            </div>
            
            <Canvas camera={{ position: [6, 4, 6], fov: 45 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
              <BuildingModel affectedFloor={parcel.affectedFloor || parcel.properties?.affectedFloor} />
              <OrbitControls makeDefault />
            </Canvas>
          </div>

          {/* Data Panel */}
          <div className="w-full md:w-80 bg-white p-6 overflow-y-auto">
            <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Record Details</h3>
            
            <div className="space-y-5">
              
              <div>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Affected Floor
                </p>
                <p className="text-sm font-bold text-slate-900 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg text-rose-700">
                  {parcel.affectedFloor || parcel.properties?.affectedFloor || 'Not specified'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5" /> Owner & Survey
                </p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Owner</p>
                    <p className="text-sm font-medium text-slate-800">{parcel.ownerName || parcel.properties?.ownerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Survey Number</p>
                    <p className="text-sm font-medium text-slate-800">{parcel.surveyNumber || parcel.properties?.surveyNumber}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
                  <IndianRupee className="w-3.5 h-3.5" /> Compensation
                </p>
                <p className="text-sm font-medium text-slate-800 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                  {(parcel.compensationStatus || parcel.properties?.compensationStatus || '').replace(/_/g, ' ')}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
                  <Home className="w-3.5 h-3.5" /> R&R Requirements
                </p>
                <p className="text-sm font-medium text-slate-800 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                  {(parcel.rnrStatus || parcel.properties?.rnrStatus || '').replace(/_/g, ' ')}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Status Summary</p>
                <div className={`px-3 py-2 rounded-lg border text-sm font-medium 
                  ${(parcel.acquisitionStatus || parcel.properties?.acquisitionStatus) === 'ACQUIRED' || (parcel.acquisitionStatus || parcel.properties?.acquisitionStatus) === 'COMPLETED' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-amber-50 text-amber-700 border-amber-100'}`}
                >
                  {(parcel.acquisitionStatus || parcel.properties?.acquisitionStatus || '').replace(/_/g, ' ')}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
