import React from 'react';
import { GridConfig, Patient } from './types';
import { CELL_SIZE, CELL_GAP, GRID_PADDING } from './constants';
import { PatientSquare } from './PatientSquare';

interface GridProps {
  config: GridConfig;
  patients: Patient[];
  selectedPatientId?: string;
  onPatientClick: (patient: Patient) => void;
}

export const Grid: React.FC<GridProps> = ({ 
  config, 
  patients, 
  selectedPatientId,
  onPatientClick 
}) => {
  const { title, rows: configRows, cols } = config;
  
  // Calculate dynamic rows to fit all patients
  const requiredRows = Math.ceil(patients.length / cols);
  const rows = Math.max(configRows, requiredRows);

  const totalWidth = (cols * (CELL_SIZE + CELL_GAP)) - CELL_GAP + GRID_PADDING;
  const totalHeight = (rows * (CELL_SIZE + CELL_GAP)) - CELL_GAP + GRID_PADDING;

  // Create slots grid
  const slots = Array.from({ length: rows * cols });

  return (
    <div 
      className="absolute flex flex-col items-center group"
      style={{
        left: config.x,
        top: config.y,
        width: totalWidth, 
      }}
    >
      {/* Header */}
      <div className="mb-4 pointer-events-none select-none relative z-10 flex justify-center">
         <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20 shadow-sm">
            <h3 className="font-bold text-slate-700 text-lg whitespace-nowrap">{title}</h3>
            <span className="bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-md font-bold">
              {patients.length}
            </span>
         </div>
      </div>

      {/* Grid Container */}
      <div 
        className="relative bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-sm transition-all duration-300 group-hover:border-slate-300 group-hover:shadow-md"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
          gap: `${CELL_GAP}px`,
        }}
      >
        {slots.map((_, i) => (
          <div 
            key={`slot-${i}`} 
            className="w-full h-full bg-slate-200/50 rounded-lg"
          />
        ))}
      </div>
      
       <div 
         className="absolute p-2"
         style={{
            top: 'calc(100% - ' + (totalHeight + 16) + 'px)', 
         }}
       >
       </div>
    </div>
  );
};

// Refactored Component for cleaner overlay logic
export const GridContainer: React.FC<GridProps> = ({ config, patients, selectedPatientId, onPatientClick }) => {
    const { title, rows: configRows, cols } = config;
  
    // Dynamically calculate rows if patients exceed capacity
    const requiredRows = Math.ceil(patients.length / cols);
    const rows = Math.max(configRows, requiredRows);

    const totalWidth = (cols * (CELL_SIZE + CELL_GAP)) - CELL_GAP + GRID_PADDING;
    const slots = Array.from({ length: rows * cols });
  
    return (
      <div 
        className="absolute flex flex-col items-center"
        style={{
          left: config.x,
          top: config.y,
          width: totalWidth,
        }}
      >
        {/* Header */}
        <div className="mb-3 pointer-events-none select-none z-10 flex justify-center">
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/50 shadow-sm">
                <h3 className="font-bold text-slate-800 text-xl whitespace-nowrap tracking-tight">{title}</h3>
                <span className="flex items-center justify-center bg-slate-200 text-slate-700 text-sm px-2.5 py-0.5 rounded-full font-bold">
                    {patients.length}
                </span>
            </div>
        </div>
  
        {/* Grid Body */}
        <div 
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-4 shadow-sm relative transition-all duration-200 hover:shadow-md hover:border-blue-200"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
            gap: `${CELL_GAP}px`,
          }}
        >
          {slots.map((_, i) => {
             const patient = patients[i];
             return (
                <div key={i} className="relative w-full h-full">
                    {/* Background Slot */}
                    <div className="absolute inset-0 bg-slate-100 rounded-lg border border-slate-50" />
                    
                    {/* Patient (if exists) */}
                    {patient && (
                        <div className="absolute inset-0 z-10">
                            <PatientSquare 
                                patient={patient} 
                                isSelected={selectedPatientId === patient.id}
                                onClick={onPatientClick}
                            />
                        </div>
                    )}
                </div>
             );
          })}
        </div>
      </div>
    );
};