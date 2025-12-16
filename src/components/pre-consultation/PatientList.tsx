import React from 'react';
import { Patient } from './types';
import { PatientCard } from './PatientCard';
import { PatientSkeleton } from './PatientSkeleton';

interface PatientListProps {
  patients: Patient[];
  isLoading: boolean;
  onPatientClick: (patient: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({ patients, isLoading, onPatientClick }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <PatientSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-lg font-medium">No patients found</p>
        <p className="text-sm">Try adjusting your search.</p>
      </div>
    );
  }

  return (
    <div className="mt-2 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {patients.map(patient => (
          <PatientCard key={patient.id} patient={patient} onClick={onPatientClick} />
        ))}
      </div>
      <div className="text-center mt-8 text-xs text-slate-400">
        End of list • {patients.length} patients
      </div>
    </div>
  );
};
