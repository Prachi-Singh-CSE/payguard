import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const start = Date.now();
try {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
    signal: AbortSignal.timeout(20000),
  });
  console.log('Status:', res.status, '|', ((Date.now() - start) / 1000).toFixed(1) + 's');
  const data = await res.json();
  console.log(
    (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''))
      .join('\n')
  );
} catch (e) {
  console.log('FAILED:', e.name, e.message, e.cause?.code || '');
}