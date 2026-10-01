import dbConnect from '../../../lib/mongodb';
import WaiterCall from '../../../lib/models/WaiterCall';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  await dbConnect();

  // GET: admin fetches pending calls
  if (req.method === 'GET') {
    if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const calls = await WaiterCall.find({ status: 'PENDING' }).sort({ createdAt: -1 }).lean();
    return res.json(calls);
  }

  // POST: customer creates a new call
  if (req.method === 'POST') {
    const { tableNumber, callType, note } = req.body || {};
    if (!tableNumber) return res.status(400).json({ error: 'Table number required' });

    // Prevent spam: only one pending call per table
    const existing = await WaiterCall.findOne({
      tableNumber: Number(tableNumber),
      status: 'PENDING',
    });
    if (existing) {
      return res.status(429).json({ error: 'A call is already pending for this table' });
    }

    const call = await WaiterCall.create({
      tableNumber: Number(tableNumber),
      callType: callType || 'WAITER',
      note: note || '',
    });
    return res.status(201).json(call);
  }

  // PUT: admin resolves a call
  if (req.method === 'PUT') {
    if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Call ID required' });
    await WaiterCall.findByIdAndUpdate(id, { status: 'RESOLVED' });
    return res.json({ success: true });
  }

  res.status(405).end();
}
