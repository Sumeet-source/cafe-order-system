import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  orderId:      { type: String, required: true, index: true },
  tableNumber:  { type: Number, required: true },
  customerName: { type: String, default: 'Guest' },
  rating:       { type: Number, required: true, min: 1, max: 5 },
  comment:      { type: String, default: '' },
  tags:         [{ type: String }],  // e.g., ["Fast service", "Great taste"]
}, { timestamps: true });

// One feedback per order
FeedbackSchema.index({ orderId: 1 }, { unique: true });

export default mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
