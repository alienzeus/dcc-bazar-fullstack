import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import User from '@/models/User';
import History from '@/models/History';

// Add GET method to fetch single user
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    // Only superadmin can access user details
    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const userData = await User.findById(params.id).select('-password');
    
    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    // Only superadmin can update users
    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const oldUser = await User.findById(params.id);

    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Log the action
    await History.create({
      user: user._id,
      action: 'update',
      resource: 'user',
      resourceId: updatedUser._id,
      description: `Updated user: ${updatedUser.name}`,
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
    console.error('User update error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    // Only superadmin can delete users
    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const userToDelete = await User.findById(params.id);
    
    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting superadmin
    if (userToDelete.role === 'superadmin') {
      return NextResponse.json(
        { error: 'Cannot delete superadmin user' },
        { status: 400 }
      );
    }

    // Soft delete
    userToDelete.isActive = false;
    await userToDelete.save();

    // Log the action
    await History.create({
      user: user._id,
      action: 'delete',
      resource: 'user',
      resourceId: userToDelete._id,
      description: `Deleted user: ${userToDelete.name}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}