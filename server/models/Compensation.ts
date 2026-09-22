import mongoose from 'mongoose';

const compensationSchema = new mongoose.Schema(
  {
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parcel',
      required: [true, 'Parcel ID reference is required'],
      unique: true, // One compensation record per parcel for simplicity
    },
    projectId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Project',
      required: [true, 'Project ID reference is required'],
    },
    assessedAmount: {
      type: Number,
      default: 0,
    },
    approvedAmount: {
      type: Number,
      default: 0,
    },
    disbursedAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'PARTIALLY_PAID', 'DISBURSED', 'HELD_IN_ESCROW'],
      default: 'PENDING',
    },
    disbursementDate: {
      type: Date,
    },
    bankReferenceNumber: {
      type: String,
    },
    baseMarketRate: {
      type: Number,
      default: 0,
    },
    areaInAcres: {
      type: Number,
      default: 0,
    },
    isRural: {
      type: Boolean,
      default: false,
    },
    multiplierFactor: {
      type: Number,
      default: 1.0,
    },
    assetsValue: {
      type: Number,
      default: 0,
    },
    solatiumAmount: {
      type: Number,
      default: 0,
    },
    additionalMarketValue: {
      type: Number,
      default: 0,
    },
    calculationBreakdown: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

compensationSchema.pre('validate', async function () {
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

const Compensation = mongoose.models.Compensation || mongoose.model('Compensation', compensationSchema);
export default Compensation;
