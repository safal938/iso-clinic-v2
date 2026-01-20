import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Monitoring</h1>
            <p className="text-xs text-slate-500">Patient monitoring dashboard</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Monitoring Dashboard</h2>
          <p className="text-sm text-slate-500">Preparing...</p>
        </div>
      </div>
    </div>
  );
};
