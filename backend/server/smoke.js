import 'dotenv/config';

const BASE = process.env.PAYPAL_BASE;
const basic = Buffer.from(
  `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
).toString('base64');

async function getToken() {
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const d = await r.json();
  if (!d.access_token) throw new Error(JSON.stringify(d));
  return d.access_token;
}

const [, , cmd, orderId] = process.argv;
const token = await getToken();
console.log('Token OK');

if (cmd === 'create') {
  const r = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: 'USD', value: '10.00' } }],
      payment_source: { paypal: { experience_context: {
        return_url: 'http://localhost:5173/success',
        cancel_url: 'http://localhost:5173/cancel',
      } } },
    }),
  });
  const d = await r.json();
  const link = d.links?.find(l => l.rel === 'payer-action' || l.rel === 'approve')?.href;
  console.log('Order ID:', d.id, '\nApprove here:', link);
}

if (cmd === 'capture') {
  const r = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  console.log(JSON.stringify(await r.json(), null, 2));
}