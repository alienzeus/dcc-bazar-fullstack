import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['financial', 'sales', 'inventory', 'custom'],
    required: true,
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  summary: {
    totalIncome: Number,
    totalExpense: Number,
    netProfit: Number,
    totalSales: Number,
    totalOrders: Number,
    avgOrderValue: Number,
  },
  format: [{
    type: String,
    enum: ['pdf', 'csv', 'excel'],
  }],
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileUrl: String,
  fileKey: String,
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

reportSchema.index({ type: 1, createdAt: -1 });
reportSchema.index({ generatedBy: 1 });

export default mongoose.models.Report || mongoose.model('Report', reportSchema);