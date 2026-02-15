(async ()=>{
  try {
    const base = 'http://localhost:3000/api';
    const loginRes = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginText = await loginRes.text();
    console.log('LOGIN RESPONSE:', loginText);
    let token = null;
    try { token = JSON.parse(loginText).token; } catch(e){ }

    // Test save build
    const buildPayload = { name: 'Test Build', description: 'Automated test', parts: { cpu: 'cpu_1', gpu: 'gpu_1' } };
    const buildRes = await fetch(base + '/builds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token?{ Authorization: `Bearer ${token}` }:{}) },
      body: JSON.stringify(buildPayload)
    });
    const buildText = await buildRes.text();
    console.log('BUILD SAVE RESPONSE:', buildText);

    // Test send custom email
    const emailPayload = { orderId: 1, customerEmail: 'test@example.com', subject: 'Test', message: 'Hello from test' };
    const emailRes = await fetch(base + '/email/send-custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token?{ Authorization: `Bearer ${token}` }:{}) },
      body: JSON.stringify(emailPayload)
    });
    const emailText = await emailRes.text();
    console.log('EMAIL SEND RESPONSE:', emailText);

  } catch (err) {
    console.error('TEST SCRIPT ERROR:', err);
  }
})();
