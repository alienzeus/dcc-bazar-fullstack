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
      'password_change', 'status_change', 'pathao_send'
    ],
  },
  resource: {
    type: String,
    required: true,
    enum: ['product', 'order', 'customer', 'user', 'payment', 'category', 'pathao_send'],
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

  // Add middleware to set Dhaka time before saving
historySchema.pre('save', function(next) {
  if (this.isNew) {
    this.dhakaTime = new Date().toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  next();
});

historySchema.index({ user: 1, createdAt: -1 });
historySchema.index({ resource: 1, resourceId: 1 });

export default mongoose.models.History || mongoose.model('History', historySchema);