import React from 'react';

export const ProgressIndicator: React.FC<{ progress: number; message: string }> = ({
  progress,
  message,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl w-80">
      <p className="mb-2 text-sm text-gray-600">{message}</p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500 text-center">{progress}%</p>
    </div>
  </div>
);
