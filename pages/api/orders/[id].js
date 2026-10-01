import dbConnect from '../../../lib/mongodb';
import Order from '../../../lib/models/Order';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { orderStatus } = req.body;
    const allowed = ['PLACED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
    if (!allowed.includes(orderStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const updated = await Order.findByIdAndUpdate(id, { orderStatus }, { new: true });
    return res.json(updated);
  }

  res.status(405).end();
}
