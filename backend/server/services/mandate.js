import { z } from 'zod';
import { askGeminiJSON } from './gemini.js';

const PolicySchema = z.object({
  currency: z.string().default('USD'),
  per_purchase_limit: z.number().positive(),
  monthly_limit: z.number().positive(),
  approval_threshold: z.number().nonnegative(),
  allowed_categories: z.array(z.string()).min(1),
  expires_at: z.string().nullable().optional(),
});

function buildPrompt(text) {
  const today = new Date().toISOString().slice(0, 10);
  return `You convert a user's spending rules into JSON. Today's date is ${today}.
Return ONLY a JSON object with exactly these keys:
- currency (string, default "USD")
- per_purchase_limit (number, max amount for one purchase)
- monthly_limit (number, max total per month)
- approval_threshold (number, purchases above this need the user's approval)
- allowed_categories (array of lowercase strings)
- expires_at (string in YYYY-MM-DD, or null if no expiry is mentioned)
If a number is not mentioned by the user, use null for it. Do not invent values.

User rules: """${text}"""`;
}

export async function parseMandate(text) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await askGeminiJSON(buildPrompt(text));
      return PolicySchema.parse(raw);
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(
    'Could not understand the mandate. Please mention a per-purchase limit, a monthly limit, an approval threshold and allowed categories. (' + lastError.message + ')'
  );
}