import { Request, Response } from 'express';
<<<<<<< HEAD
import mongoose from 'mongoose';
=======
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
import Project from '../models/Project';
import Parcel from '../models/Parcel';
import Rnr from '../models/Rnr';
import Compensation from '../models/Compensation';
import { AuthRequest } from '../middleware/authMiddleware';

<<<<<<< HEAD
/**
 * Flexible project resolver that supports looking up a project by
 * MongoDB _id or string project code (e.g. "NHAI-KA-2024-EXP-087").
 */
export const findProjectByIdOrCode = async (idOrCode: string, populateAuthorities = false) => {
  if (!idOrCode) return null;
  const str = idOrCode.trim();

  // 1. Try finding by 24-hex ObjectId if valid
  if (mongoose.Types.ObjectId.isValid(str) && str.length === 24) {
    try {
      let query = Project.findById(str);
      if (populateAuthorities) {
        query = query.populate('assignedAuthorities', 'name email role');
      }
      const proj = await query;
      if (proj) return proj;
    } catch {
      // ignore
    }
  }

  // 2. Try finding by projectId, projectCode, or name string
  try {
    let query = Project.findOne({
      $or: [{ projectId: str }, { projectCode: str }, { name: str }],
    });
    if (populateAuthorities) {
      query = query.populate('assignedAuthorities', 'name email role');
    }
    const proj = await query;
    if (proj) return proj;
  } catch {
    // ignore
  }

  return null;
};

=======
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
// @desc    Get global dashboard metrics
// @route   GET /api/projects/dashboard/metrics
// @access  Private
export const getDashboardMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const totalProjects = await Project.countDocuments({ status: { $ne: 'Completed' } });

<<<<<<< HEAD
    // Scan all parcels across all projects to ensure dynamic calculation
    const allParcels = await Parcel.find({});

    let totalAcquiredArea = 0;
    let pendingCompensationFromParcels = 0;
    let activeDisputes = 0;

    for (const p of allParcels) {
      const area = Number(p.area) || 0;
      const possession = (p.possessionStatus || '').trim().toLowerCase();
      const acq = (p.acquisitionStatus || '').trim().toLowerCase();
      const dispute = (p.disputeStatus || '').trim().toLowerCase();
      const disb = (p.disbursementStatus || '').trim().toLowerCase();
      const compStatus = (p.compensationStatus || '').trim().toLowerCase();
      const compAmount = Number(p.compensationAmount) || 0;

      // 1. Total Area Acquired Calculation:
      // Sum the area of all parcels where possessionStatus is "Possession Handover" or acquisition/disbursement indicates possession/acquisition
      const isAcquired =
        possession === 'possession handover' ||
        possession === 'possession_handover' ||
        possession === 'taken' ||
        possession.includes('handover') ||
        disb === 'disbursed' ||
        disb === 'compensation paid' ||
        compStatus === 'disbursed' ||
        ['acquired', 'completed', 'possession_handover', 'possession handover', 'compensation_paid', 'compensation paid'].includes(acq);

      if (isAcquired) {
        totalAcquiredArea += area;
      }

      // 2. Pending Compensation Calculation:
      const isDisbursed =
        disb === 'disbursed' ||
        disb === 'compensation paid' ||
        compStatus === 'disbursed' ||
        acq === 'compensation_paid' ||
        acq === 'compensation paid';

      // Scan all parcels across projects where compensation is still pending
      const isPendingCompensation =
        !isDisbursed &&
        (disb === 'pending' ||
        (!p.disbursementStatus && ['pending', 'assessed', 'approved'].includes(compStatus)) ||
        acq === 'compensation_pending');

      if (isPendingCompensation && compAmount > 0) {
        pendingCompensationFromParcels += compAmount;
      }

      // 3. Active Legal Disputes Count:
      // Count all parcels where disputeStatus is "Active Dispute" or possessionStatus is "Stayed/Litigation"
      const isDisputed =
        dispute === 'active dispute' ||
        dispute === 'active' ||
        possession === 'stayed/litigation' ||
        possession === 'stayed' ||
        possession === 'litigation';
      if (isDisputed) {
        activeDisputes += 1;
      }
    }

    // Optional fallback to Compensation collection if compensation models exist without parcel compensationAmount
    let pendingCompensationFromComp = 0;
    try {
      const compAgg = await Compensation.aggregate([
        {
          $match: {
            paymentStatus: { $ne: 'DISBURSED' },
          },
        },
        {
          $group: {
            _id: null,
            pending: {
              $sum: { $subtract: ['$assessedAmount', '$disbursedAmount'] },
            },
          },
        },
      ]);
      if (compAgg.length > 0 && compAgg[0].pending) {
        pendingCompensationFromComp = compAgg[0].pending;
      }
    } catch (e) {
      // ignore
    }

    const pendingCompensation =
      pendingCompensationFromParcels > 0
        ? pendingCompensationFromParcels
        : pendingCompensationFromComp;
