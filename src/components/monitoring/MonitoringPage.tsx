import React from 'react';
import MonitoringSummaryCard from './MonitoringSummaryCard';
import ActionCard from './ActionCard';
import PatientChat from './PatientChat';

export const MonitoringPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-100">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12 h-screen flex flex-col">
        
        <header className="flex items-center justify-between mb-8 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Medi<span className="text-blue-500">Monitor</span>
            </h1>
            <p className="text-slate-500 text-sm">AI Risk Assessment Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
             <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">System Active</span>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* Left Column - Information */}
          <div className="lg:col-span-7 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide">
            <MonitoringSummaryCard />
            <ActionCard />
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-5 h-full min-h-[500px]">
            <PatientChat />
          </div>
        </main>
      </div>
    </div>
  );
};
