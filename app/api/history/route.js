import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import History from '@/models/History';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');

    const query = {};
    
    if (action && action !== 'all') {
      query.action = action;
    }
    
    if (resource && resource !== 'all') {
      query.resource = resource;
    }

    // If user is not superadmin, only show their own actions
    if (user.role !== 'superadmin') {
      query.user = user._id;
    }

    const history = await History.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await History.countDocuments(query);

    return NextResponse.json({
      history,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}