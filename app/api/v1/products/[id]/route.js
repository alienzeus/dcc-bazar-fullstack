import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { apiMiddleware } from '../../middleware';

// GET - Get single product (same as before)
export async function GET(request, { params }) {
  const middlewareResponse = await apiMiddleware(request);
  if (middlewareResponse.status !== 200) return middlewareResponse;

  try {
    await dbConnect();
    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id).select('-__v');
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });

  } catch (error) {
    console.error('API V1 - Product fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT - Update a product
export async function PUT(request, { params }) {
  const middlewareResponse = await apiMiddleware(request);
  if (middlewareResponse.status !== 200) return middlewareResponse;

  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if SKU is being changed and if it's already taken
    if (body.sku && body.sku !== existingProduct.sku) {
      const productWithSameSKU = await Product.findOne({ sku: body.sku });
      if (productWithSameSKU) {
        return NextResponse.json(
          { success: false, error: 'SKU already exists' },
          { status: 400 }
        );
      }
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { 
        $set: {
          title: body.title,
          description: body.description,
          buyPrice: body.buyPrice,
          sellPrice: body.sellPrice,
          stock: body.stock,
          minStock: body.minStock,
          category: body.category,
          brand: body.brand,
          sku: body.sku,
          tags: body.tags,
          images: body.images,
          isActive: body.isActive
        }
      },
      { new: true, runValidators: true }
    ).select('-__v');

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('API V1 - Product update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product (soft delete)
export async function DELETE(request, { params }) {
  const middlewareResponse = await apiMiddleware(request);
  if (middlewareResponse.status !== 200) return middlewareResponse;

  try {
    await dbConnect();
    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await Product.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('API V1 - Product deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}