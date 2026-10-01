import crypto from 'crypto';
import dbConnect from '../../../lib/mongodb';
import Order from '../../../lib/models/Order';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  await dbConnect();

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    tableNumber,
    items,
    totalAmount,
    customerName,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment fields' });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Calculate GST breakdown (5% inclusive)
  const gstRate = 5;
  const total = Number(totalAmount);
  const subtotal = +(total / (1 + gstRate / 100)).toFixed(2);
  const gstAmount = +(total - subtotal).toFixed(2);

  const order = await Order.create({
    tableNumber:       Number(tableNumber),
    customerName:      customerName || 'Guest',
    items,
    subtotal,
    gstAmount,
    gstRate,
    totalAmount:       total,
    razorpayOrderId:   razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    paymentStatus:     'PAID',
    orderStatus:       'PLACED',
  });

  res.json({ success: true, orderId: order._id.toString() });
}
