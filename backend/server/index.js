import 'dotenv/config';
import dns from 'dns';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import paymentRoutes from './routes/payments.js';
import mandateRoutes from './routes/mandate.js';

if (process.env.DNS_FIX === 'true') dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/payments', paymentRoutes);
app.use('/api/mandate', mandateRoutes);

await mongoose.connect(process.env.MONGO_URI);
console.log('MongoDB connected');

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));