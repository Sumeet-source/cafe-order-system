import dbConnect from '../../../lib/mongodb';
import Order from '../../../lib/models/Order';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).end();
  await dbConnect();

  const { from, to, status, table } = req.query;

  const query = {};

  // Date range filter
  if (from || to) {
    query.createdAt = {};
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      query.createdAt.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = toDate;
    }
  }

  // Status filter
  if (status && status !== 'ALL') {
    query.orderStatus = status;
  }

  // Table filter
  if (table && table !== 'ALL') {
    query.tableNumber = Number(table);
  }

  const orders = await Order.find(query).sort({ createdAt: -1 }).limit(500).lean();

  // Calculate totals
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;

  res.json({ orders, totalRevenue, totalOrders });
}
