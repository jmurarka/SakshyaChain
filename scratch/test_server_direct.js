import { dbService } from '../server/src/services/dbService.js';
import { issueTokens } from '../server/src/services/authService.js';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../server/src/config.js';

console.log('--- Testing Token & Clearance Logic Directly ---');

const empUser = dbService.getUserById('USR-POL-101'); // Level 3
const bossUser = dbService.getUserById('USR-JUD-404'); // Level 4

console.log('Emp user clearance:', empUser.clearanceLevel);
console.log('Boss user clearance:', bossUser.clearanceLevel);

const empTokens = issueTokens(empUser);
const decodedEmp = jwt.verify(empTokens.accessToken, CONFIG.JWT_SECRET);
console.log('Decoded emp token:', decodedEmp);

if (bossUser.clearanceLevel > decodedEmp.clearanceLevel) {
  console.log('✅ Hierarchy Guard PASS: Employee (Level 3) blocked from elevating to Boss (Level 4)!');
} else {
  console.error('❌ Hierarchy Guard FAIL!');
}
