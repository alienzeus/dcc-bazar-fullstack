import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import History from '@/models/History';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { resetToken, password, otp } = await request.json();

    if (!resetToken || !password) {
      return NextResponse.json(
        { error: 'Please provide reset token and new password' },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Log password reset action
    await History.create({
      user: user._id,
      action: 'password_change',
      resource: 'user',
      resourceId: user._id,
      description: `User ${user.name} reset password`,
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}