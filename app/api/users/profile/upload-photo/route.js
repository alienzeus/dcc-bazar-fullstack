import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';
import User from '@/models/User';
import History from '@/models/History';

export async function POST(request) {
  try {
    const currentUser = await requireAuth(request);
    await dbConnect();

    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer for Cloudinary
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await uploadImage(buffer, {
      folder: 'users',
      transformation: [
        { width: 300, height: 300, crop: 'fill' },
        { quality: 'auto' },
        { format: 'webp' }
      ]
    });

    // Update current user's photo
    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      {
        photo: {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url
        }
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Log the action
    await History.create({
      user: currentUser._id,
      action: 'update',
      resource: 'user',
      resourceId: currentUser._id,
      description: 'Updated profile photo',
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      photo: updatedUser.photo
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}