import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import { apiMiddleware } from '../../middleware';

// GET - Get single order (same as before)
export async function GET(request, { params }) {
  const middlewareResponse = await apiMiddleware(request);
  if (middlewareResponse.status !== 200) return middlewareResponse;

  try {
    await dbConnect();
    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id)
      .populate('customer', 'name phone email address')
      .populate('items.product', 'title images buyPrice sellPrice sku category brand')
      .select('-__v');

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });

  } catch (error) {
    console.error('API V1 - Order fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT - Update an order
export async function PUT(request, { params }) {
  const middlewareResponse = await apiMiddleware(request);
  if (middlewareResponse.status !== 200) return middlewareResponse;

  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Handle customer update if provided
    let customer = existingOrder.customer;
    if (body.customer && body.customer.phone) {
      let existingCustomer = await Customer.findOne({ phone: body.customer.phone });
      if (!existingCustomer) {
        existingCustomer = await Customer.create(body.customer);
      }
      customer = existingCustomer._id;
    }

    // Update order
    const updateData = {
      customer,
      paymentMethod: body.paymentMethod || existingOrder.paymentMethod,
      deliveryMethod: body.deliveryMethod || existingOrder.deliveryMethod,
      deliveryPerson: body.deliveryPerson || existingOrder.deliveryPerson,
      status: body.status || existingOrder.status,
      paymentStatus: body.paymentStatus || existingOrder.paymentStatus,
      paidAmount: body.paidAmount !== undefined ? body.paidAmount : existingOrder.paidAmount,
      courierCharge: body.courierCharge !== undefined ? body.courierCharge : existingOrder.courierCharge,
      notes: body.notes || existingOrder.notes
    };

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('customer', 'name phone email address')
    .populate('items.product', 'title images buyPrice sellPrice sku');

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('API V1 - Order update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an order
export async function DELETE(request, { params }) {
  const middlewareResponse = await apiMiddleware(request);
  if (middlewareResponse.status !== 200) return middlewareResponse;

  try {
    await dbConnect();
    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Restore product stock before deleting order
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        product.salesCount -= item.quantity;
        await product.save();
      }
    }

    await Order.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('API V1 - Order deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}