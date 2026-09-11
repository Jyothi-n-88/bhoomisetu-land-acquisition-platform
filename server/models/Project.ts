import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: [true, 'Project ID is required'],
      unique: true,
    },
    projectCode: {
      type: String,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
    },
    description: {
      type: String,
    },
    department: {
      type: String,
    },
    implementingAgency: {
      type: String,
    },
    sponsoringMinistry: {
      type: String,
    },
    statutoryFramework: {
      type: String,
      default: 'RFCTLARR Act, 2013',
    },
    currentStage: {
      type: String,
      default: 'Proposal & Feasibility',
    },
    totalProposedArea: {
      type: Number,
    },
    sanctionedBudget: {
      type: Number,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
    },
    district: {
      type: String,
      required: [true, 'District is required'],
    },
    projectType: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    expectedCompletion: {
      type: Date,
    },
    expectedCompletionDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Planning', 'Acquisition', 'Compensation', 'R&R', 'Possession', 'Completed'],
      default: 'Planning',
    },
    estimatedLandRequirement: {
      type: Number,
    },
    acquiredLand: {
      type: Number,
      default: 0,
    },
    assignedAuthorities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

<<<<<<< HEAD
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
=======
const Project = mongoose.model('Project', projectSchema);
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
export default Project;
