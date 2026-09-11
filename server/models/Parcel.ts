import mongoose from 'mongoose';

const parcelSchema = new mongoose.Schema(
  {
    parcelId: {
      type: String,
      required: [true, 'Parcel ID is required'],
      unique: true,
      trim: true,
    },
    projectId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Project',
      required: [true, 'Project ID reference is required'],
    },
    surveyNumber: {
      type: String,
      required: [true, 'Survey number is required'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    ownerContact: {
      type: String,
      trim: true,
    },
    // National standard metric: Area in Hectares
    area: {
      type: Number,
      required: [true, 'Area (in hectares) is required'],
    },
    compensationAmount: {
      type: Number,
      default: 0,
    },
    disbursementStatus: {
      type: String,
      default: 'Pending',
    },
    landType: {
      type: String,
      enum: ['Agricultural', 'Industrial', 'Commercial', 'Residential', 'Forest', 'Government'],
      default: 'Agricultural',
    },
    latitude: {
      type: Number,
      default: 0,
    },
    longitude: {
      type: Number,
      default: 0,
    },
    // GeoJSON Polygon geometry schema
    geometry: {
      type: {
        type: String,
        default: 'Polygon',
      },
      coordinates: {
        type: mongoose.Schema.Types.Mixed,
        default: [],
      },
    },
    acquisitionStatus: {
      type: String,
      default: 'PROPOSED',
    },
    compensationStatus: {
      type: String,
      default: 'PENDING',
    },
    rnrStatus: {
      type: String,
      default: 'NOT_APPLICABLE',
    },
    possessionStatus: {
      type: String,
      default: 'Notice Issued',
    },
    disputeStatus: {
      type: String,
      default: 'None',
    },
    disputeDetails: {
      type: String,
    },
    has3DBuilding: {
      type: Boolean,
      default: false,
    },
    affectedFloor: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Flexible Project Reference Handling:
// Automatically resolves string project codes (e.g. "NHAI-KA-2024-EXP-087") or valid ObjectIds
// by querying the Project model dynamically before saving or validating.
parcelSchema.pre('validate', async function () {
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

parcelSchema.pre('save', async function () {
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

// Query middleware to dynamically resolve string project codes in query filters
const resolveFilterProjectId = async (filter: any) => {
  if (!filter || !filter.projectId) return;

  try {
    const Project = mongoose.models.Project || mongoose.model('Project');
    const pid = filter.projectId;

    if (typeof pid === 'string') {
      const val = pid.trim();
      const proj = await Project.findOne({
        $or: [{ projectId: val }, { projectCode: val }, { name: val }],
      });
      if (proj) {
        filter.projectId = { $in: [proj._id, val] };
        return;
      }

      if (mongoose.Types.ObjectId.isValid(val) && val.length === 24) {
        filter.projectId = { $in: [new mongoose.Types.ObjectId(val), val] };
      }
    } else if (pid && typeof pid === 'object' && Array.isArray(pid.$in)) {
      const expanded: any[] = [];
      for (const item of pid.$in) {
        if (typeof item === 'string') {
          const val = item.trim();
          const proj = await Project.findOne({
            $or: [{ projectId: val }, { projectCode: val }, { name: val }],
          });
          if (proj) {
            expanded.push(proj._id);
          }
          if (mongoose.Types.ObjectId.isValid(val) && val.length === 24) {
            expanded.push(new mongoose.Types.ObjectId(val));
          }
          expanded.push(item);
        } else {
          expanded.push(item);
        }
      }
      filter.projectId = { $in: expanded };
    }
  } catch {
    // ignore
  }
};

parcelSchema.pre(/^find/, async function () {
  const filter = this.getFilter();
  await resolveFilterProjectId(filter);
});

parcelSchema.pre('countDocuments', async function () {
  const filter = this.getFilter();
  await resolveFilterProjectId(filter);
});

parcelSchema.pre('deleteMany', async function () {
  const filter = this.getFilter();
  await resolveFilterProjectId(filter);
});

const Parcel = mongoose.models.Parcel || mongoose.model('Parcel', parcelSchema);
export default Parcel;
