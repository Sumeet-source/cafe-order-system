import dbConnect from '../../../lib/mongodb';
import Order from '../../../lib/models/Order';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  await dbConnect();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const todayOrders = await Order.find({
    createdAt: { $gte: todayStart, $lte: todayEnd }
  }).lean();

  const yesterdayOrders = await Order.find({
    createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }
  }).lean();

  const sumRevenue = (list) =>
    list.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.totalAmount, 0);

  const revenue = sumRevenue(todayOrders);
  const prevRevenue = sumRevenue(yesterdayOrders);
  const totalOrders = todayOrders.length;
  const prevOrders = yesterdayOrders.length;

  const uniqueCustomers = new Set(todayOrders.map(o => o.customerName || 'Guest')).size;

  const delivered = todayOrders.filter(o => o.orderStatus === 'DELIVERED').length;
  const preparing = todayOrders.filter(o => o.orderStatus === 'PREPARING').length;
  const ready = todayOrders.filter(o => o.orderStatus === 'READY').length;
  const placed = todayOrders.filter(o => o.orderStatus === 'PLACED').length;
  const cancelled = todayOrders.filter(o => o.orderStatus === 'CANCELLED').length;

  const trend = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const hourly = Array(24).fill(0);
  todayOrders.forEach(o => {
    const h = new Date(o.createdAt).getHours();
    hourly[h]++;
  });

  const itemCounts = {};
  todayOrders.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    });
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const recentOrders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  res.json({
    revenue,
    totalOrders,
    uniqueCustomers,
    cancelled,
    delivered,
    preparing,
    ready,
    placed,
    topItems,
    hourly,
    recentOrders,
    trends: {
      revenue: trend(revenue, prevRevenue),
      orders: trend(totalOrders, prevOrders),
    },
  });
}