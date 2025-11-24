import { NextResponse } from 'next/server';

// Validate API Key
export function validateApiKey(request) {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return {
      valid: false,
      error: 'API key is required'
    };
  }

  // Check against environment variable
  const validApiKey = process.env.API_SECRET_KEY;
  
  if (apiKey !== validApiKey) {
    return {
      valid: false,
      error: 'Invalid API key'
    };
  }

  return {
    valid: true
  };
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

export function checkRateLimit(ip, limit = 100, windowMs = 900000) { // 100 requests per 15 minutes
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }
  
  const requests = rateLimitStore.get(ip).filter(time => time > windowStart);
  rateLimitStore.set(ip, requests);
  
  if (requests.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(now + windowMs)
    };
  }
  
  requests.push(now);
  return {
    allowed: true,
    remaining: limit - requests.length,
    resetTime: new Date(now + windowMs)
  };
}

// Main middleware function
export async function apiMiddleware(request) {
  // Validate API Key
  const apiKeyValidation = validateApiKey(request);
  if (!apiKeyValidation.valid) {
    return NextResponse.json(
      { error: apiKeyValidation.error },
      { status: 401 }
    );
  }

  // Rate Limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimit = checkRateLimit(ip);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        limit: 100,
        window: '15 minutes',
        reset: rateLimit.resetTime.toISOString()
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toISOString()
        }
      }
    );
  }

  // Add rate limit headers to successful requests
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toISOString());
  
  return response;
}