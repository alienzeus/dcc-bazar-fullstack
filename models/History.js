import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create', 'update', 'delete', 'login', 'logout', 
      'password_change', 'status_change'
    ],
  },
  resource: {
    type: String,
    required: true,
    enum: ['product', 'order', 'customer', 'user', 'payment'],
  },
  resourceId: mongoose.Schema.Types.ObjectId,
  description: {
    type: String,
    required: true,
  },
  oldData: mongoose.Schema.Types.Mixed,
  newData: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String,
}, {
  timestamps: true,
});

historySchema.index({ user: 1, createdAt: -1 });
historySchema.index({ resource: 1, resourceId: 1 });

export default mongoose.models.History || mongoose.model('History', historySchema);