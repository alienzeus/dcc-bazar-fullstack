import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  position: {
    type: String,
    required: true,
  },
  photo: {
    public_id: String,
    url: String,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin'],
    default: 'admin',
  },
  permissions: [{
    type: String,
    enum: [
      'products:read',
      'products:write',
      'products:delete',
      'orders:read',
      'orders:write',
      'orders:delete',
      'customers:read',
      'customers:write',
      'customers:delete',
      'users:read',
      'users:write',
      'users:delete',
      'analytics:read',
      'settings:write'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  deviceInfo: {
    userAgent: String,
    ip: String,
    lastAccess: Date,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, {
  timestamps: true,
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);