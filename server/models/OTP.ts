import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  tempUserData: {
    name: { type: String },
    password: { type: String }, // Pre-hashed
    role: { type: String },
    state: { type: String },
    district: { type: String },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // 5 minutes TTL
  },
});

const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);
export default OTP;
