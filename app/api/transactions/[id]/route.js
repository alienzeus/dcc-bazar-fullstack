import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Transaction from '@/models/Transaction';
import History from '@/models/History';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const transaction = await Transaction.findById(params.id).populate('createdBy', 'name email');
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Transaction fetch error:', error);
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

    const body = await request.json();
    const oldTransaction = await Transaction.findById(params.id);

    const transaction = await Transaction.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Log the action
    await History.create({
      user: user._id,
      action: 'transaction_update',
      resource: 'transaction',
      resourceId: transaction._id,
      description: `Updated ${transaction.type}: ${transaction.reason} - ৳${transaction.amount}`,
      oldData: oldTransaction,
      newData: transaction,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true, 
      transaction 
    });

  } catch (error) {
    console.error('Transaction update error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const transaction = await Transaction.findById(params.id);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Soft delete
    transaction.isActive = false;
    await transaction.save();

    // Log the action
    await History.create({
      user: user._id,
      action: 'transaction_delete',
      resource: 'transaction',
      resourceId: transaction._id,
      description: `Deleted ${transaction.type}: ${transaction.reason} - ৳${transaction.amount}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('Transaction deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}