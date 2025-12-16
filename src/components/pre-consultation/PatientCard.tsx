import React from 'react';
import { Patient } from './types';
import { STATUS_COLORS } from './constants';
import { User, Activity, Calendar } from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
  onClick: (patient: Patient) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick }) => {
  return (
    <div
      onClick={() => onClick(patient)}
      className="group relative flex items-center w-full p-4 mb-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer overflow-hidden"
    >
      <div className="flex-shrink-0 mr-5">
        <div className="w-16 h-16 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
          <User size={32} />
        </div>
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
            {patient.name}
          </h3>
          <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
            {patient.id}
          </span>
        </div>
        <div className="flex items-center text-sm text-slate-500 mb-2 truncate">
          <span className="flex items-center mr-4">
            <User size={14} className="mr-1.5 opacity-70" />
            {patient.age} yrs, {patient.gender}
          </span>
          <span className="flex items-center truncate">
            <Activity size={14} className="mr-1.5 opacity-70" />
            <span className="truncate">{patient.diagnosis}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[patient.status]}`}>
            {patient.status}
          </span>
          <span className="text-xs text-slate-400 flex items-center ml-auto">
            <Calendar size={12} className="mr-1" />
            {patient.lastVisit}
          </span>
        </div>
      </div>
    </div>
  );
};
