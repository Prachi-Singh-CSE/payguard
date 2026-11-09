import { Router } from 'express';
import { parseMandate } from '../services/mandate.js';
import Mandate from '../models/Mandate.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.length < 10) return res.status(400).json({ error: 'Please describe your spending rules.' });
    const policy = await parseMandate(text);
    await Mandate.updateMany({ active: true }, { active: false });
    const mandate = await Mandate.create({ text, policy });
    res.json(mandate);
  } catch (e) {
    res.status(422).json({ error: e.message });
  }
});

router.get('/', async (req, res) => {
  res.json(await Mandate.findOne({ active: true }).sort({ createdAt: -1 }));
});

export default router;