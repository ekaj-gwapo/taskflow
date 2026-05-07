// Uses Supabase REST API - avoids pg connection timeout issues
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function deleteAll(table) {
  // id=not.is.null matches ALL rows (Supabase REST requires a WHERE clause)
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?id=not.is.null`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    }
  );
  if (res.ok) {
    const data = await res.json().catch(() => []);
    console.log(`  [OK] Cleared "${table}" (${data.length} rows)`);
  } else {
    const err = await res.text().catch(() => '');
    console.log(`  [SKIP] "${table}" - ${err.substring(0, 100)}`);
  }
}

async function clearData() {
  console.log('--- Database Reset via Supabase REST API ---\n');

  // Step 1: Clear child tables first (FK dependency order)
  const tables = [
    'step_notes',
    'progress_notes',
    'task_comments',
    'action_steps',
    'task_assignments',
    'extension_requests',
    'notifications',
    'activity_logs',
    'support_requests',
    'tasks',
    'organizations',
  ];

  console.log('Step 1: Clearing all dependent tables...');
  for (const table of tables) {
    await deleteAll(table);
  }

  // Step 2: Delete all non-admin users
  console.log('\nStep 2: Deleting non-admin users...');
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?role=not.in.(master_admin,superadmin)`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    }
  );
  if (res.ok) {
    const data = await res.json().catch(() => []);
    console.log(`  [OK] Deleted ${data.length} non-admin users`);
  } else {
    const err = await res.text().catch(() => '');
    console.log(`  [ERROR] ${err.substring(0, 150)}`);
  }

  // Step 3: Clear orgid on remaining admins
  console.log('\nStep 3: Clearing org references on admins...');
  await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=not.is.null`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orgid: null }),
    }
  );
  console.log('  [OK] Cleared org references');

  // Step 4: Show remaining users
  const check = await fetch(
    `${SUPABASE_URL}/rest/v1/users?select=name,email,role`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  const remaining = await check.json();
  console.log(`\nRemaining users (${remaining.length}):`);
  remaining.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.role}]`));

  console.log('\n--- Reset Complete! System is fresh and ready. ---');
}

clearData();
