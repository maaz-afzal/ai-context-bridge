import React from 'react';

export const HistorySkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 bg-gray-100 rounded-lg animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="flex gap-3 mb-2">
            <div className="w-16 h-3 bg-gray-200 rounded"></div>
            <div className="w-20 h-3 bg-gray-200 rounded"></div>
            <div className="w-24 h-3 bg-gray-200 rounded"></div>
          </div>
          <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
};
