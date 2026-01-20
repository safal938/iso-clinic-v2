import React, { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GRIDS, MOCK_PATIENTS, INITIAL_VIEWPORT, CELL_SIZE, CELL_GAP, GRID_PADDING, HEADER_HEIGHT } from './constants';
import { GridContainer } from './Grid';
import { Patient, ViewportState } from './types';
import { ConnectionLines } from './ConnectionLines';
import { Plus, Minus, RotateCcw, X, ExternalLink, FileText, Stethoscope, Activity, ClipboardList, UserCheck, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LINK_ENABLED_GRIDS = ['urgent-hep', 'routine-tier1', 'complex-tier2', 'external'];

export const GridSystem: React.FC = () => {
  const navigate = useNavigate();
  const [viewport, setViewport] = useState<ViewportState>(INITIAL_VIEWPORT);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  const [patients] = useState<Patient[]>(MOCK_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Dynamic Auto-Layout Engine ---
  const layoutGrids = useMemo(() => {
    // Clone grids to avoid mutation
    const newGrids = GRIDS.map(g => ({ ...g }));

    // Define visual columns (stages)
    const columns = [
      ['direct-referral', 'gp-referral', 'local-trust', 'icb-transfer'], // Stage 0: Inputs
      ['intake'],                                                        // Stage 1: Intake
      ['gp-manage', 'clinical-triage'],                                  // Stage 2: Decision
      ['urgent-hep', 'routine-tier1', 'complex-tier2', 'external'],      // Stage 3: Clinics
      ['diag-1', 'diag-2', 'diag-3', 'diag-4']                           // Stage 4: Diagnostics
    ];

    const COLUMN_SPACING = 800; // Horizontal space between columns
    const ROW_SPACING = 80;     // Vertical space between grids
    const BASE_Y = 1000;         // Center Y point for vertical alignment

    columns.forEach((columnIds, colIndex) => {
      const colX = colIndex * COLUMN_SPACING;
      
      // 1. Calculate height of each grid in this column
      const gridCalculations = columnIds.map(id => {
        const grid = newGrids.find(g => g.id === id)!;
        const count = patients.filter(p => p.gridId === id).length;
        
        // Calculate rows needed
        const requiredRows = Math.ceil(count / grid.cols);
        const effectiveRows = Math.max(grid.rows, requiredRows);
        
        // Calculate pixel height: Header + Grid Body (Rows * Cell + Gaps + Padding)
        // Matches Grid.tsx calculation exactly
        const gridBodyHeight = (effectiveRows * (CELL_SIZE + CELL_GAP)) - CELL_GAP + GRID_PADDING;
        const totalGridHeight = HEADER_HEIGHT + gridBodyHeight;
        
        return { id, height: totalGridHeight, gridRef: grid };
      });

      // 2. Calculate total column height to vertically center it
      const totalColHeight = gridCalculations.reduce((sum, item) => sum + item.height, 0) + 
                             ((gridCalculations.length - 1) * ROW_SPACING);
      
      // 3. Determine Start Y
      let currentY = BASE_Y - (totalColHeight / 2);

      // 4. Assign positions
      gridCalculations.forEach(item => {
        item.gridRef.x = colX;
        item.gridRef.y = currentY;
        currentY += item.height + ROW_SPACING;
      });
    });

    return newGrids;
  }, [patients]);

  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;
  const showExternalLink = selectedPatient && LINK_ENABLED_GRIDS.includes(selectedPatient.gridId);

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      
      setViewport(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom Handler
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const scaleAmount = -e.deltaY * 0.001;
      const newScale = Math.min(Math.max(viewport.scale + scaleAmount, 0.1), 3);
      setViewport(prev => ({ ...prev, scale: newScale }));
    } else {
       setViewport(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  // Manual Controls
  const zoomIn = () => setViewport(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 3) }));
  const zoomOut = () => setViewport(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.1) }));
  const resetView = () => setViewport(INITIAL_VIEWPORT);

  // Helper to determine what extra data to show based on grid stage
  const renderStageSpecificDetails = (patient: Patient) => {
    // Stage 1: Intake (Needs Referral Source & Report)
    if (patient.gridId === 'intake') {
        return (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2 text-blue-800 font-semibold text-sm">
                    <FileText size={16} />
                    <span>Incoming Referral Data</span>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Source:</span>
                        <span className="font-medium">{patient.referralSource}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-slate-500">Date:</span>
                        <span className="font-medium">{patient.referralDate}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-200">
                        <span className="text-xs text-slate-500 uppercase font-bold">Referral Summary</span>
                        <p className="mt-1 italic text-slate-600 bg-white p-2 rounded border border-blue-100">
                            "{patient.referralSummary}"
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // GP Manage (Reject from Triage)
    if (patient.gridId === 'gp-manage') {
        return (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                 <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold text-sm">
                    <UserCheck size={16} />
                    <span>Discharged to Primary Care</span>
                </div>
                <div className="space-y-3 text-sm">
                     <div className="p-3 bg-white rounded border border-slate-200 text-slate-600 italic">
                        "Clinical review indicates this case is suitable for management in primary care. Rejected for specialist hepatology triage."
                     </div>
                     
                     <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 uppercase font-bold">Discharge Reason</span>
                        <span className="font-medium text-slate-800">{patient.dischargeReason}</span>
                    </div>
                </div>
            </div>
        );
    }

    // Stage 2: Triage (Needs Assessment Notes)
    if (patient.gridId === 'clinical-triage') {
        return (
            <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                 <div className="flex items-center gap-2 mb-2 text-purple-800 font-semibold text-sm">
                    <Activity size={16} />
                    <span>Triage Assessment</span>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Priority Score:</span>
                        <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded font-bold text-xs">{patient.priorityScore}/10</span>
                    </div>
                     <div className="mt-2">
                        <span className="text-xs text-slate-500 uppercase font-bold">Clinical Notes</span>
                        <p className="mt-1 text-slate-700">
                           {patient.triageNotes}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Stage 3: Clinics (Needs Assigned Clinician)
    if (['urgent-hep', 'routine-tier1', 'complex-tier2'].includes(patient.gridId)) {
         return (
            <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                 <div className="flex items-center gap-2 mb-2 text-emerald-800 font-semibold text-sm">
                    <Stethoscope size={16} />
                    <span>Clinic Assignment</span>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Clinician:</span>
                        <span className="font-medium text-slate-800">{patient.assignedClinician}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Referral Origin:</span>
                        <span className="text-slate-600">{patient.referralSource || 'Internal'}</span>
                    </div>
                </div>
            </div>
        );
    }

     // Stage 4: Diagnostics (Needs Test List)
     if (patient.gridId.includes('diag')) {
        return (
           <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center gap-2 mb-2 text-orange-800 font-semibold text-sm">
                   <ClipboardList size={16} />
                   <span>Lab & Diagnostic Request</span>
               </div>
               <div className="space-y-1">
                   {patient.requestedTests?.map((test, idx) => (
                       <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 bg-white p-2 rounded border border-orange-100">
                           <div className="w-2 h-2 rounded-full bg-orange-400" />
                           {test}
                       </div>
                   ))}
               </div>
           </div>
       );
   }

    // Default / Input Stages
    return (
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-slate-400 text-sm italic">
            New intake - Awaiting initial review data.
        </div>
    );
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* Navbar / Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 z-50 flex items-center justify-between px-6 shadow-sm">
         <div className="flex items-center gap-3">
             <button
               onClick={() => navigate('/')}
               className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-slate-600 hover:text-slate-900"
             >
               <ArrowLeft size={20} />
               <span className="text-sm font-medium">Back</span>
             </button>
             <div className="w-px h-8 bg-slate-200 mx-2" />
           
             <h1 className="text-xl font-bold text-slate-800">Medforce <span className="text-blue-600">Triage</span></h1>
         </div>
         
         <div className="flex items-center gap-4 text-sm text-slate-500">
            
         </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div 
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            width: '5000px',
            height: '5000px',
            position: 'relative'
          }}
        >
          {/* Layer 1: Connections (Passed layoutGrids to ensure correct lines) */}
          <ConnectionLines grids={layoutGrids} patients={patients} />

          {/* Layer 2: Grids */}
          {layoutGrids.map(grid => (
            <GridContainer 
              key={grid.id}
              config={grid}
              patients={patients.filter(p => p.gridId === grid.id)}
              selectedPatientId={selectedPatientId || undefined}
              onPatientClick={(p) => setSelectedPatientId(p.id)}
            />
          ))}
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
         <button onClick={resetView} className="p-3 bg-white border border-slate-200 shadow-lg rounded-full hover:bg-slate-50 text-slate-700 transition-colors">
            <RotateCcw size={20} />
         </button>
         <div className="flex flex-col bg-white border border-slate-200 shadow-lg rounded-full overflow-hidden">
            <button onClick={zoomIn} className="p-3 hover:bg-slate-50 text-slate-700 border-b border-slate-100 transition-colors">
                <Plus size={20} />
            </button>
            <button onClick={zoomOut} className="p-3 hover:bg-slate-50 text-slate-700 transition-colors">
                <Minus size={20} />
            </button>
         </div>
      </div>

      {/* Patient Detail Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             {/* Backdrop */}
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPatientId(null)}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
             />

             {/* Modal Card */}
             <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
             >
                {/* Header with color based on status */}
                <div className={`h-24 p-6 flex items-start justify-between ${
                    selectedPatient.status === 'POOL' ? 'bg-blue-600' :
                    selectedPatient.status === 'CRITICAL' ? 'bg-red-500' :
                    selectedPatient.status === 'MODERATE' ? 'bg-orange-500' : 'bg-green-500'
                }`}>
                    <div className="text-white">
                        <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                        <p className="text-white/80 text-sm font-medium tracking-wide">{selectedPatient.id}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedPatientId(null)}
                      className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Initial Badge overlapping header and body */}
                <div className="px-6 relative">
                     <div className={`absolute -top-10 w-20 h-20 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-white ${
                        selectedPatient.status === 'POOL' ? 'bg-blue-500' :
                        selectedPatient.status === 'CRITICAL' ? 'bg-red-500' :
                        selectedPatient.status === 'MODERATE' ? 'bg-orange-400' : 'bg-green-500'
                     }`}>
                        {selectedPatient.initials}
                     </div>
                </div>

                <div className="pt-12 pb-6 px-6 space-y-6">
                    
                    {/* Status & Grid Info */}
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                            {selectedPatient.status}
                        </div>
                        <div className="text-sm text-slate-500 font-medium">
                            {GRIDS.find(g => g.id === selectedPatient.gridId)?.title}
                        </div>
                    </div>

                    {/* Standard Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-xs text-slate-400 font-semibold uppercase">Age</span>
                            <div className="text-slate-700 font-medium">{selectedPatient.age}</div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-xs text-slate-400 font-semibold uppercase">Condition</span>
                            <div className="text-slate-700 font-medium">{selectedPatient.condition}</div>
                        </div>
                    </div>

                    {/* Dynamic Stage Info */}
                    {renderStageSpecificDetails(selectedPatient)}

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                        {showExternalLink && (
                          <a 
                             href={`/pre-consultation-form/${selectedPatient.id}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-200 transition-all hover:scale-[1.02]"
                          >
                              <ExternalLink size={18} />
                              Pre-Consultation Form
                          </a>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                             <button className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-sm transition-colors">
                                Reassign
                             </button>
                             <button className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-sm transition-colors">
                                Discharge
                             </button>
                        </div>
                    </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};