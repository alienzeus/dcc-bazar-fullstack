import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Category from '@/models/Category';
import Product from '@/models/Product';
import History from '@/models/History';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const query = {};
    if (!includeInactive) {
      query.isActive = true;
    }

    const categories = await Category.find(query).sort({ name: 1 });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const body = await request.json();

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ 
      name: body.name,
      brand: body.brand 
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists for the selected brand' },
        { status: 400 }
      );
    }

    const category = await Category.create(body);

    // Log the action
    await History.create({
      user: user._id,
      action: 'create',
      resource: 'category',
      resourceId: category._id,
      description: `Created new category: ${category.name}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true, 
      category 
    }, { status: 201 });

  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}