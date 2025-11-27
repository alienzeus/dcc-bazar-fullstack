import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Order from '@/models/Order';
import PathaoClient from '@/lib/pathao';
import History from '@/models/History';

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order with populated data
    const order = await Order.findById(orderId)
      .populate('customer')
      .populate('items.product');

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.pathaoConsignmentId) {
      return NextResponse.json(
        { error: 'Order already sent to Pathao' },
        { status: 400 }
      );
    }

    if (order.deliveryMethod !== 'pathao') {
      return NextResponse.json(
        { error: 'Order delivery method is not Pathao' },
        { status: 400 }
      );
    }

    // Initialize Pathao client based on brand
    const pathaoClient = new PathaoClient(order.brand);

    // Send order to Pathao
    const pathaoResult = await pathaoClient.createOrder(order);

    // Update order with Pathao consignment ID
    order.pathaoConsignmentId = pathaoResult.data.consignment_id;
    order.pathaoStatus = pathaoResult.data.order_status;
    order.pathaoUpdatedAt = new Date();
    await order.save();

    // Log the action
    await History.create({
      user: user._id,
      action: 'pathao_send',
      resource: 'order',
      resourceId: order._id,
      description: `Sent order ${order.orderNumber} to Pathao. Consignment: ${pathaoResult.data.consignment_id}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      consignmentId: pathaoResult.data.consignment_id,
      message: 'Order sent to Pathao successfully'
    });

  } catch (error) {
    console.error('Pathao send order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send order to Pathao' },
      { status: 500 }
    );
  }
}