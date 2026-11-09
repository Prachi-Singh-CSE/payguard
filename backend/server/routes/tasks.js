import { Router } from 'express';
import Task from '../models/Task.js';
import Mandate from '../models/Mandate.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';
import { proposePurchase } from '../services/agent.js';
import { evaluate } from '../services/policy.js';
import { createOrder } from '../services/paypal.js';
import { log } from '../services/audit.js';

const router = Router();

async function spentThisMonth() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const rows = await Transaction.find({
    status: { $in: ['AWAITING_PAYMENT', 'COMPLETED'] },
    createdAt: { $gte: start },
  });
  return rows.reduce((sum, t) => sum + (t.amount || 0), 0);
}

async function startPayment(task) {
  const p = task.proposal;
  const { orderId, approveUrl } = await createOrder(
    p.total.toFixed(2),
    `${p.quantity} x ${p.name}`
  );
  await Transaction.create({
    orderId, amount: p.total, description: p.name,
    status: 'AWAITING_PAYMENT', taskId: task._id,
  });
  task.orderId = orderId;
  task.approveUrl = approveUrl;
  task.status = 'AWAITING_PAYMENT';
  await task.save();
  await log(task._id, 'PAYPAL_ORDER_CREATED', `PayPal sandbox order ${orderId} created`);
}

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Please describe the task.' });

    const mandate = await Mandate.findOne({ active: true }).sort({ createdAt: -1 });
    if (!mandate) return res.status(400).json({ error: 'Create a mandate first.' });

    const task = await Task.create({ text, mandateId: mandate._id });
    await log(task._id, 'TASK_RECEIVED', text);

    const p = await proposePurchase(text);
    if (p.none) {
      task.status = 'NO_MATCH';
      task.reason = p.reason;
      await task.save();
      await log(task._id, 'NO_MATCH', p.reason);
      return res.json(task);
    }

    task.proposal = {
      itemId: p.item.id, name: p.item.name, category: p.item.category,
      vendor: p.item.vendor, quantity: p.quantity, unitPrice: p.item.price,
      total: p.total, agentReason: p.reason,
    };
    await log(task._id, 'AGENT_PROPOSAL', `${p.quantity} x ${p.item.name} = $${p.total}. ${p.reason}`);

    const result = evaluate(
      mandate.policy,
      { amount: p.total, category: p.item.category },
      await spentThisMonth()
    );
    task.decision = result.decision;
    task.reason = result.reason;
    await log(task._id, 'POLICY_DECISION', `${result.decision}: ${result.reason}`);

    if (result.decision === 'BLOCK') task.status = 'BLOCKED';
    if (result.decision === 'NEEDS_APPROVAL') task.status = 'PENDING_APPROVAL';
    await task.save();

    if (result.decision === 'APPROVE') await startPayment(task);
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ error: 'This task is not waiting for approval.' });
    }
    await log(task._id, 'HUMAN_APPROVED', 'The user approved this purchase');
    await startPayment(task);
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ error: 'This task is not waiting for approval.' });
    }
    task.status = 'REJECTED';
    await task.save();
    await log(task._id, 'HUMAN_REJECTED', 'The user rejected this purchase');
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/audit/all', async (req, res) => {
  res.json(await AuditLog.find().sort({ createdAt: -1 }).limit(100));
});

router.get('/', async (req, res) => {
  res.json(await Task.find().sort({ createdAt: -1 }).limit(50));
});

export default router;