import axios from 'axios';

async function testDynamicPermissionChange() {
  try {
    console.log('1. Logging in as Inspector Vikram Sharma...');
    const login = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'sharma_leo',
      password: 'password123'
    });
    const token = login.data.accessToken;

    console.log('2. Querying Top Secret wiretap order under default Clearance Level 3...');
    const res1 = await axios.post(
      'http://localhost:5000/api/ai/rag-search',
      { query: 'wiretap order offshore communications', caseId: 'CASE-2026-8891' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('   Results Count (Level 3):', res1.data.results.citations.length);

    console.log('3. Updating Inspector Sharma\'s clearance to Level 4 (Top Secret)...');
    const updateRes = await axios.patch(
      'http://localhost:5000/api/auth/users/USR-POL-101',
      { clearanceLevel: 4 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('   Update response:', updateRes.data.message);

    console.log('4. Re-logging in to refresh token with updated Level 4 clearance...');
    const relogin = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'sharma_leo',
      password: 'password123'
    });
    const tokenLevel4 = relogin.data.accessToken;

    console.log('5. Re-querying Top Secret wiretap order under updated Clearance Level 4...');
    const res2 = await axios.post(
      'http://localhost:5000/api/ai/rag-search',
      { query: 'wiretap order offshore communications', caseId: 'CASE-2026-8891' },
      { headers: { Authorization: `Bearer ${tokenLevel4}` } }
    );
    console.log('   Results Count (Level 4):', res2.data.results.citations.length);
    console.log('   Retrieved Evidence Title:', res2.data.results.citations[0]?.docTitle);

    console.log('6. Resetting Inspector Sharma back to Clearance Level 3...');
    await axios.patch(
      'http://localhost:5000/api/auth/users/USR-POL-101',
      { clearanceLevel: 3 },
      { headers: { Authorization: `Bearer ${tokenLevel4}` } }
    );
    console.log('   Reset successful.');

  } catch (err) {
    console.error('Permission Change Test Error:', err.response?.data || err.message);
  }
}

testDynamicPermissionChange();
