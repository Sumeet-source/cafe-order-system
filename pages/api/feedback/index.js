import dbConnect from '../../../lib/mongodb';
import Feedback from '../../../lib/models/Feedback';
import Order from '../../../lib/models/Order';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  await dbConnect();

  // GET: admin fetches all feedback + stats
  if (req.method === 'GET') {
    if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    const feedbacks = await Feedback.find({}).sort({ createdAt: -1 }).limit(200).lean();

    // Calculate stats
    const totalReviews = feedbacks.length;
    const avgRating = totalReviews > 0
      ? +(feedbacks.reduce((s, f) => s + f.rating, 0) / totalReviews).toFixed(1)
      : 0;

    // Rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach(f => { distribution[f.rating] += 1; });

    return res.json({ feedbacks, avgRating, totalReviews, distribution });
  }

  // POST: customer submits feedback
  if (req.method === 'POST') {
    const { orderId, rating, comment, tags } = req.body || {};

    if (!orderId || !rating) {
      return res.status(400).json({ error: 'Order ID and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if already submitted
    const existing = await Feedback.findOne({ orderId });
    if (existing) {
      return res.status(429).json({ error: 'Feedback already submitted for this order' });
    }

    // Fetch order to get table + customer name
    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const feedback = await Feedback.create({
      orderId,
      tableNumber: order.tableNumber,
      customerName: order.customerName || 'Guest',
      rating: Number(rating),
      comment: comment || '',
      tags: tags || [],
    });

    return res.status(201).json({ success: true, feedbackId: feedback._id });
  }

  res.status(405).end();
}
