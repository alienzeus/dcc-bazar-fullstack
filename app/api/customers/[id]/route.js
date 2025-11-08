import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Customer from '@/models/Customer';
import History from '@/models/History';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const customer = await Customer.findById(params.id);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Customer fetch error:', error);
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
    const oldCustomer = await Customer.findById(params.id);

    const customer = await Customer.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Log the action
    await History.create({
      user: user._id,
      action: 'update',
      resource: 'customer',
      resourceId: customer._id,
      description: `Updated customer: ${customer.name}`,
      oldData: oldCustomer,
      newData: customer,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true, 
      customer 
    });

  } catch (error) {
    console.error('Customer update error:', error);
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

    const customer = await Customer.findById(params.id);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    await Customer.findByIdAndDelete(params.id);

    // Log the action
    await History.create({
      user: user._id,
      action: 'delete',
      resource: 'customer',
      resourceId: customer._id,
      description: `Deleted customer: ${customer.name}`,
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Customer deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}