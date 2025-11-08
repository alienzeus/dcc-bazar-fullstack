import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Product from '@/models/Product';
import History from '@/models/History';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 100;
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');

    const query = { isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (brand && brand !== 'all') {
      query.brand = brand;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    return NextResponse.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Products fetch error:', error);
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
    
    // Generate SKU if not provided
    if (!body.sku) {
      const productCount = await Product.countDocuments();
      body.sku = `SKU-${(productCount + 1).toString().padStart(6, '0')}`;
    }

    const product = await Product.create(body);

    // Log the action
    await History.create({
      user: user._id,
      action: 'create',
      resource: 'product',
      resourceId: product._id,
      description: `Created new product: ${product.title}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true, 
      product 
    }, { status: 201 });

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}