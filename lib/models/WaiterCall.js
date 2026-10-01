import mongoose from 'mongoose';

const WaiterCallSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true },
  callType: {
    type: String,
    enum: ['WAITER', 'WATER', 'BILL'],
    default: 'WAITER',
  },
  note: { type: String, default: '' },
  status: {
    type: String,
    enum: ['PENDING', 'RESOLVED'],
    default: 'PENDING',
  },
}, { timestamps: true });

export default mongoose.models.WaiterCall || mongoose.model('WaiterCall', WaiterCallSchema);
