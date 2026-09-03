import React, { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Source, Layer, Popup, ViewStateChangeEvent } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getProjectGeoJSON } from '../../services/parcelService';
import { MapPin, AlertCircle, RefreshCw } from 'lucide-react';

interface GisTabProps {
  projectId: string;
}

export default function GisTab({ projectId }: GisTabProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [viewState, setViewState] = useState({
    longitude: 78.9629,
    latitude: 20.5937,
    zoom: 4
  });
  
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const mapRef = useRef<MapRef>(null);

  const fetchGeoJSON = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getProjectGeoJSON(projectId);
      setGeoData(data);
      
      // Calculate center if data exists
      if (data.features && data.features.length > 0) {
        let totalLat = 0;
        let totalLng = 0;
        let count = 0;
        
        data.features.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.type === 'Point') {
            totalLng += feature.geometry.coordinates[0];
            totalLat += feature.geometry.coordinates[1];
            count++;
          }
        });
        
        if (count > 0) {
          setViewState({
            longitude: totalLng / count,
            latitude: totalLat / count,
            zoom: 12
          });
        }
      }
    } catch (err: any) {
      setError('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeoJSON();
  }, [projectId]);

  const mapToken = import.meta.env.VITE_MAPBOX_TOKEN;

  if (!mapToken) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200 shadow-sm">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">Mapbox Token Missing</h3>
        <p className="text-sm text-slate-600">Please configure VITE_MAPBOX_TOKEN in your environment variables to view the GIS map.</p>
      </div>
    );
  }

  const pointLayerStyle = {
    id: 'parcel-points',
    type: 'circle',
    paint: {
      'circle-radius': 8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      'circle-color': [
        'case',
        ['==', ['get', 'disputeStatus'], 'ACTIVE'], '#ef4444',
        ['==', ['get', 'acquisitionStatus'], 'ACQUIRED'], '#10b981',
        ['==', ['get', 'acquisitionStatus'], 'COMPLETED'], '#10b981',
        '#f59e0b'
      ]
    }
  } as any;

  const polygonLayerStyle = {
    id: 'parcel-polygons',
    type: 'fill',
    paint: {
      'fill-opacity': 0.6,
      'fill-color': [
        'case',
        ['==', ['get', 'disputeStatus'], 'ACTIVE'], '#ef4444',
        ['==', ['get', 'acquisitionStatus'], 'ACQUIRED'], '#10b981',
        ['==', ['get', 'acquisitionStatus'], 'COMPLETED'], '#10b981',
        '#f59e0b'
      ]
    }
  } as any;
  
  const polygonOutlineStyle = {
    id: 'parcel-polygons-outline',
    type: 'line',
    paint: {
      'line-color': '#ffffff',
      'line-width': 2
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ height: '600px' }}>
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between z-10">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" /> GIS Visualization
          </h2>
          <p className="text-xs text-slate-500 mt-1">Real-time parcel mapping and status tracking</p>
        </div>
        
        <button 
          onClick={fetchGeoJSON} 
          disabled={loading}
          className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="relative flex-grow w-full h-full bg-slate-100">
        {loading && !geoData && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Loading Map Data...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm">
            <div className="text-center text-rose-600">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
        
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
              <Layer {...polygonLayerStyle} filter={['==', ['geometry-type'], 'Polygon']} />
              <Layer {...polygonOutlineStyle} filter={['==', ['geometry-type'], 'Polygon']} />
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
              maxWidth="300px"
            >
              <div className="p-1">
                <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-1 mb-2">
                  Parcel: {hoverInfo.properties.parcelId}
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div className="text-slate-500">Survey No:</div>
                  <div className="font-medium text-slate-800">{hoverInfo.properties.surveyNumber}</div>
                  
                  <div className="text-slate-500">Owner:</div>
                  <div className="font-medium text-slate-800 truncate">{hoverInfo.properties.ownerName}</div>
                  
                  <div className="text-slate-500">Area (Acres):</div>
                  <div className="font-medium text-slate-800">{hoverInfo.properties.area}</div>
                  
                  <div className="text-slate-500">Compensation:</div>
                  <div className="font-medium text-slate-800">{hoverInfo.properties.compensationStatus?.replace(/_/g, ' ') || 'N/A'}</div>

                  <div className="text-slate-500">R&R Status:</div>
                  <div className="font-medium text-slate-800">{hoverInfo.properties.rnrStatus?.replace(/_/g, ' ') || 'N/A'}</div>

                  <div className="text-slate-500">Status:</div>
                  <div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                      ${hoverInfo.properties.acquisitionStatus === 'ACQUIRED' || hoverInfo.properties.acquisitionStatus === 'COMPLETED' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-blue-100 text-blue-700'}`}>
                      {hoverInfo.properties.acquisitionStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-slate-500">Dispute:</div>
                  <div className={`font-medium ${hoverInfo.properties.disputeStatus === 'ACTIVE' ? 'text-rose-600' : 'text-slate-800'}`}>
                    {hoverInfo.properties.disputeStatus}
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </Map>
        
        {/* Map Legend */}
        <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-lg border border-slate-200 text-xs z-10">
          <h4 className="font-bold text-slate-800 mb-2">Status Legend</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm border border-white"></span>
              <span className="text-slate-600 font-medium">Acquired / Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm border border-white"></span>
              <span className="text-slate-600 font-medium">Pending / Proposed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm border border-white"></span>
              <span className="text-slate-600 font-medium">Active Dispute</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
