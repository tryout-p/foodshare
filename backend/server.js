import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB, getDbMode } from './src/config/db.js';
import { seedDatabase } from './src/config/seed.js';

// Route Imports
import authRoutes from './src/routes/authRoutes.js';
import donationRoutes from './src/routes/donationRoutes.js';
import requestRoutes from './src/routes/requestRoutes.js';
import pickupRoutes from './src/routes/pickupRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Server Status Check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    database: getDbMode(),
    time: new Date().toISOString()
  });
});

const __dirname = path.resolve();

// Serve frontend static assets in production
let frontendDistPath = path.join(__dirname, 'frontend', 'dist');
if (!fs.existsSync(frontendDistPath)) {
  frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
}

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
  console.log('Serving frontend client build from', frontendDistPath);
} else {
  app.get('/', (req, res) => {
    res.send('FoodShare API running. Client build not found (run npm run build in frontend to generate production build).');
  });
  console.log('Frontend build folder not found. API routes are ready.');
}

const PORT = process.env.PORT || 5000;

// Start server after connecting to database
const startServer = async () => {
  await connectDB();
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Database engine in use: ${getDbMode()}`);
  });
};

startServer();
