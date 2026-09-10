import mongoose from 'mongoose';
import User from '../models/User';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.warn('MONGODB_URI is not defined in environment variables. Database will not be connected.');
      return false;
    }
    
    await mongoose.connect(uri, {
      dbName: 'bhoomisetu',
    });
    console.log('MongoDB Connected successfully');

    // Clean up legacy indexes and align MongoDB with the current schema
    try {
      await mongoose.connection.collection('users').dropIndex('username_1').catch(() => {});
      await User.syncIndexes();
      console.log('User collection indexes synchronized and legacy indexes cleared');
    } catch (indexError) {
      console.warn('Notice: index cleanup/sync check completed:', indexError);
    }

    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

export const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};
