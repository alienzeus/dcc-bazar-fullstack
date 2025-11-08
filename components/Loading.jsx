'use client';
import { Package } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Package className="h-10 w-10 text-white" />
          </div>
          
          {/* Pulsing circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-4 border-green-200 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          DCC Bazar
        </h2>
        <p className="text-gray-600 mb-6">
          Loading your dashboard...
        </p>

        {/* Animated Dots */}
        <div className="flex justify-center gap-1">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}