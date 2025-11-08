import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Loading from '@/components/Loading'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata = {
  title: 'DCC Bazar - Business Management System',
  description: 'Complete business product and finance management system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Suspense fallback={<Loading />}>
          {children}
        </Suspense>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  )
}