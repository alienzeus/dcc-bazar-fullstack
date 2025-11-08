import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Use the same MONGODB_URI as your .env file
const MONGODB_URI = "mongodb+srv://privatune:zeus1@privatune.3g2aavi.mongodb.net/DCC?retryWrites=true&w=majority&appName=privatune";

// Use the exact same schema as your User model
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

// Add the password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createSuperAdmin() {
  try {
    // Connect to DB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Admin credentials
    const adminData = {
      name: "Super Admin",
      email: "superadmin@dccbazar.com",
      phone: "+8801000000000", 
      position: "Super Administrator",
      password: "admin123", // This will be hashed by the pre-save hook
      role: "superadmin",
      permissions: [
        'products:read', 'products:write', 'products:delete',
        'orders:read', 'orders:write', 'orders:delete',
        'customers:read', 'customers:write', 'customers:delete', 
        'users:read', 'users:write', 'users:delete',
        'analytics:read', 'settings:write'
      ],
      isActive: true
    };

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log("⚠️ Super admin already exists:", adminData.email);
      
      // Optionally update the existing admin
      console.log("🔄 Updating existing super admin...");
      existingAdmin.name = adminData.name;
      existingAdmin.phone = adminData.phone;
      existingAdmin.position = adminData.position;
      existingAdmin.role = adminData.role;
      existingAdmin.permissions = adminData.permissions;
      existingAdmin.isActive = true;
      
      // Only update password if it's different (plain text comparison)
      const isSamePassword = await existingAdmin.matchPassword(adminData.password);
      if (!isSamePassword) {
        existingAdmin.password = adminData.password; // This will trigger hashing
      }
      
      await existingAdmin.save();
      console.log("✅ Existing super admin updated successfully");
      process.exit(0);
    }

    // Create new admin
    const admin = new User(adminData);
    await admin.save();

    console.log("✅ Super admin created successfully!");
    console.log("📧 Email:", adminData.email);
    console.log("🔑 Password:", adminData.password);
    console.log("👤 Role:", adminData.role);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating super admin:", err);
    
    // More detailed error logging
    if (err.code === 11000) {
      console.error("💡 Duplicate email - admin already exists");
    }
    if (err.errors) {
      Object.keys(err.errors).forEach(key => {
        console.error(`💡 ${key}: ${err.errors[key].message}`);
      });
    }
    
    process.exit(1);
  }
}

// Handle script execution
createSuperAdmin();