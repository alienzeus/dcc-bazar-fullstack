import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  lastOrder: {
    type: Date,
  },
  notes: String,
}, {
  timestamps: true,
});

customerSchema.index({ name: 'text', phone: 'text', email: 'text' });

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);