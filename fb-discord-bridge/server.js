import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import webhookRouter from './routes/webhook.js';
import orderRouter from './routes/order.js';
import { initDiscordBot } from './lib/discord.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (order form)
app.use(express.static(join(__dirname, 'public')));

// ── CORS (allow your React frontend origin) ──────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/webhook', webhookRouter);
app.use('/order', orderRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'jemrald-fb-discord-bridge', ts: new Date().toISOString() });
});

// Catch-all 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Boot ─────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await initDiscordBot();
    app.listen(PORT, () => {
      console.log(`\n🍱 Jemrald FB↔Discord Bridge running on port ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   Order form: http://localhost:${PORT}/order-form.html\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
