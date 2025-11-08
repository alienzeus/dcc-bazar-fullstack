import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import History from '@/models/History';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customer', 'name phone email')
      .populate('items.product', 'title images buyPrice sellPrice')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    return NextResponse.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
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
    
    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${(orderCount + 1).toString().padStart(4, '0')}`;

    // Create or find customer
    let customer = await Customer.findOne({ phone: body.customer.phone });
    if (!customer) {
      customer = await Customer.create(body.customer);
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
        throw new Error(`Insufficient stock for ${product.title}`);
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

    const order = await Order.create({
      ...body,
      orderNumber,
      customer: customer._id,
      items: orderItems,
      subtotal,
      totalAmount,
      paidAmount: body.paidAmount || 0,
      dueAmount: totalAmount - (body.paidAmount || 0)
    });

    // Log the action
    await History.create({
      user: user._id,
      action: 'create',
      resource: 'order',
      resourceId: order._id,
      description: `Created new order ${orderNumber} for ${customer.name}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    // Populate the response
    const populatedOrder = await Order.findById(order._id)
      .populate('customer')
      .populate('items.product');

    return NextResponse.json({ 
      success: true, 
      order: populatedOrder 
    }, { status: 201 });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}