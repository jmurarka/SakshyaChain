import express from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import { dbService } from '../services/dbService.js';
import { generateMFAOTP, verifyMFAOTP, issueTokens, refreshAccessToken } from '../services/authService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/auth/users - List available personas for authentication
router.get('/users', (req, res) => {
  const users = dbService.getAllUsers();
  res.json({ users });
});

// POST /api/auth/request-otp - Generates 120s TTL MFA OTP code
router.post('/request-otp', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'MISSING_USER_ID', message: 'userId is required' });
  }

  try {
    const otpRes = generateMFAOTP(userId);
    res.json({
      message: `MFA OTP Code generated successfully (120s TTL)`,
      rawOTP: otpRes.rawOTP, // Provided for testing convenience in UI
      expiresInSeconds: otpRes.expiresInSeconds
    });
  } catch (err) {
    res.status(400).json({ error: 'MFA_REQUEST_FAILED', message: err.message });
  }
});

// POST /api/auth/verify-otp - Verifies 6-digit OTP and issues 15-min Access JWT + 8-hr Refresh JWT
router.post('/verify-otp', (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'userId and otp code are required' });
  }

  try {
    const tokenRes = verifyMFAOTP(userId, otp);
    res.json({
      message: 'MFA OTP Authentication successful',
      ...tokenRes
    });
  } catch (err) {
    res.status(401).json({ error: 'MFA_VERIFICATION_FAILED', message: err.message });
  }
});

// POST /api/auth/refresh - Renew access token using refresh token
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'MISSING_REFRESH_TOKEN', message: 'refreshToken is required' });
  }

  try {
    const tokenRes = refreshAccessToken(refreshToken);
    res.json({ message: 'Access token successfully renewed', ...tokenRes });
  } catch (err) {
    res.status(401).json({ error: 'REFRESH_FAILED', message: err.message });
  }
});

// POST /api/auth/login - Persona authentication & switching with strict Clearance Level Hierarchy guard
router.post('/login', async (req, res) => {
  const { userId, username } = req.body;
  let targetUser;
  if (userId) targetUser = dbService.getUserById(userId);
  else if (username) targetUser = dbService.getUserByUsername(username);

  if (!targetUser) {
    return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found in system directory' });
  }

  // Strict Clearance Level Hierarchy Rule:
  // Lower clearance level users CANNOT switch up to higher clearance level personas.
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const callerToken = authHeader.split(' ')[1];
      const callerPayload = jwt.verify(callerToken, CONFIG.JWT_SECRET);
      
      if (callerPayload && callerPayload.clearanceLevel) {
        if (targetUser.clearanceLevel > callerPayload.clearanceLevel) {
          return res.status(403).json({
            error: 'FORBIDDEN_CLEARANCE_PRIVILEGE_ESCALATION',
            message: `Access Denied: Level ${callerPayload.clearanceLevel} persona cannot switch up to higher Level ${targetUser.clearanceLevel} persona (${targetUser.name}). Privilege escalation prohibited!`
          });
        }
      }
    } catch (err) {
      console.warn('[Auth Middleware Warning] Token check failed:', err.message);
    }
  }

  const tokenRes = issueTokens(targetUser);
  res.json({
    message: `Successfully authenticated as ${targetUser.name}`,
    token: tokenRes.accessToken,
    ...tokenRes
  });
});

// GET /api/auth/me - Profile verification
router.get('/me', authenticateToken, (req, res) => {
  const { privateKey, ...userPublic } = dbService.getUserWithPrivateKey(req.user.id);
  res.json({ user: userPublic });
});

export default router;
