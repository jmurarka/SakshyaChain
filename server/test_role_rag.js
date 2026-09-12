import axios from 'axios';

async function testRoleBasedRAG() {
  try {
    console.log('--- TEST 1: Inspector Vikram Sharma (Clearance Level 3) ---');
    const login1 = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'sharma_leo',
      password: 'password123'
    });
    const token1 = login1.data.accessToken;

    const res1 = await axios.post(
      'http://localhost:5000/api/ai/rag-search',
      { query: 'wiretap order offshore communications', caseId: 'CASE-2026-8891' },
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    console.log('Inspector Results Count:', res1.data.results.citations.length);
    console.log('Inspector Max Clearance in Citations:', res1.data.results.citations.map(c => c.clearanceLevel));

    console.log('\n--- TEST 2: Justice P.K. Mukherjee (Clearance Level 4 - Top Secret) ---');
    const login2 = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'mukherjee_magistrate',
      password: 'password123'
    });
    const token2 = login2.data.accessToken;

    const res2 = await axios.post(
      'http://localhost:5000/api/ai/rag-search',
      { query: 'wiretap order offshore communications', caseId: 'CASE-2026-8891' },
      { headers: { Authorization: `Bearer ${token2}` } }
    );
    console.log('Magistrate Results Count:', res2.data.results.citations.length);
    console.log('Magistrate Citations:', res2.data.results.citations.map(c => ({ title: c.docTitle, level: c.clearanceLevel })));

  } catch (err) {
    console.error('Role RAG Test Error:', err.response?.data || err.message);
  }
}

testRoleBasedRAG();
