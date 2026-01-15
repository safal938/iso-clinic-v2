import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Patient, PatientStatus } from '../../types/nurse-sim';

interface PatientCardProps {
  patient: Patient;
  onClick: (patient: Patient) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick }) => {
  
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Critical':
        return 'bg-red-50 text-red-600';
      case 'Stable':
        return 'bg-green-50 text-green-600';
      case 'Recovering':
        return 'bg-blue-50 text-blue-600';
      case 'Discharged':
        return 'bg-neutral-100 text-neutral-500';
      default:
        return 'bg-neutral-50 text-neutral-500';
    }
  };

  return (
    <div 
      onClick={() => onClick(patient)}
      className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 cursor-pointer hover:border-primary transition-all hover:shadow-md group"
    >
     <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
            {/* Avatar inside - Changed to grey as requested */}
            <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0 border border-neutral-200">
               <span className="font-medium text-lg">{patient.firstName[0]}{patient.lastName[0]}</span>
            </div>
            <div className="min-w-0">
                <h3 className="font-medium text-lg text-neutral-900 leading-tight truncate pr-2">
                  {patient.firstName} {patient.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">{patient.id}</span>
                    <span className="text-xs text-neutral-500 font-medium truncate">{patient.age} Yrs • {patient.gender}</span>
                </div>
            </div>
        </div>
        <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wide shrink-0 ${getStatusStyles(patient.status)}`}>
            {patient.status}
        </div>
     </div>
     
     <div className="bg-neutral-50 rounded-lg p-3 text-sm text-neutral-700 mb-4 border border-neutral-100">
        <span className="text-xs text-neutral-400 uppercase font-medium block mb-1">Chief Complaint</span>
        <p className="line-clamp-2 font-normal">{patient.diagnosis}</p>
     </div>
     
     <div className="flex justify-between items-center text-xs text-neutral-400 border-t border-neutral-50 pt-3">
        <span>Updated {patient.lastUpdate}</span>
        <ChevronRight size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0"/>
     </div>
    </div>
  );
};