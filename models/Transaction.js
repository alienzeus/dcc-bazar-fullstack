import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  referenceNo: {
    type: String,
    unique: true,
    sparse: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'mobile_banking', 'card', 'other'],
    default: 'cash',
  },
  brand: {
    type: String,
    enum: ['Go Baby', 'DCC Bazar', 'both', 'other'],
    required: true,
  },
  attachments: [{
    public_id: String,
    url: String,
    name: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ brand: 1 });

export default mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);