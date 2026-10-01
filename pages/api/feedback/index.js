import dbConnect from '../../../lib/mongodb';
import Feedback from '../../../lib/models/Feedback';
import Order from '../../../lib/models/Order';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await dbConnect();
  } catch (err) {
    return res.status(500).json({ error: 'Database connection failed' });
  }

  // GET: admin fetches all feedback + stats
  if (req.method === 'GET') {
    if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const feedbacks = await Feedback.find({}).sort({ createdAt: -1 }).limit(200).lean();

      const totalReviews = feedbacks.length;
      const avgRating = totalReviews > 0
        ? +(feedbacks.reduce((s, f) => s + f.rating, 0) / totalReviews).toFixed(1)
        : 0;

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      feedbacks.forEach(f => { distribution[f.rating] += 1; });

      return res.json({ feedbacks, avgRating, totalReviews, distribution });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
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

    try {
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
    } catch (err) {
      // Handle invalid ObjectId format
      if (err.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid order ID format' });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
