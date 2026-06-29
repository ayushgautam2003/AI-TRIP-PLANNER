import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import placesRoutes from './routes/places.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// Gzip all responses
app.use(compression());

// CORS
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));

// Body limit — prevent large payload attacks
app.use(express.json({ limit: '50kb' }));

// ── Rate limiters ────────────────────────────────────────────────────────────

// Auth: 10 attempts per 15 minutes (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Trip generation: 5 generations per hour per user
const tripGenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.headers.authorization || req.ip,
  message: { message: 'Trip generation limit reached. Please wait an hour before generating more trips.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: 200 requests per minute
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripGenLimiter, tripRoutes);
app.use('/api/places', placesRoutes);

// ── Health check — tests every pipeline ─────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const checks = {};

  // 1. MongoDB
  const dbState = mongoose.connection.readyState;
  checks.database = dbState === 1
    ? { status: 'ok', message: 'Connected' }
    : { status: 'down', message: `readyState=${dbState}` };

  // 2. OpenAI / AI service
  checks.ai = process.env.OPENAI_API_KEY
    ? { status: 'ok', message: 'API key configured' }
    : { status: 'unconfigured', message: 'OPENAI_API_KEY missing' };

  // 3. Google Places
  checks.places = process.env.GOOGLE_PLACES_API_KEY
    ? { status: 'ok', message: 'API key configured' }
    : { status: 'unconfigured', message: 'GOOGLE_PLACES_API_KEY missing — photo fallback active' };

  const allOk = Object.values(checks).every(c => c.status === 'ok' || c.status === 'unconfigured');
  const anyDown = Object.values(checks).some(c => c.status === 'down');

  res.status(anyDown ? 503 : 200).json({
    status: anyDown ? 'down' : allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    services: checks,
  });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: 'Something went wrong. Please try again.' });
});

// ── Start ────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT);
  console.log(`Server running on port ${PORT}`);

  // Keep MongoDB Atlas M0 warm — ping every 4 minutes to prevent auto-pause
  if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
      try {
        const { default: Trip } = await import('./models/Trip.js');
        await Trip.findOne().lean();
      } catch { /* silent */ }
    }, 4 * 60 * 1000);
  }
});
