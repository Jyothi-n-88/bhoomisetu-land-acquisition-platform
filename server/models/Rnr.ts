import mongoose from 'mongoose';

const rnrSchema = new mongoose.Schema(
  {
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parcel',
      required: [true, 'Parcel ID reference is required'],
      unique: true,
    },
    projectId: {
<<<<<<< HEAD
      type: mongoose.Schema.Types.Mixed,
=======
      type: mongoose.Schema.Types.ObjectId,
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
      ref: 'Project',
      required: [true, 'Project ID reference is required'],
    },
    affectedFamiliesCount: {
      type: Number,
      default: 0,
    },
    displacedFamiliesCount: {
      type: Number,
      default: 0,
    },
    rnrRequired: {
      type: Boolean,
      default: false,
    },
    rnrStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'IDENTIFIED', 'PACKAGE_APPROVED', 'RESETTLED', 'COMPLETED'],
      default: 'NOT_REQUIRED',
    },
    resettlementSite: {
      type: String,
    },
    assistanceDetails: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

<<<<<<< HEAD
rnrSchema.pre('validate', async function () {
  if (this.projectId) {
    const val = typeof this.projectId === 'string' ? this.projectId.trim() : this.projectId.toString();
    try {
      const Project = mongoose.models.Project || mongoose.model('Project');
      const proj = await Project.findOne({
        $or: [{ projectId: val }, { projectCode: val }, { name: val }],
      });
      if (proj) {
        this.projectId = proj._id;
        return;
      }
    } catch {
      // ignore
    }
    if (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val) && val.length === 24) {
      this.projectId = new mongoose.Types.ObjectId(val);
    }
  }
});

const Rnr = mongoose.models.Rnr || mongoose.model('Rnr', rnrSchema);
=======
const Rnr = mongoose.model('Rnr', rnrSchema);
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
export default Rnr;
