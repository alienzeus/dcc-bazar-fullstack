import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import History from '@/models/History';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide email and password' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email, isActive: true });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login and device info
    user.lastLogin = new Date();
    user.deviceInfo = {
      userAgent: request.headers.get('user-agent') || '',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      lastAccess: new Date(),
    };
    await user.save();

    // Log login action
    await History.create({
      user: user._id,
      action: 'login',
      resource: 'user',
      resourceId: user._id,
      description: `User ${user.name} logged in`,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || '',
    });

    const token = generateToken(user._id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        photo: user.photo,
        position: user.position,
      },
      token,
    });

    // Set cookie for 7 days
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const { verifyToken } = await import('@/lib/auth');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ user: null });
    }

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        photo: user.photo,
        position: user.position,
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ user: null });
  }
}