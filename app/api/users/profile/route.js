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
    const oldUser = await User.findById(user._id);

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
        position: body.position
      },
      { new: true, runValidators: true }
    ).select('-password');

    // Log the action
    await History.create({
      user: user._id,
      action: 'update',
      resource: 'user',
      resourceId: user._id,
      description: `Updated profile information`,
      oldData: oldUser,
      newData: updatedUser,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}