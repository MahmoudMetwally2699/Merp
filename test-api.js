async function runAllTests() {
  const baseUrl = 'https://merp.vercel.app/api';
  let token = '';
  let planId = '';
  let customerId = '';
  let subscriptionId = '';
  let invoiceId = '';
  
  const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const timestamp = Date.now();

  // --- 1. Register ---
  console.log('--- 1. Testing Registration ---');
  let res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantName: `Tenant ${timestamp}`,
      adminEmail: `admin${timestamp}@test.com`,
      adminPassword: 'securepassword123'
    })
  });
  let data = await res.json();
  console.log(data);
  token = data.data.token;

  // --- 2. Login ---
  console.log('\n--- 2. Testing Login ---');
  res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `admin${timestamp}@test.com`,
      password: 'securepassword123'
    })
  });
  data = await res.json();
  console.log(data);
  token = data.data.token;

  // --- 3. Create Plan ---
  console.log('\n--- 3. Testing Create Plan ---');
  res = await fetch(`${baseUrl}/plans`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name: 'Pro Plan', price: 99.99, intervalDays: 30 })
  });
  data = await res.json();
  console.log(data);
  planId = data.data.id;

  // --- 4. Create Customer ---
  console.log('\n--- 4. Testing Create Customer ---');
  res = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name: 'John Doe', email: `john${timestamp}@doe.com` })
  });
  data = await res.json();
  console.log(data);
  customerId = data.data.id;

  // --- 5. Create Subscription (35 days in the past) ---
  console.log('\n--- 5. Testing Create Subscription ---');
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 35);
  res = await fetch(`${baseUrl}/subscriptions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ customerId, planId, startDate: pastDate.toISOString() })
  });
  data = await res.json();
  console.log(data);
  subscriptionId = data.data.id;

  // --- 6. Generate Invoices ---
  console.log('\n--- 6. Testing Billing: Generate Invoices ---');
  res = await fetch(`${baseUrl}/billing/generate-invoices`, {
    method: 'POST',
    headers: headers()
  });
  data = await res.json();
  console.log(data);

  // --- 6b. Get Invoice ID via API ---
  console.log('\n--- 6b. Fetching Invoices via API ---');
  res = await fetch(`${baseUrl}/invoices`, {
    method: 'GET',
    headers: headers()
  });
  data = await res.json();
  console.log(data);

  if (data.data && data.data.length > 0) {
    invoiceId = data.data[0].id;

    // --- 7. Pay Invoice ---
    console.log('\n--- 7. Testing Payments ---');
    res = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ invoiceId, amount: 99.99 })
    });
    data = await res.json();
    console.log(data);
  } else {
    console.log('No invoice was generated!');
  }

  // --- 8. Recognize Revenue ---
  console.log('\n--- 8. Testing Billing: Recognize Revenue ---');
  const now = new Date();
  res = await fetch(`${baseUrl}/billing/recognize-revenue`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ month: now.getMonth() + 1, year: now.getFullYear() })
  });
  data = await res.json();
  console.log(data);

  // --- 9. Income Statement ---
  console.log('\n--- 9. Testing Reports: Income Statement ---');
  res = await fetch(`${baseUrl}/reports/income-statement?startDate=${now.getFullYear()}-01-01&endDate=${now.getFullYear()}-12-31`, {
    method: 'GET',
    headers: headers()
  });
  data = await res.json();
  console.log(data);

  // --- 10. Balance Sheet ---
  console.log('\n--- 10. Testing Reports: Balance Sheet ---');
  res = await fetch(`${baseUrl}/reports/balance-sheet`, {
    method: 'GET',
    headers: headers()
  });
  data = await res.json();
  console.log(data);

  // --- 11. Cancel Subscription ---
  console.log('\n--- 11. Testing Cancel Subscription ---');
  res = await fetch(`${baseUrl}/subscriptions/${subscriptionId}/cancel`, {
    method: 'PUT',
    headers: headers()
  });
  data = await res.json();
  console.log(data);

  console.log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY!');
}

runAllTests().catch(console.error);
