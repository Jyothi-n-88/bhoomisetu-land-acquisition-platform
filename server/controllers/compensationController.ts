import { Request, Response } from 'express';
import Compensation from '../models/Compensation';
import Parcel from '../models/Parcel';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

// @desc    Create or update compensation assessment for a parcel
// @route   POST /api/compensation
// @access  Private
export const createOrUpdateCompensation = async (req: AuthRequest, res: Response) => {
  try {
    const { parcelId, projectId, assessedAmount, approvedAmount, paymentStatus } = req.body;

    let compensation = await Compensation.findOne({ parcelId });

    if (compensation) {
      compensation.assessedAmount = assessedAmount !== undefined ? assessedAmount : compensation.assessedAmount;
      compensation.approvedAmount = approvedAmount !== undefined ? approvedAmount : compensation.approvedAmount;
      if (paymentStatus) compensation.paymentStatus = paymentStatus;
      await compensation.save();
    } else {
      compensation = await Compensation.create({
        parcelId,
        projectId,
        assessedAmount: assessedAmount || 0,
        approvedAmount: approvedAmount || 0,
        paymentStatus: paymentStatus || 'PENDING',
      });
    }

    // Update parcel status to match if applicable
    if (paymentStatus === 'DISBURSED') {
      await Parcel.findByIdAndUpdate(parcelId, { compensationStatus: 'DISBURSED' });
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

    const compensations = await Compensation.find({ projectId }).populate('parcelId', 'parcelId surveyNumber ownerName area acquisitionStatus');

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
      await Parcel.findByIdAndUpdate(compensation.parcelId, { compensationStatus: 'DISBURSED', acquisitionStatus: 'COMPENSATION_PAID' });
    } else {
      compensation.paymentStatus = 'PARTIALLY_PAID';
    }

    await compensation.save();

    res.status(200).json({ success: true, compensation });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
