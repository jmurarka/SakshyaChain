import axios from 'axios';

async function testUpload() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'sharma_leo',
      password: 'password123'
    });

    const token = loginRes.data.accessToken;
    console.log('Login successful. User:', loginRes.data.user.name);

    console.log('Uploading test document...');
    const uploadRes = await axios.post(
      'http://localhost:5000/api/documents/upload',
      {
        title: 'Sworn Witness Test Deposition',
        caseId: 'CASE-2026-8891',
        category: 'WITNESS_STATEMENT',
        clearanceLevel: 2,
        textContent: 'Test witness deposition payload content for verification.'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Upload response:', uploadRes.data);
  } catch (err) {
    console.error('Upload Error:', err.response?.data || err.message);
  }
}

testUpload();
