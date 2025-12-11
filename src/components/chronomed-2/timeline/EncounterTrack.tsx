import React, { useState, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { Encounter } from '../types';
import { Handle, Position } from 'reactflow';

interface EncounterTrackProps {
  encounters: Encounter[];
  scale: d3.ScaleTime<number, number>;
  showHandles?: boolean;
}

export const EncounterTrack: React.FC<EncounterTrackProps> = ({ encounters, scale, showHandles = false }) => {
  const [trackHeight, setTrackHeight] = useState<number>(350); 
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Helper to calculate and set height
  const updateHeight = () => {
    let maxH = 0;
    cardsRef.current.forEach((card) => {
      if (card) {
        maxH = Math.max(maxH, card.offsetHeight);
      }
    });
    // Buffer: top padding(16) + card + bottom(24)
    const calculatedHeight = maxH > 0 ? maxH + 40 : 350;
    
    if (Math.abs(calculatedHeight - trackHeight) > 2) {
      setTrackHeight(calculatedHeight);
    }
  };

  // Measure initially and on prop changes
  useLayoutEffect(() => {
    updateHeight();
  }, [encounters, scale]);

  // Add ResizeObserver to handle font loads or other reflows
  useEffect(() => {
    const observers: ResizeObserver[] = [];
    cardsRef.current.forEach((card) => {
      if (card) {
        const ro = new ResizeObserver(() => updateHeight());
        ro.observe(card);
        observers.push(ro);
      }
    });
    return () => observers.forEach(ro => ro.disconnect());
  }, [encounters]); // Re-bind if encounters change

  // Reset ref array on render
  cardsRef.current = [];

  // For EncounterTrack, we don't have story connections yet, so always show at full opacity
  // But keep the structure consistent for future implementation
  const trackOpacity = 1;

  return (
    <div 
        className="relative w-full transition-[height] duration-300 ease-out z-20" 
        style={{ 
          height: trackHeight,
          opacity: trackOpacity,
          transition: 'opacity 0.3s ease'
        }}
    >
        {/* Track Label */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-4 hidden">Encounters</div>
        
        {encounters.map((enc, i) => {
            const x = scale(new Date(enc.date));
            
            // Data mapping logic
            const title = enc.differential_diagnosis?.[0] || enc.diagnosis || enc.type;
            const description = enc.impression || enc.notes;

            // Differential Logic: if we used the first one as title, show the rest
            const differentials = enc.differential_diagnosis || [];
            const hasDifferentials = differentials.length > 1;
            const secondaryDifferentials = differentials.slice(1);

        

            return (
            <div 
                key={enc.encounter_no} 
                ref={(el) => { cardsRef.current[i] = el; }}
                className="absolute top-4 w-[260px] bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-slate-200 hover:border-blue-300 cursor-pointer group/card overflow-visible z-20"
                style={{ left: x, transform: 'translateX(-50%)' }}
            >
                {/* Color Bar */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                
                <div className="p-2.5">
                  

                    <div className="flex flex-wrap gap-2 justify-between items-start mb-1">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wide">
                            {enc.type}
                        </span>
                        {enc.provider && (
                            <span className="text-[9px] text-slate-400 font-medium">
                                {enc.provider}
                            </span>
                        )}
                    </div>
                    
                    {enc.chief_complaint && (
                        <div className="mb-2 pb-2 border-l-1 border-amber-500 p-2.5 rounded-r">
                            <div className="text-[10px] font-bold text-amber-800 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Chief Complaint
                            </div>
                            <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                "{enc.chief_complaint}"
                            </div>
                        </div>
                    )}
                    
                    <div className="text-sm font-bold text-slate-800 mb-1 leading-tight group-hover/card:text-blue-600 transition-colors">
                        {title}
                    </div>
                    
                    <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-1.5 rounded border border-slate-100">
                        {description}
                    </div>

                    {hasDifferentials && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                            <div className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Differential Diagnosis</div>
                            <ul className="list-disc list-inside">
                                {secondaryDifferentials.map((d, idx) => (
                                    <li key={idx} className="text-[9px] text-slate-600 leading-tight mb-0.5">{d}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {enc.notes && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                            <div className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Clinical Notes</div>
                            <div className="text-[10px] text-slate-600 leading-relaxed">
                                {enc.notes}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Connector Dot */}
                <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>

                {/* React Flow Handles - Overlaid at same position */}
                {showHandles && (
                    <>
                        <Handle
                            type="target"
                            position={Position.Bottom}
                            id={`enc-${enc.encounter_no}-target`}
                            style={{
                                left: '50%',
                                bottom: -8,
                                transform: 'translateX(-50%)',
                                width: 12,
                                height: 12,
                                background: '#667eea',
                                border: '2px solid white',
                                borderRadius: '50%',
                                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
                                zIndex: 50
                            }}
                        />
                        <Handle
                            type="source"
                            position={Position.Bottom}
                            id={`enc-${enc.encounter_no}-source`}
                            style={{
                                left: '50%',
                                bottom: -8,
                                transform: 'translateX(-50%)',
                                width: 12,
                                height: 12,
                                background: 'transparent',
                                border: 'none',
                                zIndex: 51
                            }}
                        />
                    </>
                )}
            </div>
            );
        })}
    </div>
  );
};
