import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import connectDB from './config/database.js';

const PORT = Number(process.env.PORT) || 5000;
let server;

const startServer = async () => {
  try {
    // Connect to database before starting the API
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });

    server.on('error', (error) => {
      console.error(`Server error: ${error.message}`);
      process.exitCode = 1;
    });

  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

//close server & db when signal receives
const stopServer = async (signal) => {
  console.log(`${signal} received, closing server`);

  if (server) {
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  } else {
    await mongoose.connection.close();
    process.exit(0);
  }
};
//dev server closing
process.on('SIGINT', () => stopServer('SIGINT'));
//deployment signal for closing
process.on('SIGTERM', () => stopServer('SIGTERM'));

startServer();
