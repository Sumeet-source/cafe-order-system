import dbConnect from '../../../lib/mongodb';
import Order from '../../../lib/models/Order';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  await dbConnect();

  if (req.method === 'GET') {
    const { status } = req.query;
    const query = status ? { orderStatus: status } : {};
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(100).lean();
    return res.json(orders);
  }

  res.status(405).end();
}
