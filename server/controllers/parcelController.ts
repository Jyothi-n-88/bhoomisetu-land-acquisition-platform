import { Request, Response } from 'express';
import Parcel from '../models/Parcel';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Create a new land parcel
// @route   POST /api/parcels
// @access  Private (CENTRAL_AUTHORITY, STATE_AUTHORITY, DISTRICT_AUTHORITY, FIELD_OFFICER)
export const createParcel = async (req: AuthRequest, res: Response) => {
  try {
    const parcelData = { ...req.body };

    // 1. Parse GeoJSON Coordinates Polygon if provided as string
    let polygonInput =
      parcelData.geoJsonPolygon ??
      parcelData.polygonCoordinates ??
      parcelData.geometry ??
      parcelData.coordinates;

    if (typeof polygonInput === 'string' && polygonInput.trim()) {
      try {
        polygonInput = JSON.parse(polygonInput.trim());
      } catch (parseError: any) {
        return res.status(400).json({
          success: false,
          message: `Invalid GeoJSON Coordinates Polygon format: ${parseError.message}. Please provide a valid JSON array of coordinate pairs (e.g. [[lat, lng], [lat, lng]]).`,
        });
      }
    }

    // Process polygon coordinates if valid array
    if (Array.isArray(polygonInput) && polygonInput.length > 0) {
      let ring: any[] = [];
      // If 2D array: [[c1, c2], [c1, c2], ...]
      if (Array.isArray(polygonInput[0]) && typeof polygonInput[0][0] === 'number') {
        ring = polygonInput.map((pt: any[]) => [Number(pt[0]), Number(pt[1])]);
      } else if (Array.isArray(polygonInput[0]) && Array.isArray(polygonInput[0][0])) {
        // If 3D array: [[[c1, c2], ...]]
        ring = polygonInput[0].map((pt: any[]) => [Number(pt[0]), Number(pt[1])]);
      }

      if (ring.length >= 3) {
        // Ensure polygon ring is closed (first and last vertex must match)
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          ring.push([...first]);
        }

        // Standard GeoJSON coordinates format is [longitude, latitude]
        // Check if user entered [lat, lng] as prompted in example "[[lat, lng], [lat, lng]]"
        let geoJsonRing = ring;
        const testPoint = ring[0];
        // In India (lat: ~8-37, lng: ~68-98)
        if (testPoint[0] < 45 && testPoint[1] > 50) {
          // Input was [lat, lng] -> convert to standard GeoJSON [lng, lat]
          geoJsonRing = ring.map((pt) => [pt[1], pt[0]]);
        }

        parcelData.geometry = {
          type: 'Polygon',
          coordinates: [geoJsonRing],
        };

        // Compute centroid for fallback latitude & longitude
        let sumLng = 0;
        let sumLat = 0;
        geoJsonRing.forEach((pt: number[]) => {
          sumLng += pt[0];
          sumLat += pt[1];
        });
        parcelData.longitude = Number((sumLng / geoJsonRing.length).toFixed(6));
        parcelData.latitude = Number((sumLat / geoJsonRing.length).toFixed(6));
      } else {
        return res.status(400).json({
          success: false,
          message: 'GeoJSON Polygon must contain at least 3 distinct coordinate pairs.',
        });
      }
    }

    // Clean numeric conversions
    if (parcelData.area !== undefined) {
      parcelData.area = Number(parcelData.area);
    }
    if (parcelData.compensationAmount !== undefined) {
      parcelData.compensationAmount = Number(parcelData.compensationAmount);
    }

    // Sync compensation status based on disbursementStatus
    if (parcelData.disbursementStatus) {
      if (parcelData.disbursementStatus === 'Disbursed') {
        parcelData.compensationStatus = 'DISBURSED';
      } else if (parcelData.disbursementStatus === 'Held in Escrow') {
        parcelData.compensationStatus = 'APPROVED';
      } else {
        parcelData.compensationStatus = 'PENDING';
      }
    }

    // Sync acquisition and dispute statuses based on possessionStatus
    if (parcelData.possessionStatus === 'Possession Handover') {
      parcelData.acquisitionStatus = 'ACQUIRED';
    } else if (parcelData.possessionStatus === 'Stayed/Litigation') {
      parcelData.disputeStatus = 'Active Dispute';
    }

    const parcel = await Parcel.create(parcelData);

    // Optionally update project acquired land if ACQUIRED
    if (parcel.acquisitionStatus === 'ACQUIRED' || parcel.acquisitionStatus === 'COMPLETED') {
      await Project.findByIdAndUpdate(parcel.projectId, {
        $inc: { acquiredLand: parcel.area },
      });
    }

    res.status(201).json({ success: true, parcel });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Parcel ID already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all land parcels (with query filtering)
// @route   GET /api/parcels
// @access  Private
export const getParcels = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, status, disputeStatus } = req.query;

    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (status) filter.acquisitionStatus = status;
    if (disputeStatus) filter.disputeStatus = disputeStatus;

    const parcels = await Parcel.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, parcels });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single land parcel
