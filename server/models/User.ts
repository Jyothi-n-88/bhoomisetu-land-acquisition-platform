import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: function (this: any) {
        return !this.authProvider || this.authProvider === 'local';
      },
      minlength: 6,
      select: false, // Don't return password by default
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'microsoft'],
      default: 'local',
    },
    role: {
      type: String,
      enum: [
        'CENTRAL_AUTHORITY',
        'STATE_AUTHORITY',
        'DISTRICT_AUTHORITY',
        'FIELD_OFFICER',
      ],
      required: [true, 'Please provide a role'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

<<<<<<< HEAD
const User = mongoose.models.User || mongoose.model('User', userSchema);
=======
const User = mongoose.model('User', userSchema);
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9
export default User;
