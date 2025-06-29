
import React from 'react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <h2 className="mt-6 text-xl font-semibold text-gray-900">Loading your dashboard...</h2>
        <p className="mt-2 text-gray-600">
          Please wait while we set up your personalized experience.
        </p>
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            If this takes longer than expected, try refreshing the page.
          </p>
        </div>
      </div>
    </div>
  );
};
