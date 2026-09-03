import mongoose from 'mongoose';

const parcelSchema = new mongoose.Schema(
  {
    parcelId: {
      type: String,
      required: [true, 'Parcel ID is required'],
      unique: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID reference is required'],
    },
    surveyNumber: {
      type: String,
      required: [true, 'Survey number is required'],
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
    },
    ownerContact: {
      type: String,
    },
    area: {
      type: Number,
      required: [true, 'Area (in acres) is required'],
    },
    landType: {
      type: String,
      enum: ['Agricultural', 'Commercial', 'Residential', 'Forest', 'Government', 'Industrial'],
      default: 'Agricultural',
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    geometry: {
      type: {
        type: String,
        default: 'Polygon',
      },
      coordinates: [[[Number]]],
    },
    acquisitionStatus: {
      type: String,
      enum: [
        'PROPOSED',
        'SURVEYED',
        'UNDER_NOTIFICATION',
        'AWARD_PENDING',
        'COMPENSATION_PENDING',
        'COMPENSATION_PAID',
        'R_AND_R_PENDING',
        'POSSESSION_PENDING',
        'ACQUIRED',
        'COMPLETED',
      ],
      default: 'PROPOSED',
    },
    compensationStatus: {
      type: String,
      enum: ['PENDING', 'ASSESSED', 'APPROVED', 'DISBURSED'],
      default: 'PENDING',
    },
    rnrStatus: {
      type: String,
      enum: ['NOT_APPLICABLE', 'PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_APPLICABLE',
    },
    possessionStatus: {
      type: String,
      enum: ['PENDING', 'TAKEN'],
      default: 'PENDING',
    },
    disputeStatus: {
      type: String,
      enum: ['NONE', 'ACTIVE', 'RESOLVED'],
      default: 'NONE',
    },
    disputeDetails: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Parcel = mongoose.model('Parcel', parcelSchema);
export default Parcel;
