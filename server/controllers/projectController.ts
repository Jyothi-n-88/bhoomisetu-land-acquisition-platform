import { Request, Response } from 'express';
import Project from '../models/Project';
import Parcel from '../models/Parcel';
import Rnr from '../models/Rnr';
import Compensation from '../models/Compensation';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get global dashboard metrics
// @route   GET /api/projects/dashboard/metrics
// @access  Private
export const getDashboardMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const totalProjects = await Project.countDocuments({ status: { $ne: 'Completed' } });

    const parcelAgg = await Parcel.aggregate([
      {
        $group: {
          _id: null,
          totalAcquiredArea: {
            $sum: {
              $cond: [
                { $in: ['$acquisitionStatus', ['ACQUIRED', 'COMPLETED', 'POSSESSION_PENDING']] },
                '$area',
                0,
              ],
            },
          },
          activeDisputes: {
            $sum: { $cond: [{ $eq: ['$disputeStatus', 'ACTIVE'] }, 1, 0] },
          },
        },
      },
    ]);

    const compAgg = await Compensation.aggregate([
      {
        $match: {
          paymentStatus: { $ne: 'DISBURSED' },
        },
      },
      {
        $group: {
          _id: null,
          pendingCompensation: {
            $sum: { $subtract: ['$assessedAmount', '$disbursedAmount'] },
          },
        },
      },
    ]);

    const totalAcquiredArea = parcelAgg.length > 0 ? parcelAgg[0].totalAcquiredArea : 0;
    const activeDisputes = parcelAgg.length > 0 ? parcelAgg[0].activeDisputes : 0;
    const pendingCompensation = compAgg.length > 0 ? compAgg[0].pendingCompensation : 0;

    res.status(200).json({
      success: true,
      metrics: {
        totalProjects,
        totalAcquiredArea,
        pendingCompensation,
        activeDisputes,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (CENTRAL_AUTHORITY, STATE_AUTHORITY)
export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, project });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Project ID already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, projects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id).populate('assignedAuthorities', 'name email role');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (CENTRAL_AUTHORITY, STATE_AUTHORITY, DISTRICT_AUTHORITY)
export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, project });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (CENTRAL_AUTHORITY)
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get project blockers summary
// @route   GET /api/projects/:id/blockers
// @access  Private
export const getProjectBlockers = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const pendingCompensation = await Parcel.countDocuments({ projectId, acquisitionStatus: 'COMPENSATION_PENDING' });
    const activeDisputes = await Parcel.countDocuments({ projectId, disputeStatus: 'ACTIVE' });
    const pendingPossession = await Parcel.countDocuments({ projectId, acquisitionStatus: 'POSSESSION_PENDING' });
    
    const rnrDocs = await Rnr.find({ projectId, rnrStatus: { $in: ['IDENTIFIED', 'PACKAGE_APPROVED', 'PENDING', 'IN_PROGRESS'] } });
    const pendingRnr = rnrDocs.reduce((acc, rnr) => acc + (rnr.affectedFamiliesCount || 0), 0);

    res.status(200).json({ 
      success: true, 
      blockers: {
        pendingCompensation,
        activeDisputes,
        pendingRnr,
        pendingPossession,
        total: pendingCompensation + activeDisputes + pendingRnr + pendingPossession
      } 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
