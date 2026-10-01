import dbConnect from '../../../lib/mongodb';
import Order from '../../../lib/models/Order';
import { requireAdmin } from '../../../lib/auth';

// Helper to escape CSV values
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).end();
  await dbConnect();

  const { from, to, status, table, export: exportType } = req.query;

  const query = {};

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

  if (status && status !== 'ALL') query.orderStatus = status;
  if (table && table !== 'ALL') query.tableNumber = Number(table);

  const orders = await Order.find(query).sort({ createdAt: -1 }).limit(5000).lean();

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // ===== CSV EXPORT MODE =====
  if (exportType === 'csv') {
    const headers = [
      'Order ID',
      'Date',
      'Time',
      'Table',
      'Customer',
      'Items',
      'Total Amount (₹)',
      'Payment Status',
      'Order Status',
      'Razorpay Payment ID',
    ];

    const rows = orders.map((o) => {
      const d = new Date(o.createdAt);
      const itemsStr = o.items
        .map((it) => `${it.quantity}x ${it.name} @₹${it.price}`)
        .join(' | ');
      return [
        o._id.toString(),
        d.toLocaleDateString('en-IN'),
        d.toLocaleTimeString('en-IN'),
        `Table ${o.tableNumber}`,
        o.customerName || 'Guest',
        itemsStr,
        o.totalAmount,
        o.paymentStatus || '',
        o.orderStatus || '',
        o.razorpayPaymentId || '',
      ];
    });

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map((r) => r.map(escapeCSV).join(',')),
    ].join('\n');

    const filename = `HouseBirdCafe_Orders_${from || 'all'}_to_${to || 'all'}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // Add BOM so Excel opens Unicode properly
    return res.send('\uFEFF' + csv);
  }

  // ===== SUMMARY CSV EXPORT =====
  if (exportType === 'summary') {
    // Group by date
    const grouped = {};
    orders.forEach((o) => {
      const dateKey = new Date(o.createdAt).toLocaleDateString('en-IN');
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          totalOrders: 0,
          revenue: 0,
          delivered: 0,
          cancelled: 0,
        };
      }
      grouped[dateKey].totalOrders += 1;
      if (o.paymentStatus === 'PAID') grouped[dateKey].revenue += o.totalAmount;
      if (o.orderStatus === 'DELIVERED') grouped[dateKey].delivered += 1;
      if (o.orderStatus === 'CANCELLED') grouped[dateKey].cancelled += 1;
    });

    const summaryRows = Object.values(grouped);
    const headers = ['Date', 'Total Orders', 'Revenue (₹)', 'Delivered', 'Cancelled'];
    const rows = summaryRows.map((r) => [
      r.date,
      r.totalOrders,
      r.revenue,
      r.delivered,
      r.cancelled,
    ]);

    // Grand total row
    const grandTotal = summaryRows.reduce(
      (acc, r) => ({
        orders: acc.orders + r.totalOrders,
        revenue: acc.revenue + r.revenue,
        delivered: acc.delivered + r.delivered,
        cancelled: acc.cancelled + r.cancelled,
      }),
      { orders: 0, revenue: 0, delivered: 0, cancelled: 0 }
    );
    rows.push(['GRAND TOTAL', grandTotal.orders, grandTotal.revenue, grandTotal.delivered, grandTotal.cancelled]);

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map((r) => r.map(escapeCSV).join(',')),
    ].join('\n');

    const filename = `HouseBirdCafe_Summary_${from || 'all'}_to_${to || 'all'}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send('\uFEFF' + csv);
  }

  // ===== NORMAL JSON MODE =====
  res.json({ orders, totalRevenue, totalOrders: orders.length });
}
