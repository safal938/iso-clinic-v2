import React from 'react';

export const PatientSkeleton: React.FC = () => {
  return (
    <div className="flex items-center w-full p-4 mb-3 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse">
      <div className="w-16 h-16 rounded-xl bg-slate-200 mr-5 flex-shrink-0" />
      <div className="flex-grow space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-5 bg-slate-100 rounded w-16" />
          <div className="h-5 bg-slate-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
};
