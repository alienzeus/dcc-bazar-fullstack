import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    await requireAuth(request);

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

    return NextResponse.json({
      success: true,
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      url: uploadResult.url
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}