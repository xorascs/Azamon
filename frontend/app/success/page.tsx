'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserIdFromToken } from '@/app/config';

export default function PaymentStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const reason = searchParams.get('reason');

  // Redirect logic
  useEffect(() => {
    const redirectTimeout = setTimeout(() => {
      const userId = getUserIdFromToken();
      if (userId !== null) {
        router.push(`/profile/${userId.toString()}`);
      } else {
        router.push('/home');
      }
    }, 5000); // Redirect after 5 seconds

    return () => clearTimeout(redirectTimeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center text-center p-4">
      {isSuccess ? (
        // Success State
        <>
          <div className="text-green-500 text-6xl mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-24 w-24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 text-lg mb-6">Thank you for your purchase.</p>
        </>
      ) : (
        // Error State
        <>
          <div className="text-red-500 text-6xl mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-24 w-24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Failed</h1>
          <p className="text-gray-600 text-lg mb-6">
            We couldn't process your payment. Please try again.
          </p>
          <p className="text-gray-600 text-lg mb-6">
            {reason}
          </p>
        </>
      )}

      {/* Common redirect message */}
      <p className="text-gray-500">
        Redirecting in <span className="font-semibold">5</span> seconds...
      </p>

      {/* Manual redirect button */}
      <button
        onClick={() => {
          const userId = getUserIdFromToken();
          router.push(userId ? `/profile/${userId.toString()}` : '/home');
        }}
        className="mt-6 btn btn-primary"
      >
        Go {getUserIdFromToken() ? 'to Profile' : 'Home'} Now
      </button>
    </div>
  );
}