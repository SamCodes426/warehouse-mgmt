import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Warehouse Management API',
  });
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 WMS Backend Server running on http://localhost:${PORT}`);
  console.log(`🩺 Health check available at http://localhost:${PORT}/health`);
});

export default app;
