import mongoose from 'mongoose';

const connectDB = async () => {
  //connection url from .env
  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl) {
    throw new Error('MONGODB_URI is not connected');
  }

  mongoose.set('strictQuery', true);
  
  //wait for connection to atlas
  await mongoose.connect(mongoUrl, {
    serverSelectionTimeoutMS: 10000
  });

  console.log(`MongoDB connected: ${mongoose.connection.host}`);
  console.log(`Database: ${mongoose.connection.name}`);
};

export default connectDB;
