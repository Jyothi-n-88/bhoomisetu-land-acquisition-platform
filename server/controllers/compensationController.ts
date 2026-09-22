import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Compensation from '../models/Compensation';
import Parcel from '../models/Parcel';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/authMiddleware';
import { syncProjectAcquiredLand } from './parcelController';
import { calculateRfctlarrCompensation, RfctlarrInput } from '../utils/rfctlarrCalculator';

// @desc    Calculate statutory RFCTLARR award preview without saving
// @route   POST /api/compensation/calculate-award
// @access  Private
export const calculateAwardPreview = async (req: AuthRequest, res: Response) => {
  try {
    const { baseMarketRate, areaInAcres, isRural, multiplierFactor, assetsValue, yearsFromNotification, parcelId } = req.body;

    let targetArea = areaInAcres !== undefined ? Number(areaInAcres) : undefined;
    let targetIsRural = isRural !== undefined ? Boolean(isRural) : undefined;

    if (parcelId && (targetArea === undefined || targetIsRural === undefined)) {
      const parcel = await Parcel.findById(parcelId);
      if (parcel) {
        if (targetArea === undefined && parcel.area) {
          targetArea = Number((Number(parcel.area) * 2.47105).toFixed(4));
        }
        if (targetIsRural === undefined) {
          targetIsRural = ['Agricultural', 'Forest'].includes(parcel.landType || '');
        }
      }
    }

    const breakdown = calculateRfctlarrCompensation({
      baseMarketRate: Number(baseMarketRate) || 0,
      areaInAcres: targetArea || 1,
      isRural: targetIsRural ?? false,
      multiplierFactor: multiplierFactor !== undefined ? Number(multiplierFactor) : undefined,
      assetsValue: assetsValue !== undefined ? Number(assetsValue) : 0,
      yearsFromNotification: yearsFromNotification !== undefined ? Number(yearsFromNotification) : 1,
    });

    res.status(200).json({ success: true, breakdown });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create or update compensation assessment for a parcel
// @route   POST /api/compensation
// @access  Private
export const createOrUpdateCompensation = async (req: AuthRequest, res: Response) => {
  try {
    const {
      parcelId,
      projectId,
      assessedAmount,
      approvedAmount,
      paymentStatus,
      baseMarketRate,
      areaInAcres,
      isRural,
      multiplierFactor,
      assetsValue,
      yearsFromNotification,
      calculateRfctlarr,
    } = req.body;

    let resolvedProjectId = projectId;
    if (projectId) {
      const proj = await Project.findOne({
        $or: [{ projectId }, { projectCode: projectId }, { name: projectId }],
      });
      if (proj) {
        resolvedProjectId = proj._id;
      }
    }

    // Check if RFCTLARR automated calculation should be triggered
    let finalAssessed = assessedAmount !== undefined ? Number(assessedAmount) : undefined;
    let finalApproved = approvedAmount !== undefined ? Number(approvedAmount) : undefined;
    let rfctlarrData: any = {};

    const shouldCalculate = calculateRfctlarr || (baseMarketRate !== undefined && baseMarketRate !== null && baseMarketRate !== '');
    if (shouldCalculate) {
      const parcel = await Parcel.findById(parcelId);

      let calcArea = areaInAcres !== undefined ? Number(areaInAcres) : undefined;
      if (calcArea === undefined && parcel?.area) {
        // Convert hectares to acres (1 ha = 2.47105 acres)
        calcArea = Number((Number(parcel.area) * 2.47105).toFixed(4));
      }

      let calcRural = isRural !== undefined ? Boolean(isRural) : undefined;
      if (calcRural === undefined && parcel) {
        calcRural = ['Agricultural', 'Forest'].includes(parcel.landType || '');
      }

      const breakdown = calculateRfctlarrCompensation({
        baseMarketRate: Number(baseMarketRate) || 0,
        areaInAcres: calcArea || 1,
        isRural: calcRural ?? false,
        multiplierFactor: multiplierFactor !== undefined ? Number(multiplierFactor) : undefined,
        assetsValue: assetsValue !== undefined ? Number(assetsValue) : 0,
        yearsFromNotification: yearsFromNotification !== undefined ? Number(yearsFromNotification) : 1,
      });

      finalAssessed = breakdown.totalCompensationAward;
      if (finalApproved === undefined) {
        finalApproved = breakdown.totalCompensationAward;
      }

      rfctlarrData = {
        baseMarketRate: breakdown.baseMarketRate,
        areaInAcres: breakdown.areaInAcres,
        isRural: breakdown.isRural,
        multiplierFactor: breakdown.multiplierFactor,
        assetsValue: breakdown.assetsValue,
        solatiumAmount: breakdown.solatium,
        additionalMarketValue: breakdown.additionalMarketValue,
        calculationBreakdown: breakdown,
      };

      // Also update the parcel's compensation amount
      await Parcel.findByIdAndUpdate(parcelId, { compensationAmount: finalAssessed });
    }

    let compensation = await Compensation.findOne({ parcelId });

    if (compensation) {
      if (finalAssessed !== undefined) compensation.assessedAmount = finalAssessed;
      if (finalApproved !== undefined) compensation.approvedAmount = finalApproved;
      if (resolvedProjectId) compensation.projectId = resolvedProjectId;
      if (paymentStatus) compensation.paymentStatus = paymentStatus;

      // Assign statutory RFCTLARR fields if computed
      if (Object.keys(rfctlarrData).length > 0) {
        Object.assign(compensation, rfctlarrData);
      }

      await compensation.save();
    } else {
      compensation = await Compensation.create({
        parcelId,
        projectId: resolvedProjectId,
        assessedAmount: finalAssessed || 0,
        approvedAmount: finalApproved || 0,
        paymentStatus: paymentStatus || 'PENDING',
        ...rfctlarrData,
      });
    }

    // Update parcel status to match if applicable
    if (paymentStatus === 'DISBURSED') {
      await Parcel.findByIdAndUpdate(parcelId, {
        compensationStatus: 'DISBURSED',
        disbursementStatus: 'Disbursed',
        acquisitionStatus: 'COMPENSATION_PAID',
      });
      if (projectId) {
        await syncProjectAcquiredLand(projectId);
      }
    } else if ((finalApproved || 0) > 0) {
      await Parcel.findByIdAndUpdate(parcelId, { compensationStatus: 'APPROVED' });
    } else if ((finalAssessed || 0) > 0) {
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
      await Parcel.findByIdAndUpdate(compensation.parcelId, {
        compensationStatus: 'DISBURSED',
        acquisitionStatus: 'COMPENSATION_PAID',
        disbursementStatus: 'Disbursed',
      });
    } else {
      compensation.paymentStatus = 'PARTIALLY_PAID';
    }

    await compensation.save();

    if (compensation.projectId) {
      await syncProjectAcquiredLand(compensation.projectId);
    }

    res.status(200).json({ success: true, compensation });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
