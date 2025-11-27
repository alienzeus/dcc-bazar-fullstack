import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Order from '@/models/Order';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date ranges (same logic as dashboard)
    const now = new Date();
    let dateFilter = {};

    switch (period) {
      case 'today':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = { createdAt: { $gte: todayStart } };
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: weekStart } };
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: monthStart } };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateFilter = {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate + 'T23:59:59.999Z')
            }
          };
        }
        break;
    }

    const orders = await Order.find(dateFilter)
      .populate('customer', 'name phone address')
      .populate('items.product', 'title')
      .sort({ createdAt: -1 });

    // Convert to CSV
    const headers = [
      'SL No',
      'Order Number',
      'Customer Name',
      'Phone Number',
      'Area',
      'Status',
      'Total Amount',
      'Paid Amount',
      'Due Amount',
      'Payment Status',
      'Delivery Method',
      'Brand',
      'Order Date'
    ];

    const csvData = orders.map((order, index) => [
      index + 1,
      order.orderNumber,
      order.customer?.name || 'N/A',
      order.customer?.phone || 'N/A',
      order.customer?.address || 'N/A',
      order.status,
      order.totalAmount,
      order.paidAmount,
      order.dueAmount,
      order.paymentStatus,
      order.deliveryMethod,
      order.brand,
      new Date(order.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-${period}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}