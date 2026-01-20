import React from 'react';
import { motion } from 'framer-motion';
import { Patient, PatientStatus } from './types';
import { CELL_SIZE } from './constants';
import clsx from 'clsx';

interface PatientSquareProps {
  patient: Patient;
  isSelected?: boolean;
  onClick: (patient: Patient) => void;
}

// Updated to lighter blue shades
const statusColors = {
  [PatientStatus.POOL]: 'bg-blue-400 border-blue-500 text-white',
  [PatientStatus.CRITICAL]: 'bg-blue-400 border-blue-500 text-white',
  [PatientStatus.MODERATE]: 'bg-blue-400 border-blue-500 text-white',
  [PatientStatus.STABLE]: 'bg-blue-400 border-blue-500 text-white',
};

export const PatientSquare: React.FC<PatientSquareProps> = ({ 
  patient, 
  isSelected,
  onClick 
}) => {
  return (
    <motion.div
      // Removed layoutId to prevent "jiggling" during canvas pan (Framer Motion tries to animate layout changes on transform)
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isSelected ? 1.15 : 1, 
        opacity: 1,
        zIndex: isSelected ? 50 : 1
      }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1, zIndex: 10 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(patient);
      }}
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
      }}
      className={clsx(
        'rounded-lg shadow-sm border cursor-pointer flex items-center justify-center font-bold text-xs select-none transition-shadow',
        isSelected ? 'bg-blue-500 ring-4 ring-blue-200 shadow-xl' : statusColors[patient.status]
      )}
    >
      {patient.initials}
    </motion.div>
  );
};