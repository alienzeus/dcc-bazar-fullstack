import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Report from '@/models/Report';
import History from '@/models/History';
import Transaction from '@/models/Transaction';
import Order from '@/models/Order';
import Product from '@/models/Product';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const type = searchParams.get('type') || 'all';
    const period = searchParams.get('period') || 'all';

    const query = { isActive: true };
    
    if (type !== 'all') {
      query.type = type;
    }
    
    if (period !== 'all') {
      query.period = period;
    }

    const reports = await Report.find(query)
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    return NextResponse.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Reports fetch error:', error);
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
    const { type, period, startDate, endDate } = body;
    
    let reportData = {};
    let summary = {};
    let title = '';

    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59.999Z');
    
    // Generate report based on type
    switch (type) {
      case 'financial':
        title = `Financial Report - ${period} (${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()})`;
        
        // Get transactions
        const transactions = await Transaction.find({
          isActive: true,
          date: { $gte: start, $lte: end }
        });
        
        // Get orders
        const orders = await Order.find({
          isActive: true,
          createdAt: { $gte: start, $lte: end }
        }).populate('items.product', 'title buyPrice sellPrice');
        
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalSales = orders
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        const netProfit = (totalSales + totalIncome) - totalExpense;
        
        // Categorize transactions
        const incomeByCategory = transactions
          .filter(t => t.type === 'income')
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          }, {});
        
        const expenseByCategory = transactions
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          }, {});
        
        reportData = {
          transactions,
          orders,
          incomeByCategory,
          expenseByCategory
        };
        
        summary = {
          totalIncome,
          totalExpense,
          netProfit,
          totalSales,
          totalOrders,
          avgOrderValue
        };
        break;

      case 'sales':
        title = `Sales Report - ${period} (${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()})`;
        
        const salesOrders = await Order.find({
          isActive: true,
          createdAt: { $gte: start, $lte: end }
        }).populate('customer', 'name phone')
          .populate('items.product', 'title category brand');
        
        const salesByBrand = salesOrders.reduce((acc, order) => {
          order.items.forEach(item => {
            const brand = item.product?.brand || 'Unknown';
            acc[brand] = (acc[brand] || 0) + (item.price * item.quantity);
          });
          return acc;
        }, {});
        
        const salesByCategory = salesOrders.reduce((acc, order) => {
          order.items.forEach(item => {
            const category = item.product?.category || 'Unknown';
            acc[category] = (acc[category] || 0) + (item.price * item.quantity);
          });
          return acc;
        }, {});
        
        const dailySales = salesOrders.reduce((acc, order) => {
          const date = new Date(order.createdAt).toLocaleDateString();
          acc[date] = (acc[date] || 0) + order.totalAmount;
          return acc;
        }, {});
        
        reportData = {
          orders: salesOrders,
          salesByBrand,
          salesByCategory,
          dailySales
        };
        
        summary = {
          totalSales: Object.values(salesByBrand).reduce((a, b) => a + b, 0),
          totalOrders: salesOrders.length,
          avgOrderValue: salesOrders.length > 0 ? 
            Object.values(salesByBrand).reduce((a, b) => a + b, 0) / salesOrders.length : 0
        };
        break;

      case 'inventory':
        title = `Inventory Report - ${period} (${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()})`;
        
        const products = await Product.find({ isActive: true });
        const lowStockProducts = products.filter(p => p.stock <= p.minStock);
        const outOfStockProducts = products.filter(p => p.stock === 0);
        
        const inventoryValue = products.reduce((sum, p) => sum + (p.stock * p.buyPrice), 0);
        const potentialRevenue = products.reduce((sum, p) => sum + (p.stock * p.sellPrice), 0);
        
        reportData = {
          products,
          lowStockProducts,
          outOfStockProducts,
          inventoryByBrand: products.reduce((acc, p) => {
            acc[p.brand] = (acc[p.brand] || 0) + (p.stock * p.buyPrice);
            return acc;
          }, {}),
          inventoryByCategory: products.reduce((acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + (p.stock * p.buyPrice);
            return acc;
          }, {})
        };
        
        summary = {
          totalProducts: products.length,
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length,
          inventoryValue,
          potentialRevenue
        };
        break;
    }
    
    // Create report record
    const report = await Report.create({
      title,
      type,
      period,
      startDate: start,
      endDate: end,
      data: reportData,
      summary,
      format: ['pdf', 'csv'],
      generatedBy: user._id
    });

    // Log the action
    await History.create({
      user: user._id,
      action: 'report_generate',
      resource: 'report',
      resourceId: report._id,
      description: `Generated ${type} report for ${period} period`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true, 
      report,
      message: 'Report generated successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}