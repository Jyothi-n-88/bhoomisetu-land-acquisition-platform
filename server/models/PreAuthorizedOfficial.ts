import mongoose, { Document, Model } from 'mongoose';

export interface IPreAuthorizedOfficial extends Document {
  officialName: string;
  govEmployeeId: string;
  department: string;
  authorizedRole: string;
  assignedState: string;
  assignedDistrict: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const preAuthorizedOfficialSchema = new mongoose.Schema(
  {
    officialName: {
      type: String,
      required: [true, 'Official name is required'],
      trim: true,
    },
    govEmployeeId: {
      type: String,
      required: [true, 'Government Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    authorizedRole: {
      type: String,
      required: [true, 'Authorized role is required'],
      enum: [
        'CENTRAL_AUTHORITY',
        'STATE_AUTHORITY',
        'DISTRICT_AUTHORITY',
        'FIELD_OFFICER',
      ],
    },
    assignedState: {
      type: String,
      trim: true,
      default: '',
    },
    assignedDistrict: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Basic seeder dataset for pre-authorized government officials
export const dummyPreAuthorizedOfficials = [
  {
    officialName: 'Janavi',
    govEmployeeId: '2026-SAO-001',
    department: 'National Highways Authority of India',
    authorizedRole: 'STATE_AUTHORITY',
    assignedState: 'Karnataka',
    assignedDistrict: 'Bengaluru Urban',
    isActive: true,
  },
  {
    officialName: 'Rajesh Sharma',
    govEmployeeId: 'DL/REV/SA/2026/0123',
    department: 'Revenue & Disaster Management',
    authorizedRole: 'STATE_AUTHORITY',
    assignedState: 'Maharashtra',
    assignedDistrict: '',
    isActive: true,
  },
  {
    officialName: 'Priya Narayanan',
    govEmployeeId: 'MH/LA/DA/2026/0456',
    department: 'Land Acquisition & Resettlement Cell',
    authorizedRole: 'DISTRICT_AUTHORITY',
    assignedState: 'Maharashtra',
    assignedDistrict: 'Pune',
    isActive: true,
  },
  {
    officialName: 'Vikramaditya Roy',
    govEmployeeId: 'IN/MORTH/CA/2026/0789',
    department: 'Ministry of Road Transport and Highways (MoRTH)',
    authorizedRole: 'CENTRAL_AUTHORITY',
    assignedState: '',
    assignedDistrict: '',
    isActive: true,
  },
  {
    officialName: 'Amit Verma',
    govEmployeeId: 'MH/REV/FO/2026/0999',
    department: 'Survey & Land Records Department',
    authorizedRole: 'FIELD_OFFICER',
    assignedState: 'Maharashtra',
    assignedDistrict: 'Pune',
    isActive: true,
  },
  {
    officialName: 'Inactive Test User',
    govEmployeeId: 'TEST/REV/INACT/2026/0000',
    department: 'Decommissioned Registry',
    authorizedRole: 'FIELD_OFFICER',
    assignedState: 'Maharashtra',
    assignedDistrict: 'Pune',
    isActive: false,
  },
];

/**
 * Seeder helper to initialize pre-authorized officials in the database if collection is empty
 * or upsert missing seed records.
 */
export const seedPreAuthorizedOfficials = async () => {
  try {
    const count = await PreAuthorizedOfficial.countDocuments();
    if (count === 0) {
      await PreAuthorizedOfficial.insertMany(dummyPreAuthorizedOfficials);
      console.log('Seeded initial pre-authorized government officials');
    } else {
      // Ensure any newly added officials in the seeder list are synchronized
      for (const official of dummyPreAuthorizedOfficials) {
        await PreAuthorizedOfficial.updateOne(
          { govEmployeeId: official.govEmployeeId },
          { $setOnInsert: official },
          { upsert: true }
        );
      }
      console.log('Pre-authorized official records synchronized');
    }
  } catch (error: any) {
    console.warn('Pre-authorized official seeding notice:', error.message);
  }
};

const PreAuthorizedOfficial: Model<IPreAuthorizedOfficial> =
  mongoose.models.PreAuthorizedOfficial ||
  mongoose.model<IPreAuthorizedOfficial>(
    'PreAuthorizedOfficial',
    preAuthorizedOfficialSchema
  );

export default PreAuthorizedOfficial;
