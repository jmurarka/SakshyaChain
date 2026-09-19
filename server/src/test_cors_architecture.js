import express from 'express';
import cors from 'cors';
import http from 'http';
import { CONFIG, isAllowedOrigin } from './config.js';

console.log('=======================================================');
console.log('   Testing CORS & IP Whitelist Architecture Policy    ');
console.log('=======================================================');
console.log('Allowed Origins (.env):', CONFIG.ALLOWED_ORIGINS);
console.log('Allowed Client IPs (.env):', CONFIG.ALLOWED_CLIENT_IPS);
console.log('Strict CORS Enabled:', CONFIG.STRICT_CORS_ENABLED);

const testApp = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin)) callback(null, true);
    else callback(new Error(`CORS Policy Violation: Origin '${origin}' is unauthorized.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-IP', 'X-Forwarded-For']
};

testApp.use(cors(corsOptions));
testApp.use(express.json());

testApp.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers['x-client-ip'] ||
                req.socket.remoteAddress ||
                '127.0.0.1';

  const cleanIp = rawIp.replace(/^::ffff:/, '');

  const isIpAllowed = CONFIG.ALLOWED_CLIENT_IPS.some(allowedIp => {
    if (allowedIp === '*') return true;
    if (cleanIp === allowedIp || rawIp === allowedIp) return true;
    if (allowedIp.endsWith('.') && cleanIp.startsWith(allowedIp)) return true;
    return false;
  });

  if (!isIpAllowed && CONFIG.STRICT_CORS_ENABLED) {
    return res.status(403).json({
      error: 'FORBIDDEN_CLIENT_IP_UNAUTHORIZED',
      message: `Access Denied: Client IP '${cleanIp}' is not permitted by backend firewall security policy.`,
      allowedIpWhitelist: CONFIG.ALLOWED_CLIENT_IPS
    });
  }

  req.clientIp = cleanIp;
  next();
});

testApp.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'SākshyaChain Secure DMS REST API Backend',
    corsArchitecture: {
      strictMode: CONFIG.STRICT_CORS_ENABLED,
      allowedOrigins: CONFIG.ALLOWED_ORIGINS,
      allowedClientIps: CONFIG.ALLOWED_CLIENT_IPS
    }
  });
});

// Error handling middleware for CORS errors
testApp.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS Policy Violation')) {
    return res.status(403).json({ error: 'CORS_POLICY_VIOLATION', message: err.message });
  }
  res.status(500).json({ error: err.message });
});

const server = testApp.listen(5005, async () => {
  try {
    await runTests();
  } finally {
    server.close();
  }
});

function testRequest(headers = {}) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5005,
      path: '/api/health',
      method: 'GET',
      headers
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body || '{}') });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });

    req.end();
  });
}

async function runTests() {
  console.log('\n[Test 1] All origins listed in .env...');
  for (const allowedOrigin of CONFIG.ALLOWED_ORIGINS) {
    const response = await testRequest({ origin: allowedOrigin });
    const returnedOrigin = response.headers['access-control-allow-origin'];
    if (response.status !== 200 || returnedOrigin !== allowedOrigin) {
      console.error(`❌ Test 1 FAIL: ${allowedOrigin} was not accepted.`);
      return;
    }
  }
  console.log(`✅ Test 1 PASS: All ${CONFIG.ALLOWED_ORIGINS.length} configured origins accepted cleanly!`);

  console.log('\n[Test 2] Unauthorized Origin (http://malicious-hacker.com)...');
  const res2 = await testRequest({ origin: 'http://malicious-hacker.com' });
  console.log('Status:', res2.status);
  console.log('Error payload:', res2.body);
  if (res2.status === 403 && res2.body.error === 'CORS_POLICY_VIOLATION') {
    console.log('✅ Test 2 PASS: Unauthorized origin blocked by CORS Policy!');
  } else {
    console.error('❌ Test 2 FAIL!');
  }

  console.log('\n[Test 3] Unauthorized Client IP (198.51.100.42)...');
  const res3 = await testRequest({ 'x-forwarded-for': '198.51.100.42' });
  console.log('Status:', res3.status);
  console.log('Error payload:', res3.body);
  if (res3.status === 403 && res3.body.error === 'FORBIDDEN_CLIENT_IP_UNAUTHORIZED') {
    console.log('✅ Test 3 PASS: Unauthorized IP blocked with 403 Forbidden!');
  } else {
    console.error('❌ Test 3 FAIL!');
  }

  console.log('\n[Test 4] Authorized Client IP (192.168.102.99)...');
  const res4 = await testRequest({ 'x-forwarded-for': '192.168.102.99', origin: 'http://192.168.102.99:5173' });
  console.log('Status:', res4.status);
  if (res4.status === 200) {
    console.log('✅ Test 4 PASS: Authorized Client IP (192.168.102.99) permitted cleanly!');
  } else {
    console.error('❌ Test 4 FAIL!');
  }
}
