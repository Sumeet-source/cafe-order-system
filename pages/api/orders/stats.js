import dbConnect from '../../../lib/mongodb';
import Order from '../../../lib/models/Order';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  await dbConnect();

  // Get today's date range
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch today's orders
  const orders = await Order.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  }).lean();

  // Calculate statistics
  const revenue = orders
    .filter(o => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalOrders = orders.length;
  const delivered = orders.filter(o => o.orderStatus === 'DELIVERED').length;
  const preparing = orders.filter(o => o.orderStatus === 'PREPARING').length;
  const ready = orders.filter(o => o.orderStatus === 'READY').length;
  const placed = orders.filter(o => o.orderStatus === 'PLACED').length;

  // Top selling items today
  const itemCounts = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    });
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  res.json({ revenue, totalOrders, delivered, preparing, ready, placed, topItems });
}
