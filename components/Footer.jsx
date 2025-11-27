'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Copyright Text */}
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-sm text-gray-600">
                © {currentYear} DCC Bazar Business Management System. All rights reserved.
              </p>
            </div>

            {/* Developed By Section */}
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Developed by</span>
              <Link 
                href="https://www.facebook.com/alienzeus" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 hover:opacity-80 transition-opacity"
              >
                <div className="h-8 relative">
  <img
    src="/nc.png"
    alt="NC Logo"
    className="object-contain w-full h-full"
  />
</div>

               
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}