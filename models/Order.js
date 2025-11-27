import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  courierCharge: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  dueAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bkash', 'nogod', 'bank'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'due', 'partial'],
    default: 'due',
  },
  deliveryMethod: {
    type: String,
    enum: ['pathao', 'delivery_person', 'pickup'],
    required: true,
  },
  deliveryPerson: {
    name: String,
    phone: String,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  brand: {
    type: String,
    enum: ['Go Baby', 'DCC Bazar'],
    required: true,
  },
  // Pathao Integration Fields
  pathaoConsignmentId: {
    type: String,
    sparse: true
  },
  pathaoStatus: {
    type: String,
    enum: ['Pending', 'Picked', 'Shipped', 'Delivered', 'Cancelled', 'Returned']
  },
  pathaoUpdatedAt: {
    type: Date
  },
  pathaoDeliveryFee: {
    type: Number,
    min: 0
  },
  pathaoTrackingUrl: {
    type: String
  },
  notes: String,
  invoiceUrl: String,
  qrCode: String,
}, {
  timestamps: true,
});

orderSchema.pre('save', function(next) {
  this.dueAmount = this.totalAmount - this.paidAmount;
  
  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'paid';
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'due';
  }
  
  next();
});

orderSchema.index({ customer: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ brand: 1, status: 1 });
orderSchema.index({ pathaoStatus: 1 });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);