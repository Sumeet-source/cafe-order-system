import dbConnect from '../../../../lib/mongodb';
import Order from '../../../../lib/models/Order';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  await dbConnect();

  const { id } = req.query;
  const order = await Order.findById(id).lean();

  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Return only safe customer-facing fields (no admin data)
  res.json({
    _id: order._id,
    tableNumber: order.tableNumber,
    customerName: order.customerName,
    items: order.items,
    subtotal: order.subtotal,
    gstAmount: order.gstAmount,
    gstRate: order.gstRate,
    totalAmount: order.totalAmount,
    razorpayPaymentId: order.razorpayPaymentId,
    createdAt: order.createdAt,
    paymentStatus: order.paymentStatus,
  });
}
