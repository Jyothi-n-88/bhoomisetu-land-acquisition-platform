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
      type: mongoose.Schema.Types.ObjectId,
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

const Rnr = mongoose.model('Rnr', rnrSchema);
export default Rnr;
