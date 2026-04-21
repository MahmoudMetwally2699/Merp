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
  let text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
    console.log(data);
  } catch(e) {
    console.error("Vercel Response Error:", text);
    return;
  }
  token = data.data.token; // Save token

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

  console.log('\n--- 3. Testing Create Plan ---');
  // Setting intervalDays to 0 so nextBillingDate is today, allowing immediate invoicing
  res = await fetch(`${baseUrl}/plans`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name: 'Pro Plan',
      price: 99.99,
      intervalDays: 0 
    })
  });
  data = await res.json();
  console.log(data);
  planId = data.data.id;

  console.log('\n--- 4. Testing Create Customer ---');
  res = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name: 'John Doe',
      email: `john${timestamp}@doe.com`
    })
  });
  data = await res.json();
  console.log(data);
  customerId = data.data.id;

  console.log('\n--- 5. Testing Create Subscription ---');
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 35); // Set start date to 35 days ago so nextBillingDate is definitely in the past

  res = await fetch(`${baseUrl}/subscriptions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      customerId,
      planId,
      startDate: pastDate.toISOString()
    })
  });
  data = await res.json();
  console.log(data);
  subscriptionId = data.data.id;

  console.log('\n--- 6. Testing Billing: Generate Invoices ---');
  res = await fetch(`${baseUrl}/billing/generate-invoices`, {
    method: 'POST',
    headers: headers()
  });
  data = await res.json();
  console.log(data);

  // We need the invoice ID to pay it. Let's fetch it from the DB or just assume we have to add an endpoint?
  // Wait, the API doesn't have an endpoint to list invoices. Let's fetch the DB directly in the script since it's just a test.
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const invoices = await prisma.invoice.findMany({ where: { subscriptionId } });
  if (invoices.length > 0) {
    invoiceId = invoices[0].id;
    
    console.log('\n--- 7. Testing Payments ---');
    res = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        invoiceId,
        amount: 99.99
      })
    });
    data = await res.json();
    console.log(data);
  } else {
    console.log('No invoice was generated!');
  }

  console.log('\n--- 8. Testing Billing: Recognize Revenue ---');
  const now = new Date();
  res = await fetch(`${baseUrl}/billing/recognize-revenue`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      month: now.getMonth() + 1,
      year: now.getFullYear()
    })
  });
  data = await res.json();
  console.log(data);

  console.log('\n--- 9. Testing Reports: Income Statement ---');
  res = await fetch(`${baseUrl}/reports/income-statement?startDate=${now.getFullYear()}-01-01&endDate=${now.getFullYear()}-12-31`, {
    method: 'GET',
    headers: headers()
  });
  data = await res.json();
  console.log(data);

  console.log('\n--- 10. Testing Reports: Balance Sheet ---');
  res = await fetch(`${baseUrl}/reports/balance-sheet`, {
    method: 'GET',
    headers: headers()
  });
  data = await res.json();
  console.log(data);

  console.log('\n--- 11. Testing Cancel Subscription ---');
  res = await fetch(`${baseUrl}/subscriptions/${subscriptionId}/cancel`, {
    method: 'PUT',
    headers: headers()
  });
  data = await res.json();
  console.log(data);

  await prisma.$disconnect();
}

runAllTests().catch(console.error);
