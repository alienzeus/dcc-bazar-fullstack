import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';
import User from '@/models/User';
import History from '@/models/History';

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const uploadResult = await uploadImage(base64Image);

    // Update user photo
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        photo: {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url
        }
      },
      { new: true }
    ).select('-password');

    // Log the action
    await History.create({
      user: user._id,
      action: 'update',
      resource: 'user',
      resourceId: user._id,
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
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}