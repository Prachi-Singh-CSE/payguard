const BASE = process.env.PAYPAL_BASE;
let cached = { token: null, expiresAt: 0 };

async function getToken() {
  if (cached.token && Date.now() < cached.expiresAt) return cached.token;
  const basic = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const d = await r.json();
  if (!d.access_token) throw new Error('PayPal auth failed: ' + JSON.stringify(d));
  cached = { token: d.access_token, expiresAt: Date.now() + (d.expires_in - 60) * 1000 };
  return cached.token;
}

export async function createOrder(amount, description) {
  const token = await getToken();
  const r = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ description, amount: { currency_code: 'USD', value: String(amount) } }],
      payment_source: { paypal: { experience_context: {
        return_url: `${process.env.CLIENT_URL}/success`,
        cancel_url: `${process.env.CLIENT_URL}/cancel`,
      } } },
    }),
  });
  const d = await r.json();
  if (!d.id) throw new Error('Create order failed: ' + JSON.stringify(d));
  const approveUrl = d.links?.find(l => l.rel === 'payer-action' || l.rel === 'approve')?.href;
  return { orderId: d.id, approveUrl };
}

export async function captureOrder(orderId) {
  const token = await getToken();
  const r = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const d = await r.json();
  if (d.status !== 'COMPLETED') throw new Error('Capture failed: ' + JSON.stringify(d));
  const captureId = d.purchase_units?.[0]?.payments?.captures?.[0]?.id;
  return { status: d.status, captureId };
}