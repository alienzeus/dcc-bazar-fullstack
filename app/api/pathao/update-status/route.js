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

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order.pathaoConsignmentId) {
      return NextResponse.json(
        { error: 'Order not sent to Pathao' },
        { status: 400 }
      );
    }

    // Initialize Pathao client based on brand
    const pathaoClient = new PathaoClient(order.brand);

    // Get current status from Pathao
    const statusResult = await pathaoClient.getOrderStatus(order.pathaoConsignmentId);

    const newPathaoStatus = statusResult.data.order_status;
    const oldPathaoStatus = order.pathaoStatus;

    // Update order status
    order.pathaoStatus = newPathaoStatus;
    order.pathaoUpdatedAt = new Date();

    // Auto-update system status based on Pathao status
    let systemStatusChanged = false;
    if (newPathaoStatus.toLowerCase() === 'delivered' && order.status !== 'delivered') {
      order.status = 'delivered';
      systemStatusChanged = true;
      
      // If delivered and COD, mark as paid
      if (order.dueAmount > 0) {
        order.paidAmount = order.totalAmount;
        order.dueAmount = 0;
        order.paymentStatus = 'paid';
      }
    } else if (newPathaoStatus.toLowerCase() === 'cancelled' && order.status !== 'cancelled') {
      order.status = 'cancelled';
      systemStatusChanged = true;
    } else if ((newPathaoStatus.toLowerCase() === 'picked' || newPathaoStatus.toLowerCase() === 'shipped') && order.status === 'processing') {
      order.status = 'shipped';
      systemStatusChanged = true;
    }

    await order.save();

    // Log the action
    await History.create({
      user: user._id,
      action: 'pathao_status_update',
      resource: 'order',
      resourceId: order._id,
      description: `Pathao status updated from "${oldPathaoStatus}" to "${newPathaoStatus}" for order ${order.orderNumber}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      pathaoStatus: newPathaoStatus,
      systemStatus: order.status,
      systemStatusChanged,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('Pathao status update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update Pathao status' },
      { status: 500 }
    );
  }
}