// routes/demo.js
import { Router } from 'express';
import Task from '../models/Task.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';

const router = Router();

router.post('/reset', async (req, res) => {
  await Promise.all([Task.deleteMany({}), Transaction.deleteMany({}), AuditLog.deleteMany({})]);
  res.json({ ok: true });
});

export default router;