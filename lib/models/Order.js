import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  menuItemId: String,
  name:       String,
  price:      Number,
  quantity:   Number,
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  tableNumber:       { type: Number, required: true },
  customerName:      { type: String, default: 'Guest' },
  items:             [OrderItemSchema],
  subtotal:          { type: Number, default: 0 },   // NEW
  gstAmount:         { type: Number, default: 0 },   // NEW
  gstRate:           { type: Number, default: 5 },   // NEW (5%)
  totalAmount:       { type: Number, required: true },
  razorpayOrderId:   String,
  razorpayPaymentId: String,
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING',
  },
  orderStatus: {
    type: String,
    enum: ['PLACED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'],
    default: 'PLACED',
  },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
