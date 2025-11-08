import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import User from '@/models/User';
import History from '@/models/History';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    // Only superadmin can access all users
    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 100;
    const search = searchParams.get('search');

    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    return NextResponse.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    
    // Only superadmin can create users
    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    
    // Check if user with same email exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const newUser = await User.create({
      ...body,
      role: 'admin' // Only superadmin can create, so new users are always admin
    });

    // Don't include password in response
    const userResponse = await User.findById(newUser._id).select('-password');

    // Log the action
    await History.create({
      user: user._id,
      action: 'create',
      resource: 'user',
      resourceId: newUser._id,
      description: `Created new user: ${newUser.name}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true, 
      user: userResponse 
    }, { status: 201 });

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}