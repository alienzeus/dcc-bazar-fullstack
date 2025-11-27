import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Category from '@/models/Category';
import Product from '@/models/Product';
import History from '@/models/History';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const category = await Category.findById(params.id);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Category fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const body = await request.json();
    const oldCategory = await Category.findById(params.id);

    // Check for duplicate name
    const existingCategory = await Category.findOne({
      name: body.name,
      brand: body.brand,
      _id: { $ne: params.id }
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists for the selected brand' },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Log the action
    await History.create({
      user: user._id,
      action: 'update',
      resource: 'category',
      resourceId: category._id,
      description: `Updated category: ${category.name}`,
      oldData: oldCategory,
      newData: category,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true, 
      category 
    });

  } catch (error) {
    console.error('Category update error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const category = await Category.findById(params.id);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ 
      category: category.name,
      isActive: true 
    });
    
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. There are ${productCount} products associated with this category.` },
        { status: 400 }
      );
    }

    // Soft delete
    category.isActive = false;
    await category.save();

    // Log the action
    await History.create({
      user: user._id,
      action: 'delete',
      resource: 'category',
      resourceId: category._id,
      description: `Deleted category: ${category.name}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Category deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}