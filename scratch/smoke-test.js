require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
const results = [];

function log(testId, testName, status, details = '') {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} ${testId}: ${testName} — ${status} ${details}`);
  results.push({ testId, testName, status, details });
}

async function loginAndGetToken(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function fetchWithAuth(url, token) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function runTests() {
  console.log('\n🧪 TASKFLOW SMOKE TEST SUITE — FINAL');
  console.log('═'.repeat(60));
  console.log('');

  // ──── TC-01: Login Page ────
  try {
    const res = await fetch(`${BASE_URL}/auth/login`);
    log('TC-01', 'Login page accessible', res.status === 200 ? 'PASS' : 'FAIL', `HTTP ${res.status}`);
  } catch (e) { log('TC-01', 'Login page accessible', 'FAIL', e.message); }

  // ──── TC-02: Master Admin Login ────
  let masterToken;
  try {
    const { status, data } = await loginAndGetToken('masteradmin@gmail.com', 'jake123');
    masterToken = data.token;
    log('TC-02', 'Master Admin login', status === 200 && !!masterToken ? 'PASS' : 'FAIL',
      `role=${data.user?.role}`);
  } catch (e) { log('TC-02', 'Master Admin login', 'FAIL', e.message); }
  await delay(1500);

  // ──── TC-03: Master Admin — Organizations ────
  if (masterToken) {
    try {
      const { status, data } = await fetchWithAuth('/api/master/organizations', masterToken);
      const orgs = Array.isArray(data) ? data : (data?.organizations || []);
      log('TC-03', 'Master Admin organizations', status === 200 ? 'PASS' : 'FAIL',
        `found ${orgs.length} org(s)`);
    } catch (e) { log('TC-03', 'Organizations', 'FAIL', e.message); }
  }

  // ──── TC-04: Master Admin — Support Requests ────
  if (masterToken) {
    try {
      const { status, data } = await fetchWithAuth('/api/master/support-requests', masterToken);
      log('TC-04', 'Master Admin support requests', status === 200 ? 'PASS' : 'FAIL',
        `${Array.isArray(data) ? data.length : 0} request(s)`);
    } catch (e) { log('TC-04', 'Support requests', 'FAIL', e.message); }
  }

  // ──── TC-05: Master Admin — /me ────
  if (masterToken) {
    try {
      const { status, data } = await fetchWithAuth('/api/auth/me', masterToken);
      // /me returns { user: { ... } }
      const user = data.user || data;
      log('TC-05', 'Master Admin /me', status === 200 && user.role ? 'PASS' : 'FAIL',
        `role=${user.role}, name=${user.name}`);
    } catch (e) { log('TC-05', '/me endpoint', 'FAIL', e.message); }
  }

  // ──── TC-06: Creator Login ────
  await delay(1500);
  let creatorToken;
  try {
    const { status, data } = await loginAndGetToken('jakeestenzo92@gmail.com', 'Jake12345');
    creatorToken = data.token;
    log('TC-06', 'Creator login (with org)', status === 200 && !!creatorToken ? 'PASS' : 'FAIL',
      `role=${data.user?.role}, orgId=${data.user?.orgId ? 'YES' : 'NO'}`);
  } catch (e) { log('TC-06', 'Creator login', 'FAIL', e.message); }
  await delay(1500);

  // ──── TC-07: Creator — /me trial data ────
  if (creatorToken) {
    try {
      const { status, data } = await fetchWithAuth('/api/auth/me', creatorToken);
      const user = data.user || data;
      const hasTrial = user.trialEndsAt !== undefined && user.trialEndsAt !== null;
      const hasSub = user.subscriptionStatus !== undefined && user.subscriptionStatus !== null;
      log('TC-07', 'Creator /me includes trial data', status === 200 && (hasTrial || hasSub) ? 'PASS' : 'FAIL',
        `trialEndsAt=${user.trialEndsAt || 'null'}, subStatus=${user.subscriptionStatus || 'null'}`);
    } catch (e) { log('TC-07', 'Creator /me trial data', 'FAIL', e.message); }
  }

  // ──── TC-08: Creator — Tasks ────
  if (creatorToken) {
    try {
      const { status } = await fetchWithAuth('/api/tasks', creatorToken);
      log('TC-08', 'Creator tasks endpoint', status === 200 ? 'PASS' : 'FAIL', `HTTP ${status}`);
    } catch (e) { log('TC-08', 'Creator tasks', 'FAIL', e.message); }
  }

  // ──── TC-09: Creator — Employees ────
  if (creatorToken) {
    try {
      const { status } = await fetchWithAuth('/api/users', creatorToken);
      log('TC-09', 'Creator employees endpoint', status === 200 ? 'PASS' : 'FAIL', `HTTP ${status}`);
    } catch (e) { log('TC-09', 'Creator employees', 'FAIL', e.message); }
  }

  // ──── TC-10: Creator — Support History ────
  if (creatorToken) {
    try {
      const { status } = await fetchWithAuth('/api/contact-admin', creatorToken);
      log('TC-10', 'Creator support history', status === 200 ? 'PASS' : 'FAIL', `HTTP ${status}`);
    } catch (e) { log('TC-10', 'Creator support', 'FAIL', e.message); }
  }

  // ──── TC-11: Head Admin Login ────
  await delay(1500);
  try {
    const { status, data } = await loginAndGetToken('esto.arnel03@gmail.com', 'Arnel12345');
    log('TC-11', 'Head Admin login', status === 200 && !!data.token ? 'PASS' : 'FAIL',
      `role=${data.user?.role}`);
  } catch (e) { log('TC-11', 'Head Admin login', 'FAIL', e.message); }
  await delay(1500);

  // ──── TC-12: Admin Login ────
  try {
    const { status, data } = await loginAndGetToken('threemusketeers979@gmail.com', 'Darlings12345');
    log('TC-12', 'Admin login', status === 200 && !!data.token ? 'PASS' : 'FAIL',
      `role=${data.user?.role}`);
  } catch (e) { log('TC-12', 'Admin login', 'FAIL', e.message); }
  await delay(1500);

  // ──── TC-13: Employee Login ────
  let employeeToken;
  try {
    const { status, data } = await loginAndGetToken('jake.estenzo12@gmail.com', 'Jake12345');
    employeeToken = data.token;
    log('TC-13', 'Employee login', status === 200 && !!data.token ? 'PASS' : 'FAIL',
      `role=${data.user?.role}`);
  } catch (e) { log('TC-13', 'Employee login', 'FAIL', e.message); }
  await delay(1500);

  // ──── TC-14: Employee — Tasks ────
  if (employeeToken) {
    try {
      const { status } = await fetchWithAuth('/api/tasks', employeeToken);
      log('TC-14', 'Employee tasks endpoint', status === 200 ? 'PASS' : 'FAIL', `HTTP ${status}`);
    } catch (e) { log('TC-14', 'Employee tasks', 'FAIL', e.message); }
  }

  // ──── TC-15: Stripe — No auth = 401 ────
  try {
    const res = await fetch(`${BASE_URL}/api/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    log('TC-15', 'Stripe rejects unauthenticated', res.status === 401 ? 'PASS' : 'FAIL',
      `HTTP ${res.status}`);
  } catch (e) { log('TC-15', 'Stripe no auth', 'FAIL', e.message); }

  // ──── TC-16: Stripe — Employee = 403 ────
  if (employeeToken) {
    try {
      const res = await fetch(`${BASE_URL}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${employeeToken}`, 'Content-Type': 'application/json' }
      });
      log('TC-16', 'Employee blocked from checkout', res.status === 403 ? 'PASS' : 'FAIL',
        `HTTP ${res.status}`);
    } catch (e) { log('TC-16', 'Employee blocked', 'FAIL', e.message); }
  }

  // ──── TC-17: Stripe — Creator gets 503 (no keys) ────
  if (creatorToken) {
    try {
      const res = await fetch(`${BASE_URL}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${creatorToken}`, 'Content-Type': 'application/json' }
      });
      // Should be 503 since no Stripe keys are configured
      log('TC-17', 'Creator checkout (no keys = 503)', res.status === 503 ? 'PASS' : 'FAIL',
        `HTTP ${res.status}`);
    } catch (e) { log('TC-17', 'Creator checkout', 'FAIL', e.message); }
  }

  // ──── TC-18: Activity Logs ────
  if (creatorToken) {
    try {
      const { status } = await fetchWithAuth('/api/activity-logs', creatorToken);
      log('TC-18', 'Activity logs endpoint', status === 200 ? 'PASS' : 'FAIL', `HTTP ${status}`);
    } catch (e) { log('TC-18', 'Activity logs', 'FAIL', e.message); }
  }

  // ──── RESULTS ────
  console.log('\n' + '═'.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('═'.repeat(60));
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`📈 Pass Rate: ${Math.round((passed / results.length) * 100)}%`);
  console.log('═'.repeat(60));

  if (failed > 0) {
    console.log('\n⚠️  FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   ${r.testId}: ${r.testName} — ${r.details}`);
    });
  } else {
    console.log('\n🎉 ALL TESTS PASSED! System is healthy.');
  }
}

runTests().catch(e => console.error('Test runner error:', e));
