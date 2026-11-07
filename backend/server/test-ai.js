import 'dotenv/config';

const MODEL = 'gemini-3.8-flash';
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Say hello in one short sentence.' }] }],
    }),
  }
);
const data = await res.json();
console.log(JSON.stringify(data, null, 2));