// @route   GET /api/parcels/:id
// @access  Private
export const getParcel = async (req: AuthRequest, res: Response) => {
  try {
    const parcel = await Parcel.findById(req.params.id).populate('projectId', 'name projectId');
    if (!parcel) {
      return res.status(404).json({ success: false, message: 'Parcel not found' });
    }
    res.status(200).json({ success: true, parcel });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update land parcel
// @route   PUT /api/parcels/:id
// @access  Private (CENTRAL_AUTHORITY, STATE_AUTHORITY, DISTRICT_AUTHORITY, FIELD_OFFICER)
export const updateParcel = async (req: AuthRequest, res: Response) => {
  try {
    const originalParcel = await Parcel.findById(req.params.id);
    if (!originalParcel) {
      return res.status(404).json({ success: false, message: 'Parcel not found' });
    }

    const updateData = { ...req.body };

    // Handle polygon textarea string if provided during update
    let polygonInput =
      updateData.geoJsonPolygon ??
      updateData.polygonCoordinates ??
      updateData.geometry ??
      updateData.coordinates;

    if (typeof polygonInput === 'string' && polygonInput.trim()) {
      try {
        polygonInput = JSON.parse(polygonInput.trim());
      } catch (parseError: any) {
        return res.status(400).json({
          success: false,
          message: `Invalid GeoJSON Coordinates Polygon format: ${parseError.message}`,
        });
      }
    }

    if (Array.isArray(polygonInput) && polygonInput.length > 0) {
      let ring: any[] = [];
      if (Array.isArray(polygonInput[0]) && typeof polygonInput[0][0] === 'number') {
        ring = polygonInput.map((pt: any[]) => [Number(pt[0]), Number(pt[1])]);
      } else if (Array.isArray(polygonInput[0]) && Array.isArray(polygonInput[0][0])) {
        ring = polygonInput[0].map((pt: any[]) => [Number(pt[0]), Number(pt[1])]);
      }

      if (ring.length >= 3) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          ring.push([...first]);
        }
        let geoJsonRing = ring;
        if (ring[0][0] < 45 && ring[0][1] > 50) {
          geoJsonRing = ring.map((pt) => [pt[1], pt[0]]);
        }
        updateData.geometry = {
          type: 'Polygon',
          coordinates: [geoJsonRing],
        };
      }
    }

    const updatedParcel = await Parcel.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // Handle area changes for ACQUIRED parcels
    const wasAcquired =
      originalParcel.acquisitionStatus === 'ACQUIRED' || originalParcel.acquisitionStatus === 'COMPLETED';
    const isAcquired =
      updatedParcel?.acquisitionStatus === 'ACQUIRED' || updatedParcel?.acquisitionStatus === 'COMPLETED';

    let areaDiff = 0;
    if (!wasAcquired && isAcquired) {
      areaDiff = updatedParcel?.area || 0;
    } else if (wasAcquired && !isAcquired) {
      areaDiff = -(originalParcel.area || 0);
    } else if (wasAcquired && isAcquired && originalParcel.area !== updatedParcel?.area) {
      areaDiff = (updatedParcel?.area || 0) - (originalParcel.area || 0);
    }

    if (areaDiff !== 0 && updatedParcel) {
      await Project.findByIdAndUpdate(updatedParcel.projectId, {
        $inc: { acquiredLand: areaDiff },
      });
    }

    res.status(200).json({ success: true, parcel: updatedParcel });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete land parcel
// @route   DELETE /api/parcels/:id
// @access  Private (CENTRAL_AUTHORITY, STATE_AUTHORITY)
export const deleteParcel = async (req: AuthRequest, res: Response) => {
  try {
    const parcel = await Parcel.findByIdAndDelete(req.params.id);
    if (!parcel) {
      return res.status(404).json({ success: false, message: 'Parcel not found' });
    }

    // Rollback acquired land if necessary
    if (parcel.acquisitionStatus === 'ACQUIRED' || parcel.acquisitionStatus === 'COMPLETED') {
      await Project.findByIdAndUpdate(parcel.projectId, {
        $inc: { acquiredLand: -(parcel.area || 0) },
      });
    }

    res.status(200).json({ success: true, message: 'Parcel deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update parcel workflow status
// @route   PUT /api/parcels/:id/workflow
// @access  Private (CENTRAL_AUTHORITY, STATE_AUTHORITY, DISTRICT_AUTHORITY, FIELD_OFFICER)
export const updateParcelWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const { acquisitionStatus } = req.body;

    if (!acquisitionStatus) {
      return res.status(400).json({ success: false, message: 'acquisitionStatus is required' });
    }

    const originalParcel = await Parcel.findById(req.params.id);
    if (!originalParcel) {
      return res.status(404).json({ success: false, message: 'Parcel not found' });
    }

    const updatedParcel = await Parcel.findByIdAndUpdate(
      req.params.id,
      { acquisitionStatus },
      {
        new: true,
        runValidators: true,
      }
    );

    // Handle area changes for ACQUIRED parcels
    const wasAcquired =
      originalParcel.acquisitionStatus === 'ACQUIRED' || originalParcel.acquisitionStatus === 'COMPLETED';
    const isAcquired =
      updatedParcel?.acquisitionStatus === 'ACQUIRED' || updatedParcel?.acquisitionStatus === 'COMPLETED';

    let areaDiff = 0;
    if (!wasAcquired && isAcquired) {
      areaDiff = updatedParcel?.area || 0;
    } else if (wasAcquired && !isAcquired) {
      areaDiff = -(originalParcel.area || 0);
    } else if (wasAcquired && isAcquired && originalParcel.area !== updatedParcel?.area) {
      areaDiff = (updatedParcel?.area || 0) - (originalParcel.area || 0);
    }

    if (areaDiff !== 0 && updatedParcel) {
      await Project.findByIdAndUpdate(updatedParcel.projectId, {
        $inc: { acquiredLand: areaDiff },
      });
    }

    res.status(200).json({ success: true, parcel: updatedParcel });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get GeoJSON representation of parcels for a project
// @route   GET /api/parcels/project/:projectId/geojson
// @access  Private
export const getProjectGeoJSON = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const parcels = await Parcel.find({ projectId });

    const features = parcels.map((parcel) => {
      let geometry = parcel.geometry;

      const lng = parcel.longitude || 78.9629;
      const lat = parcel.latitude || 20.5937;

      // If geometry is missing or a point, synthesize a corridor polygon footprint
      if (
        !geometry ||
        !geometry.coordinates ||
        geometry.coordinates.length === 0 ||
        geometry.type === 'Point'
      ) {
        const areaSize = parcel.area || 1;
        const deltaLng = Math.max(0.0006, Math.min(0.0025, Math.sqrt(areaSize) * 0.0008));
        const deltaLat = deltaLng * 0.55;

        geometry = {
          type: 'Polygon',
          coordinates: [
            [
              [lng - deltaLng, lat - deltaLat],
              [lng + deltaLng, lat - deltaLat],
              [lng + deltaLng, lat + deltaLat],
              [lng - deltaLng, lat + deltaLat],
              [lng - deltaLng, lat - deltaLat],
            ],
          ],
        } as any;
      }

      return {
        type: 'Feature',
        geometry,
        properties: {
          id: parcel._id,
          parcelId: parcel.parcelId,
          surveyNumber: parcel.surveyNumber,
          ownerName: parcel.ownerName,
          ownerContact: parcel.ownerContact,
          area: parcel.area,
          compensationAmount: parcel.compensationAmount || 0,
          disbursementStatus: parcel.disbursementStatus || 'Pending',
          landType: parcel.landType || 'Agricultural',
          landClassification: parcel.landType || 'Agricultural',
          acquisitionStatus: parcel.acquisitionStatus,
          possessionStatus: parcel.possessionStatus || 'Notice Issued',
          compensationStatus: parcel.compensationStatus,
          rnrStatus: parcel.rnrStatus,
          disputeStatus: parcel.disputeStatus,
          has3DBuilding: parcel.has3DBuilding,
          affectedFloor: parcel.affectedFloor,
          longitude: lng,
          latitude: lat,
        },
      };
    });

    const featureCollection = {
      type: 'FeatureCollection',
      features,
    };

    res.status(200).json(featureCollection);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