=======
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
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9

    res.status(200).json({
      success: true,
      metrics: {
        totalProjects,
<<<<<<< HEAD
        totalAcquiredArea: Number(totalAcquiredArea.toFixed(2)),
=======
        totalAcquiredArea,
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
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
    const data = { ...req.body };
    if (!data.projectId && data.projectCode) {
      data.projectId = data.projectCode;
    }
    if (!data.projectCode && data.projectId) {
      data.projectCode = data.projectId;
    }
    if (data.implementingAgency && !data.department) {
      data.department = data.implementingAgency;
    }
    if (data.department && !data.implementingAgency) {
      data.implementingAgency = data.department;
    }
    if (data.totalProposedArea !== undefined && data.estimatedLandRequirement === undefined) {
      data.estimatedLandRequirement = Number(data.totalProposedArea);
    }
    if (data.estimatedLandRequirement !== undefined && data.totalProposedArea === undefined) {
      data.totalProposedArea = Number(data.estimatedLandRequirement);
    }
    if (data.sanctionedBudget !== undefined) {
      data.sanctionedBudget = Number(data.sanctionedBudget);
    }
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    const expDate = data.expectedCompletion || data.expectedCompletionDate;
    if (expDate) {
      data.expectedCompletion = new Date(expDate);
      data.expectedCompletionDate = new Date(expDate);
    }

    const project = await Project.create(data);
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
<<<<<<< HEAD
    const idOrCode = req.params.id;
    const project = await findProjectByIdOrCode(idOrCode, true);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Dynamically calculate live project-level parcel metrics across both ObjectId and string code
    const projectIds = [project._id, project.projectId, idOrCode].filter(Boolean);
    const projectParcels = await Parcel.find({ projectId: { $in: projectIds } });
    let totalAcquiredArea = 0;
    let pendingCompensation = 0;
    let activeDisputes = 0;

    for (const p of projectParcels) {
      const area = Number(p.area) || 0;
      const possession = (p.possessionStatus || '').trim().toLowerCase();
      const acq = (p.acquisitionStatus || '').trim().toLowerCase();
      const dispute = (p.disputeStatus || '').trim().toLowerCase();
      const disb = (p.disbursementStatus || '').trim().toLowerCase();
      const compStatus = (p.compensationStatus || '').trim().toLowerCase();
      const compAmount = Number(p.compensationAmount) || 0;

      // Acquired land
      const isAcquired =
        possession === 'possession handover' ||
        possession === 'possession_handover' ||
        possession === 'taken' ||
        possession.includes('handover') ||
        disb === 'disbursed' ||
        disb === 'compensation paid' ||
        compStatus === 'disbursed' ||
        ['acquired', 'completed', 'possession_handover', 'possession handover', 'compensation_paid', 'compensation paid'].includes(acq);

      if (isAcquired) {
        totalAcquiredArea += area;
      }

      // Pending compensation
      const isDisbursed =
        disb === 'disbursed' ||
        disb === 'compensation paid' ||
        compStatus === 'disbursed' ||
        acq === 'compensation_paid' ||
        acq === 'compensation paid';

      if (
        !isDisbursed &&
        (disb === 'pending' ||
        (!p.disbursementStatus && ['pending', 'assessed', 'approved'].includes(compStatus)) ||
        acq === 'compensation_pending')
      ) {
        pendingCompensation += compAmount;
      }

      // Active legal disputes
      if (
        dispute === 'active dispute' ||
        dispute === 'active' ||
        possession === 'stayed/litigation' ||
        possession === 'stayed' ||
        possession === 'litigation'
      ) {
        activeDisputes += 1;
      }
    }

    const acquiredLand = Number(totalAcquiredArea.toFixed(2));
    if (project.acquiredLand !== acquiredLand) {
      await Project.findByIdAndUpdate(project._id, { acquiredLand });
      project.acquiredLand = acquiredLand;
    }

    const projectObj = project.toObject ? project.toObject() : { ...project };
    projectObj.acquiredLand = acquiredLand;
    projectObj.pendingCompensation = pendingCompensation;
    projectObj.activeDisputes = activeDisputes;
    projectObj.parcelsCount = projectParcels.length;

    res.status(200).json({ success: true, project: projectObj });
=======
    const project = await Project.findById(req.params.id).populate('assignedAuthorities', 'name email role');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, project });
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (CENTRAL_AUTHORITY, STATE_AUTHORITY, DISTRICT_AUTHORITY)
export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
<<<<<<< HEAD
    const project = await findProjectByIdOrCode(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

=======
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
    const data = { ...req.body };
    if (!data.projectId && data.projectCode) {
      data.projectId = data.projectCode;
    }
<<<<<<< HEAD
    if (data.statutoryAct && !data.statutoryFramework) {
      data.statutoryFramework = data.statutoryAct;
    }
    if (data.stage && !data.currentStage) {
      data.currentStage = data.stage;
    }
=======
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
    if (data.implementingAgency && !data.department) {
      data.department = data.implementingAgency;
    }
    if (data.totalProposedArea !== undefined && data.estimatedLandRequirement === undefined) {
      data.estimatedLandRequirement = Number(data.totalProposedArea);
    }
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    const updateExpDate = data.expectedCompletion || data.expectedCompletionDate;
    if (updateExpDate) {
      data.expectedCompletion = new Date(updateExpDate);
      data.expectedCompletionDate = new Date(updateExpDate);
    }
<<<<<<< HEAD
    const updated = await Project.findByIdAndUpdate(project._id, data, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, project: updated });
=======
    const project = await Project.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, project });
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
<<<<<<< HEAD
// @access  Private (CENTRAL_AUTHORITY, STATE_AUTHORITY, DISTRICT_AUTHORITY)
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = await findProjectByIdOrCode(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Safely cascade deletion of all parcels, compensations, and R&R records associated with this project
    const projectIds = [project._id, project.projectId, projectId].filter(Boolean);

    // Find all parcels for this project to also remove their associated compensations & R&R records
    const projectParcels = await Parcel.find({ projectId: { $in: projectIds } });
    const parcelIds = projectParcels.map((p) => p._id);

    // Cascade delete compensation and R&R records
    await Compensation.deleteMany({
      $or: [
        { projectId: { $in: projectIds } },
        { parcelId: { $in: parcelIds } },
      ],
    });

    await Rnr.deleteMany({
      $or: [
        { projectId: { $in: projectIds } },
        { parcelId: { $in: parcelIds } },
      ],
    });

    // Cascade delete all parcels
    const deletedParcels = await Parcel.deleteMany({ projectId: { $in: projectIds } });

    // Finally delete the project document
    await Project.findByIdAndDelete(project._id);

    res.status(200).json({
      success: true,
      message: 'Project and all associated land parcels deleted successfully',
      deletedParcelsCount: deletedParcels.deletedCount,
    });
=======
// @access  Private (CENTRAL_AUTHORITY)
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
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
<<<<<<< HEAD
    const project = await findProjectByIdOrCode(projectId);
=======
    const project = await Project.findById(projectId);
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

<<<<<<< HEAD
    const projectIds = [project._id, project.projectId, projectId].filter(Boolean);
    const projectParcels = await Parcel.find({ projectId: { $in: projectIds } });
    let pendingCompensation = 0;
    let pendingCompensationAmount = 0;
    let activeDisputes = 0;
    let pendingPossession = 0;

    for (const p of projectParcels) {
      const possession = (p.possessionStatus || '').trim().toLowerCase();
      const acq = (p.acquisitionStatus || '').trim().toLowerCase();
      const dispute = (p.disputeStatus || '').trim().toLowerCase();
      const disb = (p.disbursementStatus || '').trim().toLowerCase();
      const compStatus = (p.compensationStatus || '').trim().toLowerCase();
      const compAmount = Number(p.compensationAmount) || 0;

      const isDisbursed =
        disb === 'disbursed' ||
        disb === 'compensation paid' ||
        compStatus === 'disbursed' ||
        acq === 'compensation_paid' ||
        acq === 'compensation paid';

      // Pending compensation
      if (
        !isDisbursed &&
        (disb === 'pending' ||
        (!p.disbursementStatus && ['pending', 'assessed', 'approved'].includes(compStatus)) ||
        acq === 'compensation_pending')
      ) {
        pendingCompensation++;
        pendingCompensationAmount += compAmount;
      }

      // Active legal disputes
      if (
        dispute === 'active dispute' ||
        dispute === 'active' ||
        possession === 'stayed/litigation' ||
        possession === 'stayed' ||
        possession === 'litigation'
      ) {
        activeDisputes++;
      }

      // Pending possession
      const isPossessedOrAcquired =
        possession === 'possession handover' ||
        possession === 'possession_handover' ||
        possession === 'taken' ||
        possession.includes('handover') ||
        isDisbursed ||
        ['acquired', 'completed', 'possession_handover', 'possession handover', 'compensation_paid', 'compensation paid'].includes(acq);

      if (!isPossessedOrAcquired) {
        pendingPossession++;
      }
    }

=======
    const pendingCompensation = await Parcel.countDocuments({ projectId, acquisitionStatus: 'COMPENSATION_PENDING' });
    const activeDisputes = await Parcel.countDocuments({ projectId, disputeStatus: 'ACTIVE' });
    const pendingPossession = await Parcel.countDocuments({ projectId, acquisitionStatus: 'POSSESSION_PENDING' });
    
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
    const rnrDocs = await Rnr.find({ projectId, rnrStatus: { $in: ['IDENTIFIED', 'PACKAGE_APPROVED', 'PENDING', 'IN_PROGRESS'] } });
    const pendingRnr = rnrDocs.reduce((acc, rnr) => acc + (rnr.affectedFamiliesCount || 0), 0);

    res.status(200).json({ 
      success: true, 
      blockers: {
        pendingCompensation,
<<<<<<< HEAD
        pendingCompensationAmount,
=======
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
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
