import React, { useMemo } from 'react';
import { Box, Cylinder, Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';

export interface LandModelProps {
  landType?: string;
  landClassification?: string;
  acquisitionStatus?: string;
  possessionStatus?: string;
  disputeStatus?: string;
  disbursementStatus?: string;
  compensationStatus?: string;
  affectedFloor?: string;
  area?: number;
  interactive?: boolean;
  onSelect?: () => void;
}

// Status color resolver according to specifications:
// - Possession Handover or Acquired / Disbursed: Solid Green (#10b981)
// - Pending Compensation / Award Declared: Yellow (#f59e0b)
// - Active Dispute / Litigation: Red (#ef4444)
export const getStatusColor = (
  disputeStatus?: string,
  acquisitionStatus?: string,
  possessionStatus?: string,
  disbursementStatus?: string,
  compensationStatus?: string
): string => {
  const disp = (disputeStatus || '').trim().toLowerCase();
  if (
    disp === 'active' ||
    disp === 'active dispute' ||
    disp === 'litigation' ||
    disp === 'stayed' ||
    disp === 'stayed/litigation'
  ) {
    return '#ef4444';
  }

  const poss = (possessionStatus || '').trim().toLowerCase();
  const acq = (acquisitionStatus || '').trim().toLowerCase();
  const disb = (disbursementStatus || '').trim().toLowerCase();
  const comp = (compensationStatus || '').trim().toLowerCase();

  // If disbursementStatus is "Disbursed" or "Compensation Paid", or possessionStatus is "Possession Handover" (or Acquired)
  if (
    disb === 'disbursed' ||
    disb === 'compensation paid' ||
    disb === 'compensation_paid' ||
    acq === 'compensation paid' ||
    acq === 'compensation_paid' ||
    comp === 'disbursed' ||
    poss === 'possession handover' ||
    poss === 'possession_handover' ||
    poss === 'taken' ||
    poss === 'handed_over' ||
    poss.includes('handover') ||
    acq === 'acquired' ||
    acq === 'completed' ||
    acq.includes('possession') ||
    acq.includes('handed')
  ) {
    return '#10b981';
  }

  return '#f59e0b';
};

// 1. AGRICULTURAL / FOREST MODEL: Flat or slightly bumpy green planes representing terrain
export const AgriculturalTerrain = ({ isForest = false }: { isForest?: boolean }) => {
  const terrainColor = isForest ? '#15803d' : '#22c55e';
  const soilColor = isForest ? '#14532d' : '#166534';

  return (
    <group position={[0, -0.2, 0]}>
      {/* Ground Base / Soil Foundation */}
      <Box args={[9.5, 0.4, 9.5]} position={[0, -0.2, 0]}>
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </Box>

      {/* Main Terrain Plane with slight elevation and contouring */}
      <Box args={[9.2, 0.15, 9.2]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color={terrainColor} roughness={0.7} />
      </Box>

      {!isForest ? (
        // Agricultural: Furrow rows & cultivated crop patches
        <group position={[0, 0.15, 0]}>
          {[-3.2, -2.1, -1.0, 0.1, 1.2, 2.3, 3.4].map((z, idx) => (
            <group key={idx} position={[0, 0, z]}>
              <Box args={[8.4, 0.1, 0.7]} position={[0, 0.05, 0]}>
                <meshStandardMaterial
                  color={idx % 2 === 0 ? '#16a34a' : '#4ade80'}
                  roughness={0.6}
                />
              </Box>
              {/* Crop plants / vegetation sprouts */}
              {[-3.2, -1.8, -0.4, 1.0, 2.4].map((x, cIdx) => (
                <Sphere
                  key={cIdx}
                  args={[0.2, 8, 8]}
                  position={[x + (idx % 2) * 0.3, 0.18, 0]}
                >
                  <meshStandardMaterial color="#86efac" />
                </Sphere>
              ))}
            </group>
          ))}

          {/* Small farmer storage shed */}
          <group position={[2.8, 0.6, 2.8]}>
            <Box args={[1.5, 1.0, 1.4]} position={[0, 0, 0]}>
              <meshStandardMaterial color="#b45309" />
            </Box>
            <Box
              args={[1.7, 0.4, 1.6]}
              position={[0, 0.65, 0]}
              rotation={[0, 0, 0]}
            >
              <meshStandardMaterial color="#78350f" />
            </Box>
          </group>
        </group>
      ) : (
        // Forest: Bumpy mounds & evergreen and deciduous trees
        <group position={[0, 0.15, 0]}>
          {/* Subtle bumpy terrain hillocks */}
          <Sphere args={[2.2, 12, 12]} scale={[1.4, 0.35, 1.2]} position={[-1.8, 0, -1.5]}>
            <meshStandardMaterial color="#166534" roughness={0.8} />
          </Sphere>
          <Sphere args={[2.0, 12, 12]} scale={[1.2, 0.3, 1.5]} position={[1.9, 0, 1.2]}>
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </Sphere>
          <Sphere args={[1.6, 12, 12]} scale={[1.1, 0.25, 1.0]} position={[0.2, 0, 2.2]}>
            <meshStandardMaterial color="#14532d" roughness={0.8} />
          </Sphere>

          {/* Low-poly trees cluster */}
          {[
            { x: -2.5, z: -2.2, scale: 1.1, type: 'pine' },
            { x: -1.2, z: -3.0, scale: 0.9, type: 'pine' },
            { x: -3.0, z: -0.8, scale: 1.0, type: 'round' },
            { x: -1.8, z: 0.2, scale: 1.2, type: 'round' },
            { x: 1.2, z: -2.4, scale: 1.0, type: 'pine' },
            { x: 2.8, z: -1.5, scale: 1.3, type: 'pine' },
            { x: 1.8, z: 1.0, scale: 1.1, type: 'round' },
            { x: 2.9, z: 2.0, scale: 1.0, type: 'pine' },
            { x: 0.2, z: 1.8, scale: 1.2, type: 'round' },
            { x: -1.2, z: 2.8, scale: 0.9, type: 'pine' },
          ].map((tree, i) => (
            <group key={i} position={[tree.x, 0, tree.z]} scale={tree.scale}>
              {/* Tree Trunk */}
              <Cylinder args={[0.12, 0.18, 0.9, 8]} position={[0, 0.45, 0]}>
                <meshStandardMaterial color="#57534e" roughness={0.9} />
              </Cylinder>
              {tree.type === 'pine' ? (
                <>
                  <Cylinder args={[0, 0.7, 1.2, 8]} position={[0, 1.3, 0]}>
                    <meshStandardMaterial color="#166534" roughness={0.7} />
                  </Cylinder>
                  <Cylinder args={[0, 0.55, 1.0, 8]} position={[0, 1.9, 0]}>
                    <meshStandardMaterial color="#15803d" roughness={0.7} />
                  </Cylinder>
                </>
              ) : (
                <Sphere args={[0.75, 10, 10]} position={[0, 1.4, 0]}>
                  <meshStandardMaterial color="#15803d" roughness={0.8} />
                </Sphere>
              )}
            </group>
          ))}
        </group>
      )}
    </group>
  );
};

// 2. COMMERCIAL / INDUSTRIAL MODEL: Extruded grey/blue box geometries (scaled height to represent factories/warehouses)
export const CommercialIndustrialModel = ({ isCommercial = false }: { isCommercial?: boolean }) => {
  return (
    <group position={[0, -0.2, 0]}>
      {/* Concrete Paved Apron & Foundation */}
      <Box args={[9.5, 0.3, 9.5]} position={[0, -0.15, 0]}>
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </Box>

      {/* Main Extruded Industrial Warehouse / Factory Facility */}
      <group position={[-0.6, 1.7, 0]}>
        {/* Main Warehouse Box (Height 3.4 to reflect industrial high-bay envelope) */}
        <Box args={[5.2, 3.4, 6.5]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color={isCommercial ? '#334155' : '#475569'}
            roughness={0.4}
            metalness={0.2}
          />
        </Box>

        {/* Industrial Blue Structural Siding Accent Band */}
        <Box args={[5.24, 0.8, 6.54]} position={[0, 0.4, 0]}>
          <meshStandardMaterial color="#2563eb" roughness={0.3} metalness={0.3} />
        </Box>

        {/* Corrugated Gabled Roof Structure */}
        <Box args={[5.4, 0.5, 6.6]} position={[0, 1.85, 0]}>
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </Box>

        {/* Rooftop Industrial HVAC Units & Vents */}
        <Box args={[1.2, 0.5, 1.0]} position={[-1.2, 2.2, -1.2]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.5} />
        </Box>
        <Box args={[1.0, 0.4, 0.8]} position={[1.2, 2.15, 1.2]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.5} />
        </Box>

        {/* Loading Bay Docks (Roll-up freight shutters) */}
        {[-1.8, 0, 1.8].map((z, idx) => (
          <group key={idx} position={[2.62, -0.5, z]}>
            {/* Bay Door Frame */}
            <Box args={[0.08, 1.8, 1.3]} position={[0, 0, 0]}>
              <meshStandardMaterial color="#0f172a" />
            </Box>
            {/* Safety Hazard Stripes / Loading Platform */}
            <Box args={[0.8, 0.2, 1.4]} position={[0.4, -0.85, 0]}>
              <meshStandardMaterial color="#eab308" />
            </Box>
          </group>
        ))}
      </group>

      {/* Secondary Administration Annex (Commercial Office Wing) */}
      <group position={[2.6, 1.2, -1.2]}>
        <Box args={[1.8, 2.4, 3.2]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#0284c7" metalness={0.3} roughness={0.3} />
        </Box>
        {/* Ribbon Glass Windows */}
        <Box args={[1.85, 0.4, 3.1]} position={[0, 0.3, 0]}>
          <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.8} transparent opacity={0.85} />
        </Box>
      </group>

      {/* Industrial Silo / Storage Tank Geometry */}
      <group position={[2.6, 1.8, 2.2]}>
        <Cylinder args={[0.7, 0.7, 3.6, 16]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
        </Cylinder>
        <Sphere args={[0.7, 16, 16]} position={[0, 1.8, 0]}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
        </Sphere>
      </group>

      {/* Perimeter Security Curb */}
      <Box args={[9.2, 0.15, 0.15]} position={[0, 0.05, 4.4]}>
        <meshStandardMaterial color="#e2e8f0" />
      </Box>
    </group>
  );
};

// 3. RESIDENTIAL MODEL: Clusters of smaller extruded blocks
export const ResidentialModel = () => {
  // Coordinated residential neighborhood houses
  const houses = [
    { x: -2.3, z: -2.3, w: 1.8, h: 1.4, d: 1.8, wallColor: '#fef3c7', roofColor: '#dc2626' },
    { x: 1.8, z: -2.2, w: 1.9, h: 1.5, d: 1.7, wallColor: '#fed7aa', roofColor: '#b45309' },
    { x: -2.2, z: 1.9, w: 1.7, h: 1.3, d: 1.9, wallColor: '#f1f5f9', roofColor: '#475569' },
    { x: 1.9, z: 2.0, w: 1.8, h: 1.6, d: 1.8, wallColor: '#fef3c7', roofColor: '#dc2626' },
    { x: 0.1, z: -0.2, w: 1.5, h: 1.2, d: 1.5, wallColor: '#e2e8f0', roofColor: '#b45309' },
  ];

  return (
    <group position={[0, -0.2, 0]}>
      {/* Land Plot Ground */}
      <Box args={[9.5, 0.3, 9.5]} position={[0, -0.15, 0]}>
        <meshStandardMaterial color="#4ade80" roughness={0.8} />
      </Box>

      {/* Internal Access Street & Driveways (Paved Grey) */}
      <Box args={[1.5, 0.05, 9.0]} position={[0, 0.02, 0]}>
        <meshStandardMaterial color="#94a3b8" />
      </Box>
      <Box args={[9.0, 0.05, 1.2]} position={[0, 0.02, 0]}>
        <meshStandardMaterial color="#94a3b8" />
      </Box>

      {/* Clustered Residential Houses */}
      {houses.map((house, idx) => (
        <group key={idx} position={[house.x, 0, house.z]}>
          {/* Main House Extruded Block */}
          <Box args={[house.w, house.h, house.d]} position={[0, house.h / 2, 0]}>
            <meshStandardMaterial color={house.wallColor} roughness={0.6} />
          </Box>

          {/* Pitched Gable Roof Structure */}
          <group position={[0, house.h + 0.3, 0]}>
            <Box
              args={[house.w + 0.3, 0.6, house.d + 0.3]}
              position={[0, 0, 0]}
              scale={[1, 0.7, 1]}
            >
              <meshStandardMaterial color={house.roofColor} roughness={0.5} />
            </Box>
          </group>

          {/* Front Entrance & Windows */}
          <Box args={[0.35, 0.6, 0.05]} position={[0, 0.3, house.d / 2 + 0.03]}>
            <meshStandardMaterial color="#78350f" />
          </Box>
          <Box args={[0.4, 0.4, 0.05]} position={[0.5, 0.7, house.d / 2 + 0.03]}>
            <meshStandardMaterial color="#38bdf8" />
          </Box>
          <Box args={[0.4, 0.4, 0.05]} position={[-0.5, 0.7, house.d / 2 + 0.03]}>
            <meshStandardMaterial color="#38bdf8" />
          </Box>

          {/* Garden Shrubbery */}
          <Sphere args={[0.25, 8, 8]} position={[house.w / 2 + 0.2, 0.25, house.d / 2]}>
            <meshStandardMaterial color="#16a34a" />
          </Sphere>
        </group>
      ))}
    </group>
  );
};

// 4. MULTI-STORY STRUCTURAL MODEL: For urban multi-story vertical parcels with affected floors
export const MultiStoryBuildingModel = ({ affectedFloor }: { affectedFloor?: string }) => {
  const floors = 5;
  const floorHeight = 1.1;
  const buildingWidth = 3.6;
  const buildingDepth = 3.6;

  let targetFloorIndex = -1;
  if (affectedFloor) {
    const match = affectedFloor.match(/\d+/);
    if (match) {
      targetFloorIndex = parseInt(match[0], 10) - 1;
    }
  }
  if (targetFloorIndex < 0) targetFloorIndex = 0;
  if (targetFloorIndex >= floors) targetFloorIndex = floors - 1;

  return (
    <group position={[0, -1.8, 0]}>
      {/* Ground Foundation */}
      <Box args={[8.5, 0.3, 8.5]} position={[0, -0.15, 0]}>
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </Box>

      {/* Stacked Floors */}
      {Array.from({ length: floors }).map((_, index) => {
        const isAffected = index === targetFloorIndex;
        const yPos = index * floorHeight + floorHeight / 2;

        return (
          <group key={index}>
            <Box args={[buildingWidth, floorHeight - 0.06, buildingDepth]} position={[0, yPos, 0]}>
              <meshStandardMaterial
                color={isAffected ? '#ef4444' : '#cbd5e1'}
                transparent
                opacity={isAffected ? 0.9 : 0.65}
              />
            </Box>

            {/* Wireframe structural edge */}
            <Box
              args={[buildingWidth + 0.02, floorHeight - 0.06 + 0.02, buildingDepth + 0.02]}
              position={[0, yPos, 0]}
            >
              <meshBasicMaterial color="#334155" wireframe />
            </Box>

            {isAffected && (
              <Text
                position={[buildingWidth / 2 + 0.3, yPos, 0]}
                rotation={[0, Math.PI / 2, 0]}
                fontSize={0.35}
                color="#ef4444"
                anchorX="center"
                anchorY="middle"
              >
                AFFECTED FLOOR
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
};

// Unified Land Model Dispatcher
export const Parcel3DGeometry: React.FC<LandModelProps> = ({
  landType,
  landClassification,
  acquisitionStatus,
  possessionStatus,
  disputeStatus,
  disbursementStatus,
  compensationStatus,
  affectedFloor,
}) => {
  const classification = (landClassification || landType || 'Agricultural').toLowerCase();

  // Status Boundary Ring (Solid Green, Yellow, or Red)
  const statusColor = getStatusColor(
    disputeStatus,
    acquisitionStatus,
    possessionStatus,
    disbursementStatus,
    compensationStatus
  );

  return (
    <group>
      {/* Dynamic Status Baseline Ribbon on ground */}
      <group position={[0, -0.38, 0]}>
        {/* Outer status frame */}
        <Box args={[10.2, 0.1, 10.2]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={0.2}
            roughness={0.4}
          />
        </Box>
      </group>

      {/* Model Geometry according to classification */}
      {(() => {
        if (classification.includes('forest')) {
          return <AgriculturalTerrain isForest={true} />;
        }
        if (classification.includes('agri') || classification.includes('farm')) {
          return <AgriculturalTerrain isForest={false} />;
        }
        if (classification.includes('commercial')) {
          return <CommercialIndustrialModel isCommercial={true} />;
        }
        if (classification.includes('industrial') || classification.includes('factory')) {
          return <CommercialIndustrialModel isCommercial={false} />;
        }
        if (classification.includes('residen') || classification.includes('housing')) {
          return <ResidentialModel />;
        }
        // If multi-story affected floor is specified
        if (affectedFloor) {
          return <MultiStoryBuildingModel affectedFloor={affectedFloor} />;
        }
        // Default to Agricultural / Rural Terrain
        return <AgriculturalTerrain isForest={false} />;
      })()}
    </group>
  );
};
