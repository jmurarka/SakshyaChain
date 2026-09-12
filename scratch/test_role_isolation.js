import http from 'http';

function makePost(path, postData, token = null) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(postData);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testRoles() {
  console.log('--- Testing Dual Role Authentication & Isolation ---');

  // 1. Employee Login (Level 3 - USR-POL-101)
  const empRes = await makePost('/api/auth/login', { userId: 'USR-POL-101' });
  console.log('Employee Login Status:', empRes.status);
  console.log('Employee Role:', empRes.data.user.role, 'Clearance Level:', empRes.data.user.clearanceLevel);

  // 2. Employee Attempts Privilege Escalation (Switch to Boss USR-JUD-404)
  const escRes = await makePost('/api/auth/login', { userId: 'USR-JUD-404' }, empRes.data.token);
  console.log('Employee Privilege Escalation Status:', escRes.status);
  console.log('Escalation Result:', escRes.data);

  // 3. Boss Login (Level 4 - USR-JUD-404)
  const bossRes = await makePost('/api/auth/login', { userId: 'USR-JUD-404' });
  console.log('Boss Login Status:', bossRes.status);
  console.log('Boss Role:', bossRes.data.user.role, 'Clearance Level:', bossRes.data.user.clearanceLevel);

  // 4. Boss Switches Down to Employee (Allowed)
  const switchDownRes = await makePost('/api/auth/login', { userId: 'USR-POL-101' }, bossRes.data.token);
  console.log('Boss Switch Down Status:', switchDownRes.status);
  console.log('Switch Down Result User:', switchDownRes.data.user?.name);
}

testRoles().catch(console.error);
