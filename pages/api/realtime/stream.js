import dbConnect from '../../../lib/mongodb';
import Order from '../../../lib/models/Order';
import WaiterCall from '../../../lib/models/WaiterCall';
import { requireAdmin } from '../../../lib/auth';

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!requireAdmin(req)) return res.status(401).end();

  try {
    await dbConnect();
  } catch (e) {
    return res.status(500).end();
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event, data) => {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {}
  };

  const loadState = async () => {
    const [placed, preparing, ready, waiterCalls] = await Promise.all([
      Order.find({ orderStatus: 'PLACED' }).sort({ createdAt: -1 }).limit(100).lean(),
      Order.find({ orderStatus: 'PREPARING' }).sort({ createdAt: -1 }).limit(100).lean(),
      Order.find({ orderStatus: 'READY' }).sort({ createdAt: -1 }).limit(100).lean(),
      WaiterCall.find({ status: 'PENDING' }).sort({ createdAt: -1 }).lean(),
    ]);
    return {
      placed: JSON.parse(JSON.stringify(placed)),
      preparing: JSON.parse(JSON.stringify(preparing)),
      ready: JSON.parse(JSON.stringify(ready)),
      waiterCalls: JSON.parse(JSON.stringify(waiterCalls)),
    };
  };

  // Send initial state
  try {
    const state = await loadState();
    send('init', state);
  } catch {
    send('init', { placed: [], preparing: [], ready: [], waiterCalls: [] });
  }

  // Poll DB internally every 2 seconds, push updates via SSE
  const interval = setInterval(async () => {
    try {
      const state = await loadState();
      send('update', state);
    } catch {
      // skip on error, keep connection alive
    }
  }, 2000);

  // Heartbeat to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch {}
  }, 15000);

  // Cleanup on disconnect
  const cleanup = () => {
    clearInterval(interval);
    clearInterval(heartbeat);
    try { res.end(); } catch {}
  };

  req.on('close', cleanup);
  req.on('aborted', cleanup);
}