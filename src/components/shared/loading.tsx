'use client';

export const Loading = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative w-10 h-10">
        <div className="absolute w-full h-full border-4 border-gray-200 rounded-full"></div>
        <div className="absolute w-full h-full border-4 border-blue-500 rounded-full 
          border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
}; 