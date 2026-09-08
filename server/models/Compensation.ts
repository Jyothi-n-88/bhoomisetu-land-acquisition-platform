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
      type: mongoose.Schema.Types.ObjectId,
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
      enum: ['PENDING', 'PARTIALLY_PAID', 'DISBURSED'],
      default: 'PENDING',
    },
    disbursementDate: {
      type: Date,
    },
    bankReferenceNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Compensation = mongoose.model('Compensation', compensationSchema);
export default Compensation;
