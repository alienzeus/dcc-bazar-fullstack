import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Customer from '@/models/Customer';
import History from '@/models/History';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 100;
    const search = searchParams.get('search');

    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(query);

    return NextResponse.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Customers fetch error:', error);
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
    
    // Check if customer with same phone exists
    const existingCustomer = await Customer.findOne({ phone: body.phone });
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 400 }
      );
    }

    const customer = await Customer.create(body);

    // Log the action
    await History.create({
      user: user._id,
      action: 'create',
      resource: 'customer',
      resourceId: customer._id,
      description: `Created new customer: ${customer.name}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true, 
      customer 
    }, { status: 201 });

  } catch (error) {
    console.error('Customer creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}