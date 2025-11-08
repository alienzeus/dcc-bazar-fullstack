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

    // Get date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total sales (current month)
    const totalSalesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: currentMonthStart },
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Total orders (current month)
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: currentMonthStart }
    });

    // Total products
    const totalProducts = await Product.countDocuments({ isActive: true });

    // Net profit calculation
    const profitData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: currentMonthStart },
          status: 'delivered'
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.total' },
          totalCost: { 
            $sum: { 
              $multiply: [
                '$items.quantity', 
                '$productInfo.buyPrice'
              ] 
            } 
          }
        }
      }
    ]);

    const netProfit = profitData.length > 0 
      ? profitData[0].totalRevenue - profitData[0].totalCost
      : 0;

    // Monthly sales data for chart
    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1)
          },
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sales: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const monthlyData = monthlySales.map(item => ({
      month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      sales: item.sales
    }));

    // Stock distribution
    const stockData = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: '$stock' }
        }
      }
    ]);

    const formattedStockData = stockData.map(item => ({
      name: item._id,
      value: item.total
    }));

    return NextResponse.json({
      totalSales: totalSalesData.length > 0 ? totalSalesData[0].total : 0,
      totalOrders,
      netProfit: Math.max(0, netProfit),
      totalProducts,
      monthlyData,
      stockData: formattedStockData
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}