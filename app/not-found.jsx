'use client';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Search, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
            <div className="relative">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">!</span>
              </div>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-0 left-1/4 w-6 h-6 bg-green-200 rounded-full animate-bounce"></div>
          <div className="absolute top-4 right-1/4 w-4 h-4 bg-blue-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="absolute bottom-8 left-1/3 w-5 h-5 bg-purple-200 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Error Code */}
          <div className="mb-6">
            <h1 className="text-8xl font-bold text-gray-900 mb-2">404</h1>
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-blue-500 mx-auto rounded-full"></div>
          </div>

          {/* Message */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Page Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              Oops! The page you're looking for seems to have wandered off into the digital wilderness.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Search size={16} />
              <span>We searched high and low but couldn't find what you're looking for.</span>
            </div>
          </div>

          {/* Possible Reasons */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Possible reasons:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                The page may have been moved or deleted
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                You might have typed the wrong URL
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                The link you followed could be broken
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors font-medium"
            >
              <ArrowLeft size={20} />
              Go Back
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors font-medium"
            >
              <Home size={20} />
              Home Page
            </button>
          </div>

          {/* Quick Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">Quick links you might be looking for:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => router.push('/orders')}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                Orders
              </button>
              <button
                onClick={() => router.push('/products')}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
              >
                Products
              </button>
              <button
                onClick={() => router.push('/customers')}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
              >
                Customers
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Still lost?{' '}
            <button
              onClick={() => router.push('/contact')}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}