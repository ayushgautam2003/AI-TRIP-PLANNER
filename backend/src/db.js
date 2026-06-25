import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

export async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
}
