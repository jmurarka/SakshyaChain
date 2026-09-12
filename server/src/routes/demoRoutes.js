import express from 'express';
import { dbService } from '../services/dbService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

export const NETWORKS = {
  MANAGER_NETWORK: {
    networkName: 'MANAGER_NETWORK',
    label: 'Boss / Chief Investigator Network',
    subnet: '10.20.10.0/24',
    device: 'CHIEF-INVESTIGATOR-PC-01',
    role: 'POLICE_INVESTIGATOR'
  },
  EMPLOYEE_NETWORK: {
    networkName: 'EMPLOYEE_NETWORK',
    label: 'Forensic / Officer Field Network',
    subnet: '10.20.20.0/24',
    device: 'LAB-ANALYST-PC-07',
    role: 'FORENSIC_SPECIALIST'
  }
};

let activeNetwork = NETWORKS.MANAGER_NETWORK;

// GET /api/demo-context - Returns active network context
router.get('/demo-context', (req, res) => {
  res.json({ context: activeNetwork, simulation: true });
});

// POST /api/demo-context - Switch active demo network with strict role validation
router.post('/demo-context', authenticateToken, (req, res) => {
  const { networkName } = req.body || {};
  if (!NETWORKS[networkName]) {
    return res.status(400).json({ error: 'INVALID_NETWORK', message: 'Unknown network context' });
  }

  // Manager Network requires Boss/Investigator or Auditor/Judge role
  const isManagerRole = ['POLICE_INVESTIGATOR', 'COMPLIANCE_AUDITOR', 'JUDICIAL_MAGISTRATE', 'ADMIN'].includes(req.user.role);
  if (networkName === 'MANAGER_NETWORK' && !isManagerRole) {
    return res.status(403).json({
      error: 'FORBIDDEN_PERSONA_NETWORK_BYPASS',
      message: `Access Denied: Your current persona role (${req.user.roleTitle || req.user.role}) is not authorized to connect to the Boss / Manager Network.`
    });
  }

  activeNetwork = NETWORKS[networkName];
  res.json({ context: activeNetwork, message: `Switched network context to ${activeNetwork.label}` });
});

// GET /api/manager/security-alerts - Returns list of unauthorized access & security alert events (Manager/Auditor only)
router.get('/manager/security-alerts', authenticateToken, (req, res) => {
  const isManagerRole = ['POLICE_INVESTIGATOR', 'COMPLIANCE_AUDITOR', 'JUDICIAL_MAGISTRATE', 'ADMIN'].includes(req.user.role);
  if (!isManagerRole) {
    return res.status(403).json({
      error: 'FORBIDDEN_MANAGER_ALERTS_ACCESS',
      message: `Access Denied: Persona role ${req.user.role} cannot view security alert logs.`
    });
  }

  const alerts = dbService.getSecurityAlerts ? dbService.getSecurityAlerts() : [
    {
      userId: 'USR-POL-101',
      userName: 'Inspector Vikram Sharma',
      network: 'EMPLOYEE_NETWORK',
      device: 'UNKNOWN-DEVICE-99',
      resource: '/api/documents/DOC-8891-004',
      action: 'BLOCKED',
      reason: 'CLEARANCE_VIOLATION_TOP_SECRET',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
      userId: 'USR-FOR-202',
      userName: 'Dr. Sunita Rao',
      network: 'MANAGER_NETWORK',
      device: 'LAB-ANALYST-PC-07',
      resource: '/api/cases/CASE-2026-1102',
      action: 'BLOCKED',
      reason: 'UNASSIGNED_DEPARTMENT_ACCESS',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      userId: 'USR-PRO-303',
      userName: 'Advocate Rajesh Verma',
      network: 'MANAGER_NETWORK',
      device: 'PROSECUTOR-PC-03',
      resource: '/api/documents/DOC-8891-002/download',
      action: 'GRANTED',
      reason: 'ABAC_CLEARANCE_PASSED',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    }
  ];
  res.json(alerts);
});

// GET /api/manager/employees - Returns list of system personnel
router.get('/manager/employees', authenticateToken, (req, res) => {
  const isManagerRole = ['POLICE_INVESTIGATOR', 'COMPLIANCE_AUDITOR', 'JUDICIAL_MAGISTRATE', 'ADMIN'].includes(req.user.role);
  if (!isManagerRole) {
    return res.status(403).json({
      error: 'FORBIDDEN_EMPLOYEE_DIRECTORY',
      message: `Access Denied: Persona role ${req.user.role} cannot view employee directory.`
    });
  }

  const users = dbService.getAllUsers();
  res.json(users.map(u => ({
    employeeId: u.id,
    name: u.name,
    username: u.username,
    role: u.roleTitle || u.role,
    department: u.departmentName || u.department,
    clearanceLevel: u.clearanceLevel
  })));
});

export default router;
