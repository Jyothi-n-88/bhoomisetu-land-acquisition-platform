import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Map, { Source, Layer, Popup, ViewStateChangeEvent } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getProjectGeoJSON } from '../services/parcelService';
import {
  MapPin,
  AlertCircle,
  RefreshCw,
  Box as BoxIcon,
  Map as MapIcon,
  Layers,
  Trees,
  Factory,
  Home,
  Wheat,
  CheckCircle2,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import ThreeDPropertyModal from './project/ThreeDPropertyModal';
import Corridor3DView from './project/Corridor3DView';
import { getStatusColor } from './project/Land3DModels';
import { useDataSync } from '../utils/eventSync';

interface GISMapProps {
  projectId: string;
  className?: string;
  initialMode?: '2D' | '3D';
}

// 2D Mapbox Map Status Color Expression (matches prompt specifications):
// - Possession Handover, Disbursed / Compensation Paid, or Acquired: Solid Green (#10b981) with 60% opacity to show continuous completed corridor
// - Pending Compensation / Award Declared: Yellow (#f59e0b)
// - Active Dispute / Litigation: Red (#ef4444)
export const STATUS_FILL_COLOR_EXPRESSION: any = [
  'case',
  // Active Dispute / Litigation -> Red
  [
    'any',
    ['==', ['get', 'disputeStatus'], 'ACTIVE'],
    ['==', ['get', 'disputeStatus'], 'Active Dispute'],
    ['==', ['get', 'disputeStatus'], 'LITIGATION'],
    ['==', ['get', 'disputeStatus'], 'Litigation']
  ],
  '#ef4444',

  // Possession Handover, Disbursed, or Compensation Paid -> Solid Green
  [
    'any',
    ['==', ['get', 'disbursementStatus'], 'Disbursed'],
    ['==', ['get', 'disbursementStatus'], 'DISBURSED'],
    ['==', ['get', 'disbursementStatus'], 'disbursed'],
    ['==', ['get', 'disbursementStatus'], 'Compensation Paid'],
    ['==', ['get', 'disbursementStatus'], 'COMPENSATION_PAID'],
    ['==', ['get', 'disbursementStatus'], 'compensation paid'],
    ['==', ['get', 'acquisitionStatus'], 'COMPENSATION_PAID'],
    ['==', ['get', 'acquisitionStatus'], 'Compensation Paid'],
    ['==', ['get', 'compensationStatus'], 'DISBURSED'],
    ['==', ['get', 'compensationStatus'], 'Disbursed'],
    ['==', ['get', 'possessionStatus'], 'TAKEN'],
    ['==', ['get', 'possessionStatus'], 'Possession Handover'],
    ['==', ['get', 'possessionStatus'], 'POSSESSION_HANDOVER'],
    ['==', ['get', 'possessionStatus'], 'possession handover'],
    ['==', ['get', 'possessionStatus'], 'HANDED_OVER'],
    ['==', ['get', 'acquisitionStatus'], 'ACQUIRED'],
    ['==', ['get', 'acquisitionStatus'], 'Acquired'],
    ['==', ['get', 'acquisitionStatus'], 'COMPLETED'],
    ['==', ['get', 'acquisitionStatus'], 'Completed'],
    ['==', ['get', 'acquisitionStatus'], 'POSSESSION_HANDOVER'],
    ['==', ['get', 'acquisitionStatus'], 'Possession Handover'],
    ['==', ['get', 'acquisitionStatus'], 'Section 3(E) (Possession Handover)'],
    ['==', ['get', 'acquisitionStatus'], 'Project Handed Over / Closed']
  ],
  '#10b981',

  // Pending Compensation / Award Declared (or default) -> Yellow
  '#f59e0b'
];

export default function GISMap({ projectId, className = '', initialMode = '2D' }: GISMapProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'2D' | '3D'>(initialMode);
  const [show3DModal, setShow3DModal] = useState<any>(null);
  
  const [viewState, setViewState] = useState({
    longitude: 78.9629,
    latitude: 20.5937,
    zoom: 4
  });
  
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const mapRef = useRef<MapRef>(null);

  const fetchGeoJSON = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError('');
      const data = await getProjectGeoJSON(projectId);
      setGeoData(data);
      
      // Calculate bounding box or center from features on initial load
      if (isInitial && data.features && data.features.length > 0) {
        let totalLat = 0;
        let totalLng = 0;
        let count = 0;
        
        data.features.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.type === 'Point') {
            totalLng += feature.geometry.coordinates[0];
            totalLat += feature.geometry.coordinates[1];
            count++;
          } else if (feature.geometry && feature.geometry.type === 'Polygon' && feature.geometry.coordinates?.[0]) {
            feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
              totalLng += coord[0];
              totalLat += coord[1];
              count++;
            });
          }
        });
        
        if (count > 0) {
          setViewState({
            longitude: totalLng / count,
            latitude: totalLat / count,
            zoom: 13
          });
        }
      }
    } catch (err: any) {
      if (isInitial) setError('Failed to load project GIS corridor data');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchGeoJSON(true);
  }, [fetchGeoJSON]);

  // Synchronize GIS layers immediately when parcel status changes
  useDataSync(useCallback((detail) => {
    if (!detail?.projectId || detail.projectId === projectId) {
      fetchGeoJSON(false);
    }
  }, [projectId, fetchGeoJSON]));

  const mapToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // Status statistics along the corridor
  const corridorStats = useMemo(() => {
    if (!geoData?.features) return { acquired: 0, pending: 0, dispute: 0, total: 0 };
    let acquired = 0;
    let pending = 0;
    let dispute = 0;

    geoData.features.forEach((f: any) => {
      const color = getStatusColor(
        f.properties?.disputeStatus,
        f.properties?.acquisitionStatus,
        f.properties?.possessionStatus,
        f.properties?.disbursementStatus,
        f.properties?.compensationStatus
      );
      if (color === '#10b981') acquired++;
      else if (color === '#ef4444') dispute++;
      else pending++;
    });

    return { acquired, pending, dispute, total: geoData.features.length };
  }, [geoData]);

  if (!mapToken) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200 shadow-sm">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">Mapbox Token Missing</h3>
        <p className="text-sm text-slate-600">Please configure VITE_MAPBOX_TOKEN in your environment variables to view the GIS map.</p>
      </div>
    );
  }

  // 2D Polygon Fill Layer: 60% opacity with dynamic fill color
  const polygonLayerStyle = {
    id: 'parcel-polygons',
    type: 'fill',
    paint: {
      'fill-opacity': 0.6,
      'fill-color': STATUS_FILL_COLOR_EXPRESSION,
      'fill-antialias': true
    }
  } as any;

  // Polygon Outline Layer:
  // Dynamically matches the status fill color so adjacent parcels blend seamlessly into an unbroken corridor line
  const polygonOutlineStyle = {
    id: 'parcel-polygons-outline',
    type: 'line',
    paint: {
      'line-color': STATUS_FILL_COLOR_EXPRESSION,
      'line-width': 1.5,
      'line-opacity': 0.8
    }
  } as any;

  const pointLayerStyle = {
    id: 'parcel-points',
    type: 'circle',
    paint: {
      'circle-radius': 7,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      'circle-color': STATUS_FILL_COLOR_EXPRESSION
    }
  } as any;

  const onHover = (event: any) => {
    const feature = event.features && event.features[0];
    if (feature) {
      setHoverInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        properties: feature.properties
      });
    } else {
      setHoverInfo(null);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${className}`} style={{ height: '650px' }}>
      {/* GIS Header & Toolbar */}
      <div className="p-3.5 px-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Linear Infrastructure Corridor GIS</h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 uppercase">
                Dynamic 2D / 3D
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live status color-coding and 3D land classification digital twin
            </p>
          </div>
        </div>

        {/* Corridor Health Badges */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            <span>Acquired: {corridorStats.acquired}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
            <span>Pending: {corridorStats.pending}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
            <span>Disputes: {corridorStats.dispute}</span>
          </div>
        </div>

        {/* View Mode Toggle (2D Map vs 3D Corridor) & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="bg-slate-200/90 p-0.5 rounded-xl flex items-center shadow-xs">
            <button
              onClick={() => setViewMode('2D')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === '2D'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-emerald-600" />
              2D Corridor Map
            </button>
            <button
              onClick={() => setViewMode('3D')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === '3D'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BoxIcon className="w-3.5 h-3.5 text-indigo-600" />
              3D Land Digital Twin
            </button>
          </div>

          <button 
            onClick={fetchGeoJSON} 
            disabled={loading}
            title="Refresh GIS Corridor Data"
            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="relative flex-grow w-full h-full bg-slate-100 overflow-hidden">
        {loading && !geoData && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Loading Corridor Geometries...</p>
              <p className="text-xs text-slate-400 mt-1">Generating status-colored polygon alignments</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm">
            <div className="text-center text-rose-600 bg-white p-6 rounded-2xl border border-rose-200 shadow-lg">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={fetchGeoJSON}
                className="mt-3 px-4 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 hover:bg-rose-100"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* 2D MAPBOX VIEW */}
        {viewMode === '2D' ? (
          <>
            <Map
              ref={mapRef}
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/light-v11"
              mapboxAccessToken={mapToken}
              interactiveLayerIds={['parcel-points', 'parcel-polygons']}
              onMouseMove={onHover}
              onClick={onHover}
              onMouseLeave={() => setHoverInfo(null)}
              style={{ width: '100%', height: '100%' }}
            >
              {geoData && (
                <Source type="geojson" data={geoData}>
                  {/* Status-colored 60% opacity fill */}
                  <Layer {...polygonLayerStyle} filter={['==', ['geometry-type'], 'Polygon']} />
                  {/* Matching status-colored outline so adjacent parcels merge without white borders */}
                  <Layer {...polygonOutlineStyle} filter={['==', ['geometry-type'], 'Polygon']} />
                  {/* Point circles if geometry is Point */}
                  <Layer {...pointLayerStyle} filter={['==', ['geometry-type'], 'Point']} />
                </Source>
              )}

              {hoverInfo && (
                <Popup
                  longitude={hoverInfo.longitude}
                  latitude={hoverInfo.latitude}
                  offset={[0, -10]}
                  closeButton={false}
                  className="z-50"
                  maxWidth="320px"
                >
                  <div className="p-1 text-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{
                            backgroundColor: getStatusColor(
                              hoverInfo.properties.disputeStatus,
                              hoverInfo.properties.acquisitionStatus,
                              hoverInfo.properties.possessionStatus,
                              hoverInfo.properties.disbursementStatus,
                              hoverInfo.properties.compensationStatus
                            ),
                          }}
                        ></span>
                        Parcel: {hoverInfo.properties.parcelId}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {hoverInfo.properties.landClassification || hoverInfo.properties.landType || 'Agricultural'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                      <div className="text-slate-500">Survey Number:</div>
                      <div className="font-semibold text-slate-900">{hoverInfo.properties.surveyNumber || 'N/A'}</div>
                      
                      <div className="text-slate-500">Owner:</div>
                      <div className="font-semibold text-slate-900 truncate">{hoverInfo.properties.ownerName}</div>
                      
                      <div className="text-slate-500">Area:</div>
                      <div className="font-semibold text-slate-900">{hoverInfo.properties.area || 1} Ha</div>
                      
                      <div className="text-slate-500">Acquisition:</div>
                      <div>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                          style={{
                            backgroundColor: getStatusColor(
                              hoverInfo.properties.disputeStatus,
                              hoverInfo.properties.acquisitionStatus,
                              hoverInfo.properties.possessionStatus,
                              hoverInfo.properties.disbursementStatus,
                              hoverInfo.properties.compensationStatus
                            ),
                          }}
                        >
                          {(hoverInfo.properties.acquisitionStatus || 'PROPOSED').replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-slate-500">Disbursement:</div>
                      <div className={`font-semibold ${
                        ['disbursed', 'compensation paid'].includes((hoverInfo.properties.disbursementStatus || '').toLowerCase())
                          ? 'text-emerald-600 font-bold'
                          : 'text-slate-700'
                      }`}>
                        {hoverInfo.properties.disbursementStatus || 'Pending'}
                      </div>

                      <div className="text-slate-500">Possession:</div>
                      <div className="font-semibold text-slate-700">
                        {hoverInfo.properties.possessionStatus || 'Notice Issued'}
                      </div>

                      <div className="text-slate-500">Dispute:</div>
                      <div className={`font-semibold ${hoverInfo.properties.disputeStatus === 'ACTIVE' ? 'text-rose-600' : 'text-slate-700'}`}>
                        {hoverInfo.properties.disputeStatus || 'NONE'}
                      </div>
                    </div>

                    {/* Direct 3D Model Inspector Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShow3DModal(hoverInfo);
                      }}
                      className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <BoxIcon className="w-3.5 h-3.5" />
                      View 3D Property Model ({hoverInfo.properties.landClassification || hoverInfo.properties.landType || 'Land'})
                    </button>
                  </div>
                </Popup>
              )}
            </Map>

            {/* 2D Status Legend (Solid Green 60% opacity corridor, Yellow pending, Red dispute) */}
            <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-slate-200 text-xs z-10">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Status Color Coding
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#10b981] opacity-60 border border-[#10b981]"></span>
                  <span className="text-slate-700 font-semibold">Possession Handover / Disbursed / Acquired</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#f59e0b] opacity-60 border border-[#f59e0b]"></span>
                  <span className="text-slate-700 font-semibold">Pending Compensation / Award</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#ef4444] opacity-60 border border-[#ef4444]"></span>
                  <span className="text-slate-700 font-semibold">Active Dispute / Litigation</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                Adjacent acquired polygons merge seamlessly into a single unbroken line.
              </p>
            </div>
          </>
        ) : (
          /* 3D REACT THREE FIBER CORRIDOR VIEW */
          <Corridor3DView
            features={geoData?.features || []}
            onSelectParcel={(feature) => {
              // optional callback
            }}
            onOpen3DModal={(feature) => {
              setShow3DModal(feature);
            }}
          />
        )}
      </div>

      {/* 3D Individual Property Modal */}
      {show3DModal && (
        <ThreeDPropertyModal
          parcel={show3DModal}
          onClose={() => setShow3DModal(null)}
        />
      )}
    </div>
  );
}
