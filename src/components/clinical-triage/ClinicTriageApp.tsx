import React from 'react';
import { GridSystem } from './GridSystem';

const ClinicTriageApp: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-slate-100 overflow-hidden">
      <GridSystem />
    </div>
  );
};

export default ClinicTriageApp;
