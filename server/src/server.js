import express from 'express';
import cors from 'cors';
import { CONFIG, isAllowedOrigin } from './config.js';
// Reload trigger for .env changes
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
import knowledgeGraphRoutes from './routes/knowledgeGraphRoutes.js';

const app = express();

// =========================================================================
// 1. Dynamic CORS Architecture Policy Middleware (Validated against .env)
// =========================================================================
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without Origin header (e.g. Server-to-Server, CLI tests, Curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Policy Blocked] Unauthorized Origin '${origin}' attempted API access.`);
      callback(new Error(`CORS Policy Violation: Origin '${origin}' is not authorized by backend security policy.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-IP', 'X-Forwarded-For']
};

app.use(cors(corsOptions));
app.use(express.json());

// =========================================================================
// 2. Client Connection IP Whitelist Firewall Middleware (.env Enforced)
// =========================================================================
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  // Extract client IP address from proxy headers or connection socket
  const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers['x-client-ip'] ||
                req.socket.remoteAddress ||
                req.ip ||
                '127.0.0.1';

  // Normalize IPv6 mapped IPv4 strings (e.g. ::ffff:127.0.0.1 -> 127.0.0.1)
  const cleanIp = rawIp.replace(/^::ffff:/, '');

  const isIpAllowed = CONFIG.ALLOWED_CLIENT_IPS.some(allowedIp => {
    if (allowedIp === '*') return true;
    if (cleanIp === allowedIp || rawIp === allowedIp) return true;
    if (allowedIp.endsWith('.') && cleanIp.startsWith(allowedIp)) return true;
    return false;
  });

  if (!isIpAllowed && CONFIG.STRICT_CORS_ENABLED) {
    console.warn(`[IP Firewall Blocked] Connection from IP '${cleanIp}' (${rawIp}) blocked by .env whitelist.`);
    return res.status(403).json({
      error: 'FORBIDDEN_CLIENT_IP_UNAUTHORIZED',
      message: `Access Denied: Client IP '${cleanIp}' is not permitted by backend firewall security policy.`,
      allowedIpWhitelist: CONFIG.ALLOWED_CLIENT_IPS
    });
  }

  req.clientIp = cleanIp;
  next();
});

// Request logging middleware (excluding passwords/secrets)
app.use((req, res, next) => {
  console.log(`[REST API] ${req.method} ${req.path} - Client IP: ${req.clientIp || '127.0.0.1'}`);
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
app.use('/api/knowledge-graph', knowledgeGraphRoutes);
app.use('/api', demoRoutes);

// Health & CORS Security Status Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'SākshyaChain Secure DMS REST API Backend',
    timestamp: new Date().toISOString(),
    version: '2.0.0-MVP',
    corsArchitecture: {
      strictMode: CONFIG.STRICT_CORS_ENABLED,
      allowedOrigins: CONFIG.ALLOWED_ORIGINS,
      allowedClientIps: CONFIG.ALLOWED_CLIENT_IPS
    }
  });
});

// Start Server
app.listen(CONFIG.PORT, () => {
  console.log(`=======================================================`);
  console.log(` SākshyaChain Production MVP Backend Server Active     `);
  console.log(` Allowed API origins: ${CONFIG.ALLOWED_ORIGINS.join(', ')}`);
  console.log(` Allowed client IPs: ${CONFIG.ALLOWED_CLIENT_IPS.join(', ')}`);
  console.log(` AES-256-GCM Envelope Encryption: ACTIVE                `);
  console.log(` MFA OTP Engine (120s TTL + 3-Attempt Lockout): ONLINE  `);
  console.log(` Break-Glass Emergency Access (30-min Grant): ONLINE   `);
  console.log(` Controlled Sharing & Audit DAG Chaining: ONLINE       `);
  console.log(`=======================================================`);
});
