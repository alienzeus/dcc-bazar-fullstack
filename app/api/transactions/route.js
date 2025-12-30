import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Transaction from '@/models/Transaction';
import History from '@/models/History';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const paymentMethod = searchParams.get('paymentMethod');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const query = { isActive: true };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (brand && brand !== 'all') {
      query.brand = brand;
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }
    
    if (search) {
      query.$or = [
        { reason: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { referenceNo: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Handle date filtering - FIXED
    if (startDate && endDate) {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Validate dates
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          query.date = {
            $gte: start,
            $lte: end
          };
        }
      } catch (error) {
        console.error('Date parsing error:', error);
      }
    } else if (startDate) {
      try {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          query.date = { $gte: start };
        }
      } catch (error) {
        console.error('Start date parsing error:', error);
      }
    } else if (endDate) {
      try {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          query.date = { $lte: end };
        }
      } catch (error) {
        console.error('End date parsing error:', error);
      }
    }

    const transactions = await Transaction.find(query)
      .populate('createdBy', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    // Get summary
    const summary = await Transaction.aggregate([
      { $match: { ...query, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const expenseSummary = await Transaction.aggregate([
      { $match: { ...query, type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalIncome = summary[0]?.total || 0;
    const totalExpense = expenseSummary[0]?.total || 0;
    const balance = totalIncome - totalExpense;

    return NextResponse.json({
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        balance
      },
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
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
    
    // Generate reference number if not provided
    if (!body.referenceNo) {
      const transactionCount = await Transaction.countDocuments();
      const prefix = body.type === 'income' ? 'INC' : 'EXP';
      body.referenceNo = `${prefix}-${(transactionCount + 1).toString().padStart(6, '0')}`;
    }

    body.createdBy = user._id;
    const transaction = await Transaction.create(body);

    // Log the action
    await History.create({
      user: user._id,
      action: 'transaction_create',
      resource: 'transaction',
      resourceId: transaction._id,
      description: `Created ${transaction.type}: ${transaction.reason} - ৳${transaction.amount}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true, 
      transaction 
    }, { status: 201 });

  } catch (error) {
    console.error('Transaction creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}