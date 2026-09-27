import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('MONGO_URI is not defined in environment variables.');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected to', mongoUri);
  } catch (err: any) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};
