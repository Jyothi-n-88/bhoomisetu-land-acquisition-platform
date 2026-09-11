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
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // 5 minutes TTL
  },
});

<<<<<<< HEAD
const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);
=======
const OTP = mongoose.model('OTP', otpSchema);
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
export default OTP;
