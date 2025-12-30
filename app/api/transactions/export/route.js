import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Transaction from '@/models/Transaction';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const brand = searchParams.get('brand') || 'all';

    const query = { isActive: true };
    
    if (type !== 'all') {
      query.type = type;
    }
    
    if (brand !== 'all') {
      query.brand = brand;
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
      .sort({ date: -1 });

    // Convert to CSV
    const headers = [
      'SL No',
      'Reference No',
      'Date',
      'Type',
      'Category',
      'Reason',
      'Amount',
      'Payment Method',
      'Brand',
      'Description',
      'Created By',
      'Created At'
    ];

    const csvData = transactions.map((transaction, index) => [
      index + 1,
      transaction.referenceNo,
      new Date(transaction.date).toLocaleDateString('en-GB'),
      transaction.type.toUpperCase(),
      transaction.category,
      transaction.reason,
      transaction.amount,
      transaction.paymentMethod.replace('_', ' ').toUpperCase(),
      transaction.brand,
      transaction.description || '',
      transaction.createdBy?.name || 'N/A',
      new Date(transaction.createdAt).toLocaleString('en-GB')
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Generate filename with date range if available
    let filename = `transactions-${type}`;
    if (startDate && endDate) {
      const start = new Date(startDate).toISOString().split('T')[0];
      const end = new Date(endDate).toISOString().split('T')[0];
      filename += `-${start}_to_${end}`;
    }
    filename += `.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
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