import { Request, Response } from 'express';
import Rnr from '../models/Rnr';
import Parcel from '../models/Parcel';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Create or update an R&R record for a parcel
// @route   POST /api/rnr
// @access  Private
export const createOrUpdateRnr = async (req: AuthRequest, res: Response) => {
  try {
    const { parcelId, projectId, affectedFamiliesCount, displacedFamiliesCount, rnrRequired, rnrStatus, resettlementSite, assistanceDetails } = req.body;

    let rnr = await Rnr.findOne({ parcelId });

    if (rnr) {
      rnr.affectedFamiliesCount = affectedFamiliesCount !== undefined ? affectedFamiliesCount : rnr.affectedFamiliesCount;
      rnr.displacedFamiliesCount = displacedFamiliesCount !== undefined ? displacedFamiliesCount : rnr.displacedFamiliesCount;
      rnr.rnrRequired = rnrRequired !== undefined ? rnrRequired : rnr.rnrRequired;
      if (rnrStatus) rnr.rnrStatus = rnrStatus;
      if (resettlementSite) rnr.resettlementSite = resettlementSite;
      if (assistanceDetails) rnr.assistanceDetails = assistanceDetails;
      await rnr.save();
    } else {
      rnr = await Rnr.create({
        parcelId,
        projectId,
        affectedFamiliesCount: affectedFamiliesCount || 0,
        displacedFamiliesCount: displacedFamiliesCount || 0,
        rnrRequired: rnrRequired || false,
        rnrStatus: rnrStatus || 'NOT_REQUIRED',
        resettlementSite,
        assistanceDetails
      });
    }

    // Map Rnr Status to Parcel rnrStatus
    const parcelStatusMap: Record<string, string> = {
      'NOT_REQUIRED': 'NOT_APPLICABLE',
      'IDENTIFIED': 'PENDING',
      'PACKAGE_APPROVED': 'IN_PROGRESS',
      'RESETTLED': 'IN_PROGRESS',
      'COMPLETED': 'COMPLETED'
    };
    
    if (parcelStatusMap[rnr.rnrStatus]) {
      await Parcel.findByIdAndUpdate(parcelId, { rnrStatus: parcelStatusMap[rnr.rnrStatus] });
    }

    res.status(200).json({ success: true, rnr });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Retrieve R&R summary and parcel cases for a project
// @route   GET /api/rnr/project/:projectId
// @access  Private
export const getProjectRnr = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    const rnrs = await Rnr.find({ projectId }).populate('parcelId', 'parcelId surveyNumber ownerName');

    const summary = rnrs.reduce(
      (acc, curr) => {
        acc.totalAffected += curr.affectedFamiliesCount || 0;
        acc.totalDisplaced += curr.displacedFamiliesCount || 0;
        if (curr.rnrStatus === 'COMPLETED') {
          acc.completedCases += 1;
        } else if (curr.rnrRequired && curr.rnrStatus !== 'NOT_REQUIRED') {
          acc.pendingCases += 1;
        }
        return acc;
      },
      { totalAffected: 0, totalDisplaced: 0, pendingCases: 0, completedCases: 0 }
    );

    res.status(200).json({ success: true, summary, rnrs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
