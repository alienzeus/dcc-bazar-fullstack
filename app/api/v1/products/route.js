import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { apiMiddleware } from '../middleware';

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products with filtering and pagination
 *     description: Retrieve a list of products with optional filtering, searching, and pagination
 *     tags: [Products]
 *     parameters: [ ... ] // Same as before
 *   post:
 *     summary: Create a new product
 *     description: Create a new product in the database
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - buyPrice
 *               - sellPrice
 *               - stock
 *               - category
 *               - brand
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Baby Diapers Size M"
 *               description:
 *                 type: string
 *                 example: "High-quality baby diapers"
 *               buyPrice:
 *                 type: number
 *                 example: 120
 *               sellPrice:
 *                 type: number
 *                 example: 180
 *               stock:
 *                 type: integer
 *                 example: 100
 *               minStock:
 *                 type: integer
 *                 example: 10
 *               category:
 *                 type: string
 *                 example: "Diapers"
 *               brand:
 *                 type: string
 *                 enum: [Go Baby, DCC Bazar]
 *                 example: "Go Baby"
 *               sku:
 *                 type: string
 *                 example: "SKU-000001"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["baby", "diapers", "size-m"]
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

// GET - Get all products (same as before)
export async function GET(request) {
  const middlewareResponse = await apiMiddleware(request);
  if (middlewareResponse.status !== 200) return middlewareResponse;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    const inStock = searchParams.get('inStock');

    const query = { isActive: true };
    
    if (category && category !== 'all') query.category = { $regex: category, $options: 'i' };
    if (brand && brand !== 'all') query.brand = brand;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    if (inStock === 'true') query.stock = { $gt: 0 };
    else if (inStock === 'false') query.stock = 0;

    const products = await Product.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    return NextResponse.json({
      success: true,
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });

  } catch (error) {
    console.error('API V1 - Products fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create a new product
export async function POST(request) {
  const middlewareResponse = await apiMiddleware(request);
  if (middlewareResponse.status !== 200) return middlewareResponse;

  try {
    await dbConnect();
    const body = await request.json();

    // Validation
    const requiredFields = ['title', 'buyPrice', 'sellPrice', 'stock', 'category', 'brand'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          missingFields 
        },
        { status: 400 }
      );
    }

    // Generate SKU if not provided
    if (!body.sku) {
      const productCount = await Product.countDocuments();
      body.sku = `SKU-${(productCount + 1).toString().padStart(6, '0')}`;
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: body.sku });
    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product with this SKU already exists' },
        { status: 400 }
      );
    }

    // Create product
    const product = await Product.create({
      title: body.title,
      description: body.description || '',
      buyPrice: parseFloat(body.buyPrice),
      sellPrice: parseFloat(body.sellPrice),
      stock: parseInt(body.stock),
      minStock: parseInt(body.minStock) || 5,
      category: body.category,
      brand: body.brand,
      sku: body.sku,
      tags: body.tags || [],
      images: body.images || [],
      isActive: body.isActive !== undefined ? body.isActive : true
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Product created successfully',
        product 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('API V1 - Product creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}