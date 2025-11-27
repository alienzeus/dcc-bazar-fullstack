import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import History from '@/models/History';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { id } = params;

    const order = await Order.findById(id)
      .populate('customer', 'name phone email address')
      .populate('items.product', 'title images buyPrice sellPrice stock');

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order fetch error:', error);
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

    const { id } = params;
    const body = await request.json();

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Handle customer update
    let customer = existingOrder.customer;
    if (body.customer && body.customer.phone) {
      let existingCustomer = await Customer.findOne({ phone: body.customer.phone });
      if (!existingCustomer) {
        existingCustomer = await Customer.create(body.customer);
      }
      customer = existingCustomer._id;
    }

    // Calculate new totals if items are updated
    let subtotal = existingOrder.subtotal;
    let orderItems = existingOrder.items;

    if (body.items && body.items.length > 0) {
      // Restore old stock first
      for (const item of existingOrder.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          product.salesCount -= item.quantity;
          await product.save();
        }
      }

      // Process new items
      subtotal = 0;
      orderItems = [];

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
    }

    const totalAmount = subtotal + (body.courierCharge || existingOrder.courierCharge);
    const paidAmount = body.paidAmount !== undefined ? body.paidAmount : existingOrder.paidAmount;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        ...body,
        customer,
        items: orderItems,
        subtotal,
        totalAmount,
        paidAmount,
        dueAmount: totalAmount - paidAmount,
        // Preserve Pathao fields if not provided in update
        pathaoConsignmentId: body.pathaoConsignmentId || existingOrder.pathaoConsignmentId,
        pathaoStatus: body.pathaoStatus || existingOrder.pathaoStatus,
        pathaoUpdatedAt: body.pathaoUpdatedAt || existingOrder.pathaoUpdatedAt,
        pathaoDeliveryFee: body.pathaoDeliveryFee || existingOrder.pathaoDeliveryFee,
        pathaoTrackingUrl: body.pathaoTrackingUrl || existingOrder.pathaoTrackingUrl,
      },
      { new: true, runValidators: true }
    ).populate('customer')
     .populate('items.product');

    // Log the action
    await History.create({
      user: user._id,
      action: 'update',
      resource: 'order',
      resourceId: id,
      description: `Updated order ${updatedOrder.orderNumber}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder 
    });

  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}