import React from 'react';
import { Activity } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-10">
      <div className="w-[90%] max-w-[1920px] mx-auto h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Activity size={18} />
            </div>
            <span className="text-neutral-900 font-medium text-lg tracking-tight">
              Medforce AI Clinic
            </span>
          </div>
        </div>
        
        {/* Right side placeholder - User profile usually goes here */}
        <div className="w-8 h-8 rounded-full bg-secondary"></div>
      </div>
    </header>
  );
};