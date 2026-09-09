import { Request, Response } from 'express';
import Parcel from '../models/Parcel';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Create a new land parcel
// @route   POST /api/parcels
// @access  Private (CENTRAL_AUTHORITY, STATE_AUTHORITY, DISTRICT_AUTHORITY, FIELD_OFFICER)
export const createParcel = async (req: AuthRequest, res: Response) => {
  try {
    const parcel = await Parcel.create(req.body);
    
    // Optionally update project acquired land if ACQUIRED
    if (parcel.acquisitionStatus === 'ACQUIRED' || parcel.acquisitionStatus === 'COMPLETED') {
      await Project.findByIdAndUpdate(parcel.projectId, {
        $inc: { acquiredLand: parcel.area }
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

    const updatedParcel = await Parcel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Handle area changes for ACQUIRED parcels
    const wasAcquired = originalParcel.acquisitionStatus === 'ACQUIRED' || originalParcel.acquisitionStatus === 'COMPLETED';
    const isAcquired = updatedParcel?.acquisitionStatus === 'ACQUIRED' || updatedParcel?.acquisitionStatus === 'COMPLETED';
    
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
        $inc: { acquiredLand: areaDiff }
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
        $inc: { acquiredLand: -(parcel.area || 0) }
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

    const updatedParcel = await Parcel.findByIdAndUpdate(req.params.id, { acquisitionStatus }, {
      new: true,
      runValidators: true,
    });

    // Handle area changes for ACQUIRED parcels
    const wasAcquired = originalParcel.acquisitionStatus === 'ACQUIRED' || originalParcel.acquisitionStatus === 'COMPLETED';
    const isAcquired = updatedParcel?.acquisitionStatus === 'ACQUIRED' || updatedParcel?.acquisitionStatus === 'COMPLETED';
    
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
        $inc: { acquiredLand: areaDiff }
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
    
    const features = parcels.map(parcel => {
      let geometry = parcel.geometry;
      
      if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
        geometry = {
          type: 'Point',
          coordinates: [parcel.longitude || 0, parcel.latitude || 0]
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
          area: parcel.area,
          acquisitionStatus: parcel.acquisitionStatus,
          compensationStatus: parcel.compensationStatus,
          rnrStatus: parcel.rnrStatus,
          disputeStatus: parcel.disputeStatus,
          has3DBuilding: parcel.has3DBuilding,
          affectedFloor: parcel.affectedFloor
        }
      };
    });

    const featureCollection = {
      type: 'FeatureCollection',
      features
    };

    res.status(200).json(featureCollection);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
