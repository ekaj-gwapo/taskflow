async function verify() {
  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@example.com',
        password: 'Password123!'
      })
    });

    if (!loginRes.ok) {
      const error = await loginRes.json();
      console.error('Login failed:', error);
      return;
    }

    const { token } = await loginRes.json();
    console.log('Login successful, token received.');

    const usersRes = await fetch('http://localhost:3000/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (usersRes.ok) {
      const data = await usersRes.json();
      console.log('Successfully fetched users:', data.users.length, 'users found.');
      if (data.users.length > 0) {
        console.log('First user:', data.users[0].name);
      }
    } else {
      const error = await usersRes.json();
      console.error('Failed to fetch users:', usersRes.status, error);
    }
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

verify();
