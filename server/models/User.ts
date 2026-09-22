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
    state: {
      type: String,
      trim: true,
      validate: {
        validator: function (this: any, val: string) {
          if (this.role === 'STATE_AUTHORITY' || this.role === 'DISTRICT_AUTHORITY' || this.role === 'FIELD_OFFICER') {
            return typeof val === 'string' && val.trim().length > 0;
          }
          return true;
        },
        message: 'State is mandatory for State Authority, District Authority, and Field Officer roles.',
      },
    },
    district: {
      type: String,
      trim: true,
      validate: {
        validator: function (this: any, val: string) {
          if (this.role === 'DISTRICT_AUTHORITY' || this.role === 'FIELD_OFFICER') {
            return typeof val === 'string' && val.trim().length > 0;
          }
          return true;
        },
        message: 'District is strictly mandatory for District Authority and Field Officer roles.',
      },
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

// Pre-save hook to enforce role-based location integrity (async for modern Mongoose)
userSchema.pre('save', async function () {
  if (this.role === 'CENTRAL_AUTHORITY') {
    // Optional / cleared for Central Authority
  } else if (this.role === 'STATE_AUTHORITY') {
    if (!this.state || this.state.trim().length === 0) {
      throw new Error('State is required for State Authority users.');
    }
  } else if (this.role === 'DISTRICT_AUTHORITY' || this.role === 'FIELD_OFFICER') {
    if (!this.state || this.state.trim().length === 0) {
      throw new Error(`State is required for ${this.role.replace('_', ' ')} users.`);
    }
    if (!this.district || this.district.trim().length === 0) {
      throw new Error(`District is required for ${this.role.replace('_', ' ')} users.`);
    }
  }
});

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

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
