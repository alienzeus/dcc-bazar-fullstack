import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  deliveryPerson: {
    name: {
      type: String,
      required: true,
    },
    phone: String,
    type: {
      type: String,
      enum: ['pathao', 'delivery_person'],
      required: true,
    },
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending',
  },
  paidDate: Date,
  notes: String,
  orderReferences: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  }],
}, {
  timestamps: true,
});

paymentSchema.index({ dueDate: 1, status: 1 });
paymentSchema.index({ 'deliveryPerson.type': 1 });

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);