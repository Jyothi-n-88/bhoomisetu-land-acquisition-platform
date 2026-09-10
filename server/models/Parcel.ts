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
      type: mongoose.Schema.Types.ObjectId,
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

const Parcel = mongoose.model('Parcel', parcelSchema);
export default Parcel;
