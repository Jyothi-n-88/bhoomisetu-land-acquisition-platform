import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Project from '../models/Project';
import Parcel from '../models/Parcel';
import Compensation from '../models/Compensation';
import Rnr from '../models/Rnr';
import { GoogleGenAI } from '@google/genai';

interface IProjectDoc {
  name: string;
  projectType: string;
  state: string;
  district: string;
  status: string;
  projectId?: string;
}

interface IParcelDoc {
  acquisitionStatus: string;
  disputeStatus: string;
  area: number;
  parcelId: string;
  surveyNumber: string;
  ownerName: string;
  landType: string;
}

interface ICompensationDoc {
  assessedAmount: number;
  disbursedAmount: number;
}

interface IRnrDoc {
  familiesAffected: number;
  familiesDisplaced: number;
  rnrStatus: string;
}

const generateAiInsights = async (project: IProjectDoc, parcels: IParcelDoc[], compensations: ICompensationDoc[], rnrs: IRnrDoc[]) => {
  const totalParcels = parcels.length;
  const acquiredParcels = parcels.filter((p) => p.acquisitionStatus === 'ACQUIRED' || p.acquisitionStatus === 'COMPLETED').length;
  const activeDisputes = parcels.filter((p) => p.disputeStatus === 'ACTIVE').length;
  const totalArea = parcels.reduce((sum, p) => sum + (p.area || 0), 0);
  const totalAssessed = compensations.reduce((sum, c) => sum + (c.assessedAmount || 0), 0);
  const totalDisbursed = compensations.reduce((sum, c) => sum + (c.disbursedAmount || 0), 0);
  const pendingCompensation = totalAssessed - totalDisbursed;
  const totalRnrFamilies = rnrs.reduce((sum, r) => sum + (r.familiesAffected || 0), 0);
  const displacedFamilies = rnrs.reduce((sum, r) => sum + (r.familiesDisplaced || 0), 0);
  const rnrPending = rnrs.filter((r) => r.rnrStatus !== 'COMPLETED').length;

  const promptText = `
    You are an expert AI Administrative Advisor for the BhoomiSetu Land Acquisition System (Govt. of India).
    Analyze the following project data and provide a concise, professional Decision Support Report.
    Project Name: ${project.name}
    Project Type: ${project.projectType}
    State/District: ${project.state}, ${project.district}
    Overall Status: ${project.status}

    Land Metrics:
    - Total Parcels: ${totalParcels}
    - Acquired/Completed Parcels: ${acquiredParcels}
    - Active Legal Disputes: ${activeDisputes}
    - Total Area Tracked: ${totalArea} acres

    Financials:
    - Total Assessed Compensation: ₹${totalAssessed}
    - Total Disbursed: ₹${totalDisbursed}
    - Pending Compensation: ₹${pendingCompensation}

    Resettlement & Rehabilitation (R&R):
    - Total Families Affected: ${totalRnrFamilies}
    - Total Families Displaced: ${displacedFamilies}
    - Parcels with Pending R&R: ${rnrPending}

    Provide your response strictly in the following JSON format without any markdown wrappers (like JSON block):
    {
      "executiveSummary": "A 2-3 sentence overview of project health.",
      "criticalRiskFactors": ["Risk 1", "Risk 2"],
      "recommendedActions": ["Action 1", "Action 2", "Action 3"]
    }
  `;

  let aiResponse;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const interaction = await ai.interactions.create({
        model: 'gemini-3.6-flash',
        input: promptText,
        generation_config: {
          temperature: 0.2,
        }
      });
      const rawText = interaction.output_text || "{}";
      const cleanedText = rawText.replace(/JSON block/g, '').replace(/\`\`\`/g, '').trim();
      aiResponse = JSON.parse(cleanedText);
    } catch (geminiError) {
      console.error('Gemini API Error:', geminiError);
    }
  }

  if (!aiResponse) {
    const risks = [];
    const actions = [];
          
    if (activeDisputes > 0) {
      risks.push(`There are ${activeDisputes} active legal disputes delaying acquisition.`);
      actions.push('Escalate active dispute cases to the district magistrate for mediation.');
    }
    if (pendingCompensation > 0) {
      risks.push(`₹${pendingCompensation} in compensation remains pending for disbursement.`);
      actions.push('Expedite the disbursement of pending compensation to affected landowners.');
    }
    if (rnrPending > 0) {
      risks.push(`R&R procedures are pending for ${rnrPending} land parcels.`);
      actions.push('Fast-track the rehabilitation packages for displaced families.');
    }
    if (risks.length === 0) risks.push("No major critical risks identified at the current stage.");
    if (actions.length === 0) actions.push("Continue monitoring standard acquisition workflow.");
    
    aiResponse = {
      executiveSummary: `The ${project.name} project is currently in the '${project.status}' phase. ${acquiredParcels} out of ${totalParcels} parcels have been acquired.`,
      criticalRiskFactors: risks,
      recommendedActions: actions
    };
  }
  return aiResponse;
};

// @desc    Analyze Project Health and generate Insights
// @route   POST /api/ai/project/:projectId/analyze
// @access  Private (Admin/Authority)
export const analyzeProjectHealth = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const parcels = await Parcel.find({ projectId });
    const compensations = await Compensation.find({ projectId });
    const rnrs = await Rnr.find({ projectId });

    const aiResponse = await generateAiInsights(project, parcels, compensations, rnrs);
    res.status(200).json({ success: true, data: aiResponse });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export Official Project Report
// @route   GET /api/ai/project/:projectId/export-report
// @access  Private (Admin/Authority)
export const exportProjectReport = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const parcels = await Parcel.find({ projectId });
    const compensations = await Compensation.find({ projectId });
    const rnrs = await Rnr.find({ projectId });

    const totalParcels = parcels.length;
    const acquiredParcels = parcels.filter((p) => p.acquisitionStatus === 'ACQUIRED' || p.acquisitionStatus === 'COMPLETED').length;
    const activeDisputes = parcels.filter((p) => p.disputeStatus === 'ACTIVE').length;
    const pendingCompensation = compensations.reduce((sum, c) => sum + (c.assessedAmount || 0), 0) - compensations.reduce((sum, c) => sum + (c.disbursedAmount || 0), 0);
    const rnrPending = rnrs.filter((r) => r.rnrStatus !== 'COMPLETED').length;

    const aiResponse = await generateAiInsights(project, parcels, compensations, rnrs);

    let parcelDetailsText = parcels.map(p => {
      return `Parcel ID: ${p.parcelId || 'N/A'} | Survey No: ${p.surveyNumber || 'N/A'}
Owner: ${p.ownerName || 'Unknown'} | Area: ${p.area || 0} acres | Type: ${p.landType || 'N/A'}
Acquisition Status: ${p.acquisitionStatus || 'N/A'} | Dispute Status: ${p.disputeStatus || 'NONE'}
- - - - - - - - - - - - - - - - - - - - - - - - - -`;
    }).join('\n');

    if (parcels.length === 0) {
      parcelDetailsText = "No land parcels registered for this project.";
    }

    // Build the report text
    const reportText = `==================================================
OFFICIAL BHOOMISETU PROJECT STATUS REPORT
==================================================

Date Generated: ${new Date().toLocaleDateString()}
Project ID: ${project.projectId}
Project Name: ${project.name}
Location: ${project.district}, ${project.state}
Current Status: ${project.status}

--------------------------------------------------
1. LAND ACQUISITION SUMMARY
--------------------------------------------------
Total Parcels Required: ${totalParcels}
Parcels Acquired: ${acquiredParcels}
Active Legal Disputes: ${activeDisputes}

--------------------------------------------------
2. FINANCIAL & R&R SUMMARY
--------------------------------------------------
Pending Compensation: ₹${pendingCompensation}
Parcels with Pending R&R: ${rnrPending}

--------------------------------------------------
3. LAND PARCEL DETAILS
--------------------------------------------------
${parcelDetailsText}

--------------------------------------------------
4. SYSTEM-GENERATED OBSERVATIONS
--------------------------------------------------
${activeDisputes > 0 ? '[WARNING] Active legal disputes require immediate mediation.' : '[INFO] Legal clearance is progressing smoothly.'}
${pendingCompensation > 0 ? '[WARNING] Compensation funds need to be disbursed.' : '[INFO] Compensation disbursements are up to date.'}

--------------------------------------------------
5. AI EXECUTIVE SUMMARY
--------------------------------------------------
${aiResponse.executiveSummary}

--------------------------------------------------
6. CRITICAL RISK FACTORS
--------------------------------------------------
${aiResponse.criticalRiskFactors.map((risk: string) => `- ${risk}`).join('\n')}

--------------------------------------------------
7. RECOMMENDED ADMINISTRATIVE ACTIONS
--------------------------------------------------
${aiResponse.recommendedActions.map((action: string) => `- ${action}`).join('\n')}

==================================================
*** End of Report ***
==================================================`;

    res.status(200).json({ success: true, report: reportText });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
