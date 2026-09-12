import express from 'express';
import { dbService } from '../services/dbService.js';
import { generateMFAOTP, verifyMFAOTP, issueTokens, refreshAccessToken } from '../services/authService.js';
import { ledgerService } from '../services/ledgerService.js';
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
      rawOTP: otpRes.rawOTP,
      expiresInSeconds: otpRes.expiresInSeconds
    });
  } catch (err) {
    res.status(400).json({ error: 'MFA_REQUEST_FAILED', message: err.message });
  }
});

// POST /api/auth/verify-otp - Verifies 6-digit OTP
router.post('/verify-otp', (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'userId and otp code are required' });
  }

  try {
    const tokenRes = verifyMFAOTP(userId, otp);
    const user = dbService.getUserById(userId);

    // Record LOGIN event on Audit DAG
    ledgerService.createEvent({
      document_id: 'SYSTEM_AUTH',
      case_id: 'SYSTEM_AUTH',
      action: 'LOGIN',
      user_id: user ? user.id : userId,
      user_role: user ? user.role : 'USER',
      data_hash: 'MFA_OTP_VERIFIED',
      metadata: { method: 'MFA_OTP', ip: req.ip || '10.0.0.1' }
    });

    res.json({
      message: 'MFA OTP Authentication successful',
      ...tokenRes
    });
  } catch (err) {
    // Record FAILED_LOGIN event on Audit DAG
    ledgerService.createEvent({
      document_id: 'SYSTEM_AUTH',
      case_id: 'SYSTEM_AUTH',
      action: 'FAILED_LOGIN',
      user_id: userId,
      user_role: 'UNKNOWN',
      data_hash: 'INVALID_OTP',
      metadata: { error: err.message, ip: req.ip || '10.0.0.1' }
    });

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

// POST /api/auth/login - Legacy direct login helper
router.post('/login', (req, res) => {
  const { userId, username } = req.body;
  let user;
  if (userId) user = dbService.getUserById(userId);
  else if (username) user = dbService.getUserByUsername(username);

  if (!user) {
    ledgerService.createEvent({
      document_id: 'SYSTEM_AUTH',
      case_id: 'SYSTEM_AUTH',
      action: 'FAILED_LOGIN',
      user_id: username || userId || 'UNKNOWN',
      user_role: 'UNKNOWN',
      data_hash: 'USER_NOT_FOUND',
      metadata: { ip: req.ip || '10.0.0.1' }
    });
    return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found in system directory' });
  }

  const tokenRes = issueTokens(user);

  ledgerService.createEvent({
    document_id: 'SYSTEM_AUTH',
    case_id: 'SYSTEM_AUTH',
    action: 'LOGIN',
    user_id: user.id,
    user_role: user.role,
    data_hash: 'DIRECT_AUTHENTICATED',
    metadata: { username: user.username, department: user.department }
  });

  res.json({
    message: `Successfully authenticated as ${user.name}`,
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
