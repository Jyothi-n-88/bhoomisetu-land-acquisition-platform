import { Request, Response } from 'express';
<<<<<<< HEAD
import mongoose from 'mongoose';
import Compensation from '../models/Compensation';
import Parcel from '../models/Parcel';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/authMiddleware';
import { syncProjectAcquiredLand } from './parcelController';
=======
import Compensation from '../models/Compensation';
import Parcel from '../models/Parcel';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9

// @desc    Create or update compensation assessment for a parcel
// @route   POST /api/compensation
// @access  Private
export const createOrUpdateCompensation = async (req: AuthRequest, res: Response) => {
  try {
    const { parcelId, projectId, assessedAmount, approvedAmount, paymentStatus } = req.body;

<<<<<<< HEAD
    let resolvedProjectId = projectId;
    if (projectId) {
      const proj = await Project.findOne({
        $or: [{ projectId }, { projectCode: projectId }, { name: projectId }],
      });
      if (proj) {
        resolvedProjectId = proj._id;
      }
    }

=======
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
    let compensation = await Compensation.findOne({ parcelId });

    if (compensation) {
      compensation.assessedAmount = assessedAmount !== undefined ? assessedAmount : compensation.assessedAmount;
      compensation.approvedAmount = approvedAmount !== undefined ? approvedAmount : compensation.approvedAmount;
<<<<<<< HEAD
      if (resolvedProjectId) compensation.projectId = resolvedProjectId;
=======
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
      if (paymentStatus) compensation.paymentStatus = paymentStatus;
      await compensation.save();
    } else {
      compensation = await Compensation.create({
        parcelId,
<<<<<<< HEAD
        projectId: resolvedProjectId,
=======
        projectId,
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
        assessedAmount: assessedAmount || 0,
        approvedAmount: approvedAmount || 0,
        paymentStatus: paymentStatus || 'PENDING',
      });
    }

    // Update parcel status to match if applicable
    if (paymentStatus === 'DISBURSED') {
<<<<<<< HEAD
      await Parcel.findByIdAndUpdate(parcelId, {
        compensationStatus: 'DISBURSED',
        disbursementStatus: 'Disbursed',
        acquisitionStatus: 'COMPENSATION_PAID',
      });
      if (projectId) {
        await syncProjectAcquiredLand(projectId);
      }
=======
      await Parcel.findByIdAndUpdate(parcelId, { compensationStatus: 'DISBURSED' });
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
    } else if (approvedAmount > 0) {
      await Parcel.findByIdAndUpdate(parcelId, { compensationStatus: 'APPROVED' });
    } else if (assessedAmount > 0) {
      await Parcel.findByIdAndUpdate(parcelId, { compensationStatus: 'ASSESSED' });
    }

    res.status(200).json({ success: true, compensation });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get compensation summary and list for a project
// @route   GET /api/compensation/project/:projectId
// @access  Private
export const getProjectCompensation = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

<<<<<<< HEAD
    let queryIds: any[] = [projectId];
    const project = await Project.findOne({
      $or: [{ projectId }, { projectCode: projectId }, { name: projectId }],
    });
    if (project) {
      queryIds = [project._id, project.projectId, projectId];
    } else if (mongoose.Types.ObjectId.isValid(projectId) && projectId.length === 24) {
      const projById = await Project.findById(projectId);
      if (projById) {
        queryIds = [projById._id, projById.projectId, projectId];
      }
    }

    let compensations = await Compensation.find({ projectId: { $in: queryIds } }).populate('parcelId', 'parcelId surveyNumber ownerName area acquisitionStatus');

    // Sync any parcels that have compensationAmount but no Compensation document yet
    const projectParcels = await Parcel.find({ projectId: { $in: queryIds } });
    for (const p of projectParcels) {
      if (p.compensationAmount && p.compensationAmount > 0) {
        const existing = compensations.find((c: any) => {
          const cId = c.parcelId?._id ? c.parcelId._id.toString() : c.parcelId?.toString();
          return cId === p._id.toString();
        });
        if (!existing) {
          try {
            const disb = (p.disbursementStatus || '').toLowerCase();
            const isDisbursed = disb === 'disbursed';
            const isEscrow = disb.includes('escrow');
            const isApproved = disb === 'approved';
            const paymentStatus = isDisbursed
              ? 'DISBURSED'
              : isEscrow
              ? 'HELD_IN_ESCROW'
              : isApproved
              ? 'APPROVED'
              : 'PENDING';

            const newComp = await Compensation.create({
              parcelId: p._id,
              projectId,
              assessedAmount: p.compensationAmount,
              approvedAmount: p.compensationAmount,
              disbursedAmount: isDisbursed ? p.compensationAmount : 0,
              paymentStatus,
            });
            const populated = await newComp.populate('parcelId', 'parcelId surveyNumber ownerName area acquisitionStatus');
            compensations.push(populated);
          } catch (createErr) {
            console.error('Error auto-syncing compensation record for parcel:', p.parcelId, createErr);
          }
        }
      }
    }
=======
    const compensations = await Compensation.find({ projectId }).populate('parcelId', 'parcelId surveyNumber ownerName area acquisitionStatus');
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9

    const summary = compensations.reduce(
      (acc, curr) => {
        acc.totalAssessed += curr.assessedAmount || 0;
        acc.totalApproved += curr.approvedAmount || 0;
        acc.totalDisbursed += curr.disbursedAmount || 0;
        return acc;
      },
      { totalAssessed: 0, totalApproved: 0, totalDisbursed: 0, totalPending: 0 }
    );
    
    summary.totalPending = summary.totalApproved - summary.totalDisbursed;

    res.status(200).json({ success: true, summary, compensations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record disbursement/payment for a parcel
// @route   PUT /api/compensation/:id/disburse
// @access  Private
export const disburseCompensation = async (req: AuthRequest, res: Response) => {
  try {
    const { disbursedAmount, bankReferenceNumber } = req.body;
    
    const compensation = await Compensation.findById(req.params.id);
    if (!compensation) {
      return res.status(404).json({ success: false, message: 'Compensation record not found' });
    }

    compensation.disbursedAmount = (compensation.disbursedAmount || 0) + Number(disbursedAmount);
    compensation.bankReferenceNumber = bankReferenceNumber;
    compensation.disbursementDate = new Date();
    
    if (compensation.disbursedAmount >= compensation.approvedAmount && compensation.approvedAmount > 0) {
      compensation.paymentStatus = 'DISBURSED';
<<<<<<< HEAD
      await Parcel.findByIdAndUpdate(compensation.parcelId, {
        compensationStatus: 'DISBURSED',
        acquisitionStatus: 'COMPENSATION_PAID',
        disbursementStatus: 'Disbursed',
      });
=======
      await Parcel.findByIdAndUpdate(compensation.parcelId, { compensationStatus: 'DISBURSED', acquisitionStatus: 'COMPENSATION_PAID' });
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
    } else {
      compensation.paymentStatus = 'PARTIALLY_PAID';
    }

    await compensation.save();

<<<<<<< HEAD
    if (compensation.projectId) {
      await syncProjectAcquiredLand(compensation.projectId);
    }

=======
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
    res.status(200).json({ success: true, compensation });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
