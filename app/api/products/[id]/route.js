import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Product from '@/models/Product';
import History from '@/models/History';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const product = await Product.findById(params.id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Product fetch error:', error);
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
    const oldProduct = await Product.findById(params.id);

    const product = await Product.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Log the action
    await History.create({
      user: user._id,
      action: 'update',
      resource: 'product',
      resourceId: product._id,
      description: `Updated product: ${product.title}`,
      oldData: oldProduct,
      newData: product,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true, 
      product 
    });

  } catch (error) {
    console.error('Product update error:', error);
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

    const product = await Product.findById(params.id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    // Log the action
    await History.create({
      user: user._id,
      action: 'delete',
      resource: 'product',
      resourceId: product._id,
      description: `Deleted product: ${product.title}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Product deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}