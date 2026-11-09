import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const start = Date.now();

try {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Return JSON: {"ok": true}' }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(90000),
    }
  );
  console.log('Status:', res.status, '| Time:', ((Date.now() - start) / 1000).toFixed(1) + 's');
  console.log((await res.text()).slice(0, 300));
} catch (e) {
  console.log('FAILED after', ((Date.now() - start) / 1000).toFixed(1) + 's:', e.name, e.message);
}