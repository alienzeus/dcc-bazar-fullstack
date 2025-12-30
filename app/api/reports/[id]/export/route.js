import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Report from '@/models/Report';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    const report = await Report.findById(params.id);
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    if (format === 'csv') {
      // Generate CSV based on report type
      let csvContent = '';
      
      switch (report.type) {
        case 'financial':
          csvContent = generateFinancialCSV(report);
          break;
        case 'sales':
          csvContent = generateSalesCSV(report);
          break;
        case 'inventory':
          csvContent = generateInventoryCSV(report);
          break;
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv"`
        }
      });
    }

    // For PDF, return a download link (you'll need to implement PDF generation)
    return NextResponse.json({
      success: true,
      message: 'PDF download will be implemented separately',
      report
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateFinancialCSV(report) {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Balance'];
  const data = report.data.transactions || [];
  
  let balance = 0;
  const rows = data.map(transaction => {
    if (transaction.type === 'income') {
      balance += transaction.amount;
    } else {
      balance -= transaction.amount;
    }
    
    return [
      new Date(transaction.date).toLocaleDateString(),
      transaction.type.toUpperCase(),
      transaction.category,
      transaction.reason,
      transaction.amount,
      balance
    ];
  });
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateSalesCSV(report) {
  const headers = ['Order Number', 'Customer', 'Date', 'Items', 'Quantity', 'Total', 'Status'];
  const data = report.data.orders || [];
  
  const rows = data.flatMap(order => 
    order.items.map(item => [
      order.orderNumber,
      order.customer?.name || 'N/A',
      new Date(order.createdAt).toLocaleDateString(),
      item.product?.title || 'N/A',
      item.quantity,
      item.price * item.quantity,
      order.status
    ])
  );
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateInventoryCSV(report) {
  const headers = ['SKU', 'Product', 'Brand', 'Category', 'Stock', 'Min Stock', 'Buy Price', 'Sell Price', 'Value'];
  const data = report.data.products || [];
  
  const rows = data.map(product => [
    product.sku,
    product.title,
    product.brand,
    product.category,
    product.stock,
    product.minStock,
    product.buyPrice,
    product.sellPrice,
    product.stock * product.buyPrice
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}