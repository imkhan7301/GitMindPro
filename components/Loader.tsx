
import React from 'react';

const Loader: React.FC<{ message?: string }> = ({ message = "Analyzing repository..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default Loader;
