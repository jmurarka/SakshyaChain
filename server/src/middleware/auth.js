import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import { dbService } from '../services/dbService.js';
import { breakGlassService } from '../services/breakGlassService.js';
import { isAccountFrozen } from '../utils/accountFreeze.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED_NO_TOKEN',
      message: 'Access Denied: Missing Bearer Authorization Header'
    });
  }

  jwt.verify(token, CONFIG.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({
        error: 'FORBIDDEN_INVALID_TOKEN',
        message: 'Access Denied: Invalid or Expired Security Token'
      });
    }

    const user = dbService.getUserById(decodedUser.id);
    if (!user) {
      return res.status(403).json({
        error: 'FORBIDDEN_USER_NOT_FOUND',
        message: 'Access Denied: User record not found'
      });
    }

    if (isAccountFrozen(user)) {
      return res.status(423).json({
        error: 'ACCOUNT_FROZEN',
        message: `This account is temporarily frozen after a security incident until ${new Date(user.frozenUntil).toLocaleString()}.`
      });
    }

    req.user = user;
    next();
  });
}

export function authorizeClearance(requiredClearanceLevel) {
  return (req, res, next) => {
    const caseId = req.params.caseId || req.body.caseId || req.query.caseId;

    // Check Break-Glass Emergency Grant
    if (req.user && caseId) {
      const activeGrant = breakGlassService.hasActiveBreakGlassGrant(req.user.id, caseId);
      if (activeGrant) {
        req.breakGlassActive = true;
        req.breakGlassGrant = activeGrant;
        return next();
      }
    }

    if (!req.user || req.user.clearanceLevel < requiredClearanceLevel) {
      return res.status(403).json({
        error: 'FORBIDDEN_CLEARANCE_VIOLATION',
        message: `Security Clearance Violation: Clearance Level ${requiredClearanceLevel} required. Your clearance level is ${req.user ? req.user.clearanceLevel : 0}.`,
        userClearance: req.user ? req.user.clearanceLevel : 0,
        requiredClearanceLevel
      });
    }
    next();
  };
}

export function authorizeCaseAccess(req, res, next) {
  const caseId = req.params.caseId || req.body.caseId || req.query.caseId;
  if (!caseId) return next();

  // Check Break-Glass Emergency Grant
  if (req.user) {
    const activeGrant = breakGlassService.hasActiveBreakGlassGrant(req.user.id, caseId);
    if (activeGrant) {
      req.breakGlassActive = true;
      req.breakGlassGrant = activeGrant;
      return next();
    }
  }

  const db = dbService.readDB();
  const targetCase = db.cases.find(c => c.id === caseId);

  if (!targetCase) {
    return res.status(404).json({ error: 'CASE_NOT_FOUND', message: 'Target Case ID not found' });
  }

  // Clearance Level Check
  if (req.user.clearanceLevel < targetCase.clearanceRequired) {
    return res.status(403).json({
      error: 'FORBIDDEN_CASE_CLEARANCE',
      message: `Access Denied: Case requires Clearance Level ${targetCase.clearanceRequired}.`
    });
  }

  // Department / Assignment Check
  const isAssigned = (req.user.assignedCases || []).includes(caseId);

  if (!isAssigned && req.user.systemRole !== 'IT_ADMIN') {
    return res.status(403).json({
      error: 'FORBIDDEN_DEPARTMENT_RESTRICTED',
      message: 'Access Denied: This case is not assigned to your account.'
    });
  }

  next();
}
