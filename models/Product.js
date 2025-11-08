import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  images: [{
    public_id: String,
    url: String,
  }],
  buyPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  sellPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  minStock: {
    type: Number,
    default: 5,
  },
  category: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    enum: ['Go Daddy', 'DCC Bazar'],
    required: true,
  },
  sku: {
    type: String,
    unique: true,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  salesCount: {
    type: Number,
    default: 0,
  },
  tags: [String],
}, {
  timestamps: true,
});

productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ brand: 1, category: 1 });

export default mongoose.models.Product || mongoose.model('Product', productSchema);