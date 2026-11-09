import { Router } from 'express';
import { createOrder, captureOrder } from '../services/paypal.js';
import Transaction from '../models/Transaction.js';

const router = Router();

router.post('/create', async (req, res) => {
  try {
    const { amount, description } = req.body;
    const { orderId, approveUrl } = await createOrder(amount, description);
    await Transaction.create({ orderId, amount, description });
    res.json({ orderId, approveUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/capture', async (req, res) => {
  try {
    const { orderId } = req.body;
    const result = await captureOrder(orderId);
    await Transaction.findOneAndUpdate(
      { orderId },
      { status: result.status, captureId: result.captureId }
    );
    res.json(result);
  } catch (e) {
    await Transaction.findOneAndUpdate({ orderId: req.body.orderId }, { status: 'FAILED' });
    res.status(500).json({ error: e.message });
  }
});

router.get('/', async (req, res) => {
  res.json(await Transaction.find().sort({ createdAt: -1 }));
});

export default router;
