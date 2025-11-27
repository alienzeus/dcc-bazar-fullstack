import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Customer from '@/models/Customer';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month, custom
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date ranges based on period
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
      default:
        dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
    }

    // Total sales
    const totalSalesData = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ['delivered', 'shipped', 'processing'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          paid: { $sum: '$paidAmount' },
          due: { $sum: '$dueAmount' }
        }
      }
    ]);

    // Order counts by status
    const orderStats = await Order.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Recent orders with customer details
    const recentOrders = await Order.find(dateFilter)
      .populate('customer', 'name phone address')
      .populate('items.product', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    // Daily summary for the chart
    const dailySummary = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ['delivered', 'shipped', 'processing'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          date: { $first: '$createdAt' },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'processing']] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Format daily summary for chart
    const formattedDailySummary = dailySummary.map(item => ({
      date: `${item._id.day}/${item._id.month}`,
      totalSales: item.totalSales,
      orderCount: item.orderCount,
      deliveredCount: item.deliveredCount,
      pendingCount: item.pendingCount
    }));

    // Payment method summary
    const paymentSummary = await Order.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Brand-wise summary
    const brandSummary = await Order.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$brand',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalSales = totalSalesData.length > 0 ? totalSalesData[0].total : 0;
    const totalPaid = totalSalesData.length > 0 ? totalSalesData[0].paid : 0;
    const totalDue = totalSalesData.length > 0 ? totalSalesData[0].due : 0;

    // Convert order stats to object
    const orderStatusCounts = {};
    orderStats.forEach(stat => {
      orderStatusCounts[stat._id] = {
        count: stat.count,
        totalAmount: stat.totalAmount
      };
    });

    return NextResponse.json({
      summary: {
        totalSales,
        totalPaid,
        totalDue,
        totalOrders: recentOrders.length,
        deliveredOrders: orderStatusCounts.delivered?.count || 0,
        pendingOrders: (orderStatusCounts.pending?.count || 0) + (orderStatusCounts.processing?.count || 0),
        cancelledOrders: orderStatusCounts.cancelled?.count || 0
      },
      recentOrders: recentOrders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        items: order.items,
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount,
        dueAmount: order.dueAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        deliveryMethod: order.deliveryMethod,
        createdAt: order.createdAt,
        brand: order.brand
      })),
      charts: {
        dailySummary: formattedDailySummary,
        paymentSummary,
        brandSummary
      },
      period: {
        type: period,
        startDate: startDate,
        endDate: endDate
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}