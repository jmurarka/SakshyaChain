import express from 'express';
import cors from 'cors';
import { CONFIG } from './config.js';
import { seedInitialData } from './services/seedService.js';

import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import signatureRoutes from './routes/signatureRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import sharingRoutes from './routes/sharingRoutes.js';
import demoRoutes from './routes/demoRoutes.js';

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logging middleware (excluding passwords/secrets)
app.use((req, res, next) => {
  console.log(`[REST API] ${req.method} ${req.path}`);
  next();
});

// Seed Initial Legal Documents & Ledger State
seedInitialData();

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/signature', signatureRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/ledger', auditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/sharing', sharingRoutes);
app.use('/api', demoRoutes);

// Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'SākshyaChain Secure DMS REST API Backend',
    timestamp: new Date().toISOString(),
    version: '2.0.0-MVP'
  });
});

// Start Server
app.listen(CONFIG.PORT, () => {
  console.log(`=======================================================`);
  console.log(` SākshyaChain Production MVP Backend Server Active     `);
  console.log(` Running on: http://localhost:${CONFIG.PORT}            `);
  console.log(` AES-256-GCM Envelope Encryption: ACTIVE                `);
  console.log(` MFA OTP Engine (120s TTL + 3-Attempt Lockout): ONLINE  `);
  console.log(` Break-Glass Emergency Access (30-min Grant): ONLINE   `);
  console.log(` Controlled Sharing & Audit DAG Chaining: ONLINE       `);
  console.log(`=======================================================`);
});
