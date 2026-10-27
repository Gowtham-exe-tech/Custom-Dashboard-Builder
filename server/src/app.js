import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import orderRoutes from './routes/orderRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import dataConnectionRoutes from './routes/dataConnectionRoutes.js';
import widgetDataRoutes from "./routes/widgetDataRoutes.js";

import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean);

app.disable('x-powered-by');
app.use(helmet());

// Allow requests from the Vue 
app.use(cors({
  origin(origin, callback) {
    // Allow tools such as curl and Postman without an Origin header
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin is not allowed by CORS'));
  }
}));

// Read JSON request bodies
app.use(express.json({ limit: '1mb' }));

// Limit excessive API requests
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));

app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    api: 'running',
    database: databaseConnected ? 'connected' : 'disconnected',
    databaseName: mongoose.connection.name || null
  });
});

// Connect each API group to its routes
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/dashboards', dashboardRoutes);
app.use('/api/v1/data-connections', dataConnectionRoutes);
app.use("/api/v1", widgetDataRoutes);

// Handle unknown routes and API errors
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
