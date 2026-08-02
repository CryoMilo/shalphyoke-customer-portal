import React from 'react';
const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="mt-4 text-base-content/60">Loading...</p>
    </div>
  );
};
export default LoadingSpinner;
