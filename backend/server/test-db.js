import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';

dns.setServers(['8.8.8.8', '1.1.1.1']);

await mongoose.connect(process.env.MONGO_URI);
console.log('MongoDB connected');
await mongoose.disconnect();