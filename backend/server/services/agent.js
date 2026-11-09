import { z } from 'zod';
import { askGeminiJSON } from './gemini.js';
import catalog from '../data/catalog.json' with { type: 'json' };

const ProposalSchema = z.object({
  item_id: z.string().nullable(),
  quantity: z.number().int().min(1).max(20).catch(1),
  reason: z.string(),
});

export async function proposePurchase(taskText) {
  const list = catalog.map(i => `${i.id} | ${i.name} | ${i.category} | $${i.price}`).join('\n');
  const prompt = `You are a purchasing assistant for a small team.
Choose the single best item from the catalog for the user's request.
Rules:
- Pick ONLY an id from the catalog below.
- Choose the cheapest item that clearly satisfies the request.
- If nothing fits, set item_id to null.
Return ONLY JSON: {"item_id": string or null, "quantity": integer, "reason": "one short sentence"}

Catalog (id | name | category | price):
${list}

Request: """${taskText}"""`;

  const p = ProposalSchema.parse(await askGeminiJSON(prompt));
  if (!p.item_id) return { none: true, reason: p.reason };

  const item = catalog.find(i => i.id === p.item_id);
  if (!item) throw new Error('The agent chose an item that is not in the catalog.');

  const total = Math.round(item.price * p.quantity * 100) / 100;
  return { none: false, item, quantity: p.quantity, total, reason: p.reason };
}