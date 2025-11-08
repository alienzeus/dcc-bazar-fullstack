import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      photo: user.photo,
      position: user.position,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}