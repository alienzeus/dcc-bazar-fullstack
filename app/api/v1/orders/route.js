import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import { apiMiddleware } from '../middleware';

// GET - Get all orders (same as before)
export async function GET(request) {
  const middlewareResponse = await apiMiddleware(request);
  if (middlewareResponse.status !== 200) return middlewareResponse;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const brand = searchParams.get('brand');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;
    if (brand && brand !== 'all') query.brand = brand;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const orders = await Order.find(query)
      .populate('customer', 'name phone email address')
      .populate('items.product', 'title images buyPrice sellPrice sku')
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    return NextResponse.json({
      success: true,
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });

  } catch (error) {
    console.error('API V1 - Orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST - Create a new order
export async function POST(request) {
  const middlewareResponse = await apiMiddleware(request);
  if (middlewareResponse.status !== 200) return middlewareResponse;

  try {
    await dbConnect();
    const body = await request.json();

    // Validation
    const requiredFields = ['customer', 'items', 'paymentMethod', 'deliveryMethod', 'brand'];
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

    // Validate items
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must have at least one item' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${(orderCount + 1).toString().padStart(4, '0')}`;

    // Create or find customer
    let customer = await Customer.findOne({ phone: body.customer.phone });
    if (!customer) {
      customer = await Customer.create({
        name: body.customer.name,
        phone: body.customer.phone,
        email: body.customer.email,
        address: body.customer.address
      });
    }

    // Calculate totals and update product stocks
    let subtotal = 0;
    const orderItems = [];

    for (const item of body.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product not found: ${item.product}`);
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.title}` },
          { status: 400 }
        );
      }

      // Update product stock and sales count
      product.stock -= item.quantity;
      product.salesCount += item.quantity;
      await product.save();

      const itemTotal = item.quantity * item.price;
      subtotal += itemTotal;

      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal
      });
    }

    const totalAmount = subtotal + (body.courierCharge || 0);
    const paidAmount = body.paidAmount || 0;

    // Create order
    const order = await Order.create({
      orderNumber,
      customer: customer._id,
      items: orderItems,
      subtotal,
      courierCharge: body.courierCharge || 0,
      totalAmount,
      paidAmount,
      dueAmount: totalAmount - paidAmount,
      paymentMethod: body.paymentMethod,
      deliveryMethod: body.deliveryMethod,
      deliveryPerson: body.deliveryPerson,
      status: body.status || 'pending',
      brand: body.brand,
      notes: body.notes
    });

    // Populate the response
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name phone email address')
      .populate('items.product', 'title images buyPrice sellPrice sku');

    return NextResponse.json(
      { 
        success: true, 
        message: 'Order created successfully',
        order: populatedOrder 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('API V1 - Order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}