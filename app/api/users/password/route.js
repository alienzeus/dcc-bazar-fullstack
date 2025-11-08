import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import User from '@/models/User';
import History from '@/models/History';

export async function PUT(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Get user with password
    const userWithPassword = await User.findById(user._id);
    
    // Verify current password
    const isCurrentPasswordValid = await userWithPassword.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Update password
    userWithPassword.password = newPassword;
    await userWithPassword.save();

    // Log the action
    await History.create({
      user: user._id,
      action: 'password_change',
      resource: 'user',
      resourceId: user._id,
      description: `Changed password`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}