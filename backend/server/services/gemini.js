const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function askGeminiJSON(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent`;
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
        const t0 = Date.now();
        const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(60000),
      });
      console.log(`Gemini attempt ${attempt}: status ${res.status}, ${Date.now() - t0}ms`);
      const data = await res.json();

      if (res.status === 503 || res.status === 429) {
        lastError = new Error(`Gemini busy (${res.status})`);
        await sleep(attempt * 2000);
        continue;
      }
      if (!res.ok) throw new Error('Gemini error: ' + JSON.stringify(data));

      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (e) {
      lastError = e;
      await sleep(attempt * 1000);
    }
  }
  throw lastError;
}