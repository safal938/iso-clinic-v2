import React, { useMemo, useState, useRef, useLayoutEffect, useEffect } from 'react';
import * as d3 from 'd3';
import { Encounter, Medication, LabMetric, LabValue, KeyEvent, RiskPoint, CausalNode } from './types';

// --- Helper Hooks ---
// Creates a Polylinear scale that maps specific encounter dates to evenly spaced X coordinates
export const useTimelineScale = (encounters: Encounter[], width: number, padding: number) => {
  return useMemo(() => {
    // Sort encounters by date to ensure strict time ordering
    const sortedDates = [...encounters]
        .map(e => new Date(e.date))
        .sort((a, b) => a.getTime() - b.getTime());
    
    if (sortedDates.length === 0) return d3.scaleTime();

    // We want the encounters to be spaced evenly across the available width (minus padding)
    const availableWidth = width - (padding * 2);
    
    // If we have N encounters, we have N-1 segments between them.
    // Step size is constant visual distance.
    const step = availableWidth / (sortedDates.length > 1 ? sortedDates.length - 1 : 1);
    
    // Create the main domain and range for the encounters
    // Domain: [Date1, Date2, Date3, ...]
    // Range:  [Pad, Pad+Step, Pad+2Step, ...]
    const domain = sortedDates;
    const range = sortedDates.map((_, i) => padding + (i * step));

    // To handle data points (like meds/labs) that fall *before* the first encounter 
    // or *after* the last one, we add extension points to the scale.
    // We project a "virtual" step backward and forward.
    // We use an arbitrary time buffer (e.g., 1 year) to map to that step distance.
    
    const firstDate = sortedDates[0];
    const lastDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : new Date();
    
    const preDate = d3.timeYear.offset(firstDate, -1); // 1 year before
    const postDate = d3.timeYear.offset(lastDate, 1);  // 1 year after

    const fullDomain = [preDate, ...domain, postDate];
    const fullRange = [padding - step, ...range, width - padding + step];

    // d3.scaleTime handles the linear interpolation between these discrete points.
    return d3.scaleTime()
      .domain(fullDomain)
      .range(fullRange);
  }, [encounters, width, padding]);
};

// --- Components ---

interface MasterGridProps {
    encounters: Encounter[];
    scale: d3.ScaleTime<number, number>;
    height: number | string;
}

export const MasterGrid: React.FC<MasterGridProps> = ({ encounters, scale, height }) => {
    return (
        <div className="absolute top-0 left-0 w-full pointer-events-none z-0" style={{ height }}>
            <svg width="100%" height="100%">
                {encounters.map((enc, i) => {
                    const x = scale(new Date(enc.date));
                    return (
                        <g key={i}>
                            {/* Dashed vertical line */}
                            <line 
                                x1={x} y1={0} 
                                x2={x} y2="100%" 
                                stroke="#E5E7EB" 
                                strokeWidth={1.5} 
                                strokeDasharray="6,4" 
                            />
                            {/* Small dot at top */}
                            <circle cx={x} cy={0} r={3} fill="#CBD5E1" />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

interface TimelineAxisProps {
  encounters: Encounter[];
  scale: d3.ScaleTime<number, number>;
}

export const TimelineAxis: React.FC<TimelineAxisProps> = ({ encounters, scale }) => {
  // Sort to match scale
  const sortedEncounters = [...encounters].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="relative w-full h-8">
       {/* We render specific dates for encounters, not generic ticks */}
      {sortedEncounters.map((enc, i) => {
          const date = new Date(enc.date);
          const x = scale(date);
          
          // Always show Month + Day + Year (e.g., "Aug 10, 2015")
          const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

          return (
            <div 
                key={i} 
                className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center pt-1"
                style={{ left: x }}
            >
                <div className="text-[9px] font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded-full border border-gray-100 shadow-sm z-10 whitespace-nowrap">
                    {label}
                </div>
                {/* Connector to the grid line below */}
                <div className="w-px h-2 bg-gray-300 mt-0.5"></div>
            </div>
          );
      })}
    </div>
  );
};

interface EncounterTrackProps {
  encounters: Encounter[];
  scale: d3.ScaleTime<number, number>;
}

export const EncounterTrack: React.FC<EncounterTrackProps> = ({ encounters, scale }) => {
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
    // Compact buffer: top(8) + card + bottom(16)
    const calculatedHeight = maxH > 0 ? maxH + 24 : 350;
    
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

  return (
    <div 
        className="relative w-full transition-[height] duration-300 ease-out z-20" 
        style={{ height: trackHeight }}
    >
        {/* Track Label */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-4 hidden">Encounters</div>
        
        {encounters.map((enc, i) => {
            const x = scale(new Date(enc.date));
            
            // Data mapping logic
            const title = enc.differential_diagnosis?.[0] || enc.diagnosis || enc.type;
            const description = enc.impression || enc.notes;
            const hasMeds = enc.medications && enc.medications.length > 0;

            // Differential Logic: if we used the first one as title, show the rest
            const differentials = enc.differential_diagnosis || [];
            const hasDifferentials = differentials.length > 1;
            const secondaryDifferentials = differentials.slice(1);

            // Debug logging
            console.log(`Encounter ${enc.encounter_no}:`, {
                has_chief_complaint: !!enc.chief_complaint,
                chief_complaint: enc.chief_complaint,
                date: enc.date
            });

            return (
            <div 
                key={enc.encounter_no} 
                ref={(el) => { cardsRef.current[i] = el; }}
                className="absolute top-1 w-[260px] bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-slate-200 hover:border-blue-300 cursor-pointer group/card overflow-hidden z-20"
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
            </div>
            );
        })}
    </div>
  );
};

interface MedicationTrackProps {
  medications: Medication[];
  scale: d3.ScaleTime<number, number>;
}

export const MedicationTrack: React.FC<MedicationTrackProps> = ({ medications, scale }) => {
  // Group medications by name to display them on the same track/line
  const groupedMedications = useMemo(() => {
    const groups: Record<string, Medication[]> = {};
    medications.forEach(med => {
        if (!groups[med.name]) {
            groups[med.name] = [];
        }
        groups[med.name].push(med);
    });
    return groups;
  }, [medications]);

  const groupKeys = Object.keys(groupedMedications);

  return (
    <div className="relative w-full py-1 border-t border-gray-100 bg-slate-50/30 z-10">
       <div className="absolute left-4 -top-2.5 px-1.5 py-0.5 bg-white border border-gray-100 rounded text-[9px] font-bold text-gray-400 uppercase tracking-wider shadow-sm">
            Medications
       </div>
       
       <div className="mt-1.5 flex flex-col gap-0.5">
        {groupKeys.map((medName, groupIdx) => {
            const groupMeds = groupedMedications[medName];
            
            let barClass = "bg-emerald-100 border-emerald-300 text-emerald-800";
            let dotClass = "bg-emerald-500";
            const nameLower = medName.toLowerCase();
            
            if (nameLower.includes("methotrexate")) {
                barClass = "bg-purple-100 border-purple-300 text-purple-900";
                dotClass = "bg-purple-500";
            } else if (nameLower.includes("lisinopril")) {
                barClass = "bg-orange-100 border-orange-300 text-orange-900";
                dotClass = "bg-orange-500";
            } else if (nameLower.includes("trimethoprim")) {
                barClass = "bg-red-100 border-red-300 text-red-900";
                dotClass = "bg-red-500";
            }

            return (
                <div key={groupIdx} className="relative h-5 w-full group">
                    {groupMeds.map((med, idx) => {
                        const start = scale(new Date(med.startDate));
                        const endDate = med.endDate ? new Date(med.endDate) : new Date(); 
                        const end = scale(endDate);
                        const width = Math.max(end - start, 10); 

                        return (
                            <React.Fragment key={idx}>
                                <div 
                                    className={`absolute top-0.5 h-4 rounded-sm border shadow-sm flex items-center px-1.5 overflow-hidden whitespace-nowrap transition-all hover:shadow-md hover:z-20 ${barClass}`}
                                    style={{ left: start, width: width }}
                                >
                                     <div className={`w-1 h-1 rounded-full mr-1.5 ${dotClass} shrink-0`}></div>
                                     <span className="text-[9px] font-bold mr-2">{med.name}</span>
                                     <span className="text-[8px] opacity-75 border-l border-current pl-2">{med.dose}</span>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            );
        })}
       </div>
    </div>
  );
};

interface SingleLabChartProps {
    metric: LabMetric;
    scale: d3.ScaleTime<number, number>;
    height: number;
    index: number;
}

const SingleLabChart: React.FC<SingleLabChartProps> = ({ metric, scale, height, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const CHART_MARGIN = { top: 24, bottom: 20, left: 48, right: 24 };
    const values = metric.values;
    
    if (values.length === 0) return null;

    const hasRefRange = !!metric.referenceRange;
    const refMin = metric.referenceRange?.min ?? 0;
    const refMax = metric.referenceRange?.max ?? 100;

    // Calculate Domain
    const valExtent = d3.extent(values, d => d.value) as [number, number];
    let [minData, maxData] = valExtent;
    if (minData === undefined) minData = 0;
    if (maxData === undefined) maxData = 100;

    let yMin = minData;
    let yMax = maxData;

    if (hasRefRange) {
        yMin = Math.min(minData, refMin);
        yMax = Math.max(maxData, refMax);
    }

    const rangeSpan = yMax - yMin;
    const buffer = rangeSpan === 0 ? (yMax || 1) * 0.2 : rangeSpan * 0.2;
    
    let domainMin = yMin - buffer;
    let domainMax = yMax + buffer;

    if (minData >= 0 && refMin >= 0) {
        domainMin = Math.max(0, domainMin);
    }

    const yScale = d3.scaleLinear()
        .domain([domainMin, domainMax])
        .range([height - CHART_MARGIN.bottom, CHART_MARGIN.top]);

    // Generators - Use step curve to show constant values until next measurement
    const line = d3.line<{t: string, value: number}>()
        .x(d => scale(new Date(d.t)))
        .y(d => yScale(d.value))
        .curve(d3.curveStepAfter);

    const area = d3.area<{t: string, value: number}>()
        .x(d => scale(new Date(d.t)))
        .y0(height - CHART_MARGIN.bottom)
        .y1(d => yScale(d.value))
        .curve(d3.curveStepAfter);

    const pathD = line(values) || "";
    const areaD = area(values) || "";

    // Gradient Logic - Use pixel offsets to be precise with userSpaceOnUse
    const yRefMin = hasRefRange ? yScale(refMin) : height;
    const yRefMax = hasRefRange ? yScale(refMax) : 0;
    
    // Calculate normalized offsets [0, 1] for the gradient
    const offMax = Math.max(0, Math.min(1, yRefMax / height));
    const offMin = Math.max(0, Math.min(1, yRefMin / height));

    const gradientId = `line-gradient-${index}`;
    const areaGradientId = `area-gradient-${index}`;

    const lastVal = values[values.length - 1];
    const isLastAbnormal = hasRefRange && (lastVal.value > refMax || lastVal.value < refMin);

    return (
        <div 
            className="relative w-full bg-white border-y border-slate-100 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header */}
            <div className="absolute top-2 left-0 w-full px-12 flex justify-between items-center z-20 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-[1px] px-2 py-1 rounded border border-slate-100 shadow-sm flex items-baseline gap-2">
                    <span className="text-xs font-bold text-slate-800">{metric.biomarker}</span>
                    <span className="text-[10px] font-medium text-slate-500">
                        {metric.unit}
                        {hasRefRange && (
                            <span className="text-slate-400 ml-1 font-normal">
                                (Normal: {metric.referenceRange!.min}-{metric.referenceRange!.max})
                            </span>
                        )}
                    </span>
                    </div>
                    <div className="flex items-center bg-white/90 backdrop-blur-[1px] px-2 py-1 rounded border border-slate-100 shadow-sm">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider mr-2">Current</span>
                    <span className={`text-sm font-mono font-bold ${isLastAbnormal ? 'text-red-600' : 'text-slate-700'}`}>
                        {lastVal.value}
                    </span>
                    </div>
            </div>
            
            <div style={{ height }} className="w-full relative">
                <svg width="100%" height={height} className="overflow-visible absolute left-0 top-0">
                    <defs>
                         {/* Line Gradient - Defined in User Space (Pixels) to align exactly with lines */}
                         {/* Logic: 0 (Top) -> yRefMax (Red), yRefMax -> yRefMin (Blue), yRefMin -> Height (Red) */}
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
                            {hasRefRange ? (
                                <>
                                    <stop offset={0} stopColor="#EF4444" />
                                    <stop offset={offMax} stopColor="#EF4444" />
                                    <stop offset={offMax} stopColor="#10B981" />
                                    <stop offset={offMin} stopColor="#10B981" />
                                    <stop offset={offMin} stopColor="#EF4444" />
                                    <stop offset={1} stopColor="#EF4444" />
                                </>
                            ) : (
                                <>
                                    <stop offset={0} stopColor="#10B981" />
                                    <stop offset={1} stopColor="#10B981" />
                                </>
                            )}
                        </linearGradient>
                        
                         {/* Area Gradient */}
                         <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
                             {hasRefRange ? (
                                <>
                                    {/* High Values (Above Max) - Red */}
                                    <stop offset={0} stopColor="#EF4444" stopOpacity="0.15"/>
                                    <stop offset={offMax} stopColor="#EF4444" stopOpacity="0.15"/>
                                    
                                    {/* Normal Range - Green */}
                                    <stop offset={offMax} stopColor="#10B981" stopOpacity="0.05"/>
                                    <stop offset={1} stopColor="#10B981" stopOpacity="0.05"/>
                                </>
                             ) : (
                                <stop offset={0} stopColor="#10B981" stopOpacity="0.1" />
                             )}
                        </linearGradient>

                        <clipPath id={`clip-${index}`}>
                                <rect x={CHART_MARGIN.left} y={0} width="100%" height={height} />
                        </clipPath>
                    </defs>

                    {/* Grid & Lines */}
                    {yScale.ticks(5).map((tick, i) => (
                        <g key={i} transform={`translate(0, ${yScale(tick)})`}>
                            <line x1={CHART_MARGIN.left} x2="100%" stroke="#F1F5F9" strokeWidth={1} />
                            <text x={CHART_MARGIN.left - 8} y={3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">{tick}</text>
                        </g>
                    ))}

                    {/* Limit Lines */}
                    {hasRefRange && (
                        <>
                            <line x1={CHART_MARGIN.left} x2="100%" y1={yRefMax} y2={yRefMax} stroke="#EF4444" strokeWidth={1} strokeDasharray="4,4" opacity={0.3} />
                            <line x1={CHART_MARGIN.left} x2="100%" y1={yRefMin} y2={yRefMin} stroke="#10B981" strokeWidth={1} strokeDasharray="4,4" opacity={0.3} />
                        </>
                    )}

                    {/* Data */}
                    <g clipPath={`url(#clip-${index})`}>
                        <path d={areaD} fill={`url(#${areaGradientId})`} className="transition-all duration-500" />
                        <path d={pathD} fill="none" stroke={`url(#${gradientId})`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" />
                    </g>

                    {/* Data Points and Tooltips */}
                    {values.map((v, i) => {
                        const isAbnormal = hasRefRange && (v.value > refMax || v.value < refMin);
                        const pointColor = isAbnormal ? "#EF4444" : "#10B981";
                        // Always render the circle
                        return (
                            <g key={i} transform={`translate(${scale(new Date(v.t))}, ${yScale(v.value)})`}>
                                <circle 
                                    r={isHovered ? 5 : 3}
                                    fill="white" 
                                    stroke={pointColor} 
                                    strokeWidth={2} 
                                    className="transition-all duration-200"
                                />
                                {isHovered && (
                                    <g transform="translate(0, -12)" className="pointer-events-none animate-fade-in-up"> 
                                        <rect x="-20" y="-24" width="40" height="20" rx="4" fill="#1E293B" className="shadow-lg" />
                                        <text y="-10" textAnchor="middle" className="text-[10px] fill-white font-bold font-mono">
                                            {v.value}
                                        </text>
                                        <path d="M-4 -4 L4 -4 L0 0 Z" fill="#1E293B" />
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

interface LabTrackProps {
  labs: LabMetric[];
  scale: d3.ScaleTime<number, number>;
  height?: number;
}

export const LabTrack: React.FC<LabTrackProps> = ({ labs, scale, height = 140 }) => {
  return (
    <div className="w-full border-t border-gray-200 bg-slate-50/50 pt-8 pb-6 relative z-0 flex flex-col gap-3">
         {/* Section Header */}
         <div className="absolute left-4 top-0 -translate-y-1/2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm flex items-center gap-2 z-10">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Lab Trends</span>
         </div>
         
        {labs.map((metric, idx) => (
            <SingleLabChart key={idx} metric={metric} scale={scale} height={height} index={idx} />
        ))}
    </div>
  );
};

interface RiskTrackProps {
    data: RiskPoint[];
    scale: d3.ScaleTime<number, number>;
}

export const RiskTrack: React.FC<RiskTrackProps> = ({ data, scale }) => {
    const [isHovered, setIsHovered] = useState(false);
    const height = 160;
    const margin = { top: 20, bottom: 20, left: 40 };

    // Sort data chronologically
    const sortedData = useMemo(() => {
        if (!data) return [];
        return [...data].sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
    }, [data]);

    if (sortedData.length === 0) return null;

    // Y Scale for Risk (0 - 10)
    const yScale = d3.scaleLinear()
        .domain([0, 10])
        .range([height - margin.bottom, margin.top]);

    // Area Generator
    const areaGenerator = d3.area<RiskPoint>()
        .x(d => scale(new Date(d.t)))
        .y0(height - margin.bottom)
        .y1(d => yScale(d.riskScore))
        .curve(d3.curveMonotoneX);

    // Line Generator
    const lineGenerator = d3.line<RiskPoint>()
        .x(d => scale(new Date(d.t)))
        .y(d => yScale(d.riskScore))
        .curve(d3.curveMonotoneX);

    const areaPath = areaGenerator(sortedData) || "";
    const linePath = lineGenerator(sortedData) || "";

    return (
        <div 
            className="relative w-full border-t border-gray-200 bg-white mt-2 pt-4 pb-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header */}
            <div className="absolute left-4 top-1 z-10">
                 <div className="px-2 py-0.5 bg-white  border border-slate-200 text-black rounded text-[10px] font-bold uppercase tracking-wider shadow-md">
                     Risk
                 </div>
            </div>

            <div style={{ height }} className="w-full relative">
                <svg width="100%" height={height} className="overflow-visible">
                    <defs>
                        <linearGradient id="riskGradient" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.1" />
                            <stop offset="50%" stopColor="#eab308" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.4" />
                        </linearGradient>
                        <linearGradient id="riskLineGradient" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="50%" stopColor="#eab308" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 2.5, 5, 7.5, 10].map(tick => (
                        <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
                             <line x1={margin.left} x2="100%" stroke="#f1f5f9" strokeWidth={1} />
                             <text x={margin.left - 6} y={3} textAnchor="end" className="text-[8px] fill-slate-400 font-mono">{tick}</text>
                        </g>
                    ))}

                    {/* Chart Area */}
                    <path d={areaPath} fill="url(#riskGradient)" />
                    <path d={linePath} fill="none" stroke="url(#riskLineGradient)" strokeWidth={2.5} strokeLinecap="round" />

                    {/* Data Points & Tooltips */}
                    {sortedData.map((point, i) => {
                        const x = scale(new Date(point.t));
                        const y = yScale(point.riskScore);
                        let color = "#22c55e";
                        if (point.riskScore > 4) color = "#eab308";
                        if (point.riskScore > 7) color = "#ef4444";

                        return (
                            <g key={i} transform={`translate(${x}, ${y})`} className="group cursor-pointer">
                                {/* Hit area */}
                                <circle r={8} fill="transparent" />
                                
                                {/* Visual Dot */}
                                <circle r={4} fill="white" stroke={color} strokeWidth={2} className="transition-all group-hover:r-5 group-hover:stroke-width-4" />

                                {/* Tooltip - Custom Implementation */}
                                <foreignObject 
                                    x={-100} 
                                    y={-120} 
                                    width={200} 
                                    height={110} 
                                    className={`overflow-visible pointer-events-none transition-opacity duration-200 z-50 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="bg-white text-black text-[10px] rounded-lg shadow-xl p-2 w-full border border-slate-300">
                                            <div className="flex justify-between items-center border-b border-slate-300 pb-1 mb-1">
                                                <span className="font-bold text-slate-800">Risk Score: {point.riskScore}</span>
                                                <span className="text-slate-600">{new Date(point.t).toLocaleDateString()}</span>
                                            </div>
                                            <ul className="list-disc list-inside space-y-0.5">
                                                {point.factors.map((f, idx) => (
                                                    <li key={idx} className="text-[9px] leading-tight text-slate-700 truncate">{f}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        {/* Arrow */}
                                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

interface KeyEventsTrackProps {
  events: KeyEvent[];
  scale: d3.ScaleTime<number, number>;
}

export const KeyEventsTrack: React.FC<KeyEventsTrackProps> = ({ events, scale }) => {
    // Group events by Date to prevent vertical stacking of simultaneous events
    const groupedEvents = useMemo(() => {
        const groups: Record<string, KeyEvent[]> = {};
        events.forEach(e => {
            const dateKey = new Date(e.t).toDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(e);
        });
        
        return Object.values(groups).map(groupEvents => {
            // Sort within group by time if needed
            return {
                date: new Date(groupEvents[0].t),
                events: groupEvents,
                x: scale(new Date(groupEvents[0].t))
            };
        }).sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [events, scale]);

    // Layout algorithm to resolve overlaps between GROUPS
    // We place groups in rows. If a group overlaps horizontally with the previous group in Row 0, move to Row 1.
    const CARD_WIDTH = 280;
    const ROW_HEIGHT = 200; // Height allocated per row (card + gap)
    
    const positionedGroups = useMemo(() => {
        const rows: number[] = []; // Stores the right-most X coordinate for each row
        
        return groupedEvents.map(group => {
            const halfWidth = CARD_WIDTH / 2;
            const startX = group.x - halfWidth;
            const endX = group.x + halfWidth;
            
            let rowIndex = 0;
            while (true) {
                // Check if this row is free for this X range
                const lastEndInRow = rows[rowIndex] || -Infinity;
                if (startX >= lastEndInRow + 20) { // 20px gap
                    // Fits here
                    rows[rowIndex] = endX;
                    break;
                }
                rowIndex++;
            }
            
            return { ...group, rowIndex };
        });
    }, [groupedEvents]);

    const maxRow = positionedGroups.length > 0 ? Math.max(...positionedGroups.map(g => g.rowIndex)) : 0;
    // Total height is based on how many rows we actually used.
    const trackHeight = (maxRow + 1) * 240 + 60; 

    if (events.length === 0) return null;

    return (
        <div className="relative w-full mt-6 border-t border-red-100/50 bg-gradient-to-b from-red-50/30 to-transparent transition-all duration-500" style={{ height: trackHeight }}>
             {/* Header Label */}
             <div className="absolute left-4 -top-3 px-3 py-1 bg-white border border-red-200 rounded-full shadow-sm flex items-center gap-2 z-10">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Critical Events</span>
             </div>
             
             {positionedGroups.map((group, i) => {
                 const topPos = 40 + (group.rowIndex * 200);
                 
                 return (
                     <div 
                        key={i}
                        className="absolute flex flex-col items-center"
                        style={{ left: group.x, top: 0, transform: 'translateX(-50%)' }}
                     >
                        {/* Connector Line */}
                        <div 
                            className="absolute top-0 w-px border-l-2 border-dashed border-red-300"
                            style={{ height: topPos + 4 }}
                        ></div>

                        {/* Timeline Dot */}
                        <div className="absolute top-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm z-10 transform -translate-y-1/2"></div>
                        
                        {/* Card Container */}
                        <div 
                            className="relative bg-white rounded-lg shadow-md border border-red-100 hover:shadow-xl hover:border-red-300 transition-all duration-300 z-20 overflow-hidden"
                            style={{ marginTop: topPos, width: CARD_WIDTH }}
                        >
                            {/* Header */}
                            <div className="bg-red-50/50 px-3 py-2 border-b border-red-100 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wide">
                                    {group.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                    <span className="text-red-600 font-bold text-[10px]">!</span>
                                </div>
                            </div>

                            {/* Events List */}
                            <div className="divide-y divide-gray-100">
                                {group.events.map((evt, idx) => (
                                    <div key={idx} className="p-3 hover:bg-red-50/10 transition-colors">
                                        <h4 className="text-xs font-bold text-gray-900 mb-1 leading-tight">{evt.event}</h4>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">{evt.note}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>
                 );
             })}
        </div>
    );
}

export const CausalPathways: React.FC<{ nodes: CausalNode[] }> = ({ nodes }) => {
    if (!nodes || nodes.length === 0) return null;

    // Determine status/color based on content keywords
    const getStatus = (node: CausalNode) => {
        const text = (node.title + " " + node.description).toLowerCase();
        if (text.includes('crisis') || text.includes('injury') || text.includes('toxic') || text.includes('failure') || text.includes('severe') || text.includes('dili') || text.includes('encephalopathy')) return 'critical';
        if (text.includes('risk') || text.includes('warning') || text.includes('missed') || text.includes('exposure') || text.includes('continued') || text.includes('accumulation')) return 'warning';
        if (text.includes('recovery') || text.includes('cessation') || text.includes('stable') || text.includes('outcome') || text.includes('normal')) return 'good';
        return 'neutral';
    };

    // Light Theme Definitions (Medical/Clinical)
    const theme = {
        critical: { 
            accent: 'bg-red-500', 
            softBg: 'bg-red-50', 
            border: 'border-red-100',
            text: 'text-red-700',
            badge: 'bg-red-100 text-red-700 border-red-200'
        },
        warning:  { 
            accent: 'bg-amber-500', 
            softBg: 'bg-amber-50', 
            border: 'border-amber-100',
            text: 'text-amber-700',
            badge: 'bg-amber-100 text-amber-700 border-amber-200'
        },
        good:     { 
            accent: 'bg-emerald-500', 
            softBg: 'bg-emerald-50', 
            border: 'border-emerald-100',
            text: 'text-emerald-700',
            badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
        },
        neutral:  { 
            accent: 'bg-blue-500', 
            softBg: 'bg-blue-50', 
            border: 'border-blue-100',
            text: 'text-blue-700',
            badge: 'bg-blue-100 text-blue-700 border-blue-200'
        },
    };

    return (
        <div className="w-full bg-white border-t border-gray-200 pt-8 pb-12 relative">
             {/* Header Section */}
             <div className="px-8 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                         <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Causal Pathway Analysis</h2>
                        <p className="text-slate-500 text-xs mt-0.5">Forensic timeline reconstruction and failure point identification</p>
                    </div>
                </div>
             </div>

             {/* Flow Container */}
             <div className="relative overflow-x-auto px-8 pb-4 scrollbar-hide">
                {/* Connecting Line (Spine) running behind */}
                <div className="absolute top-[68px] left-8 right-8 h-0.5 bg-slate-100 z-0"></div>

                <div className="flex items-start min-w-max space-x-4">
                    {nodes.map((node, i) => {
                        const status = getStatus(node);
                        const style = theme[status];

                        return (
                            <div key={i} className="relative flex flex-col w-64 group z-10">
                                {/* Step Indicator */}
                                <div className="flex items-center mb-4 pl-4">
                                     <div className={`
                                        w-8 h-8 rounded-full border-4 border-white shadow-md flex items-center justify-center text-xs font-bold text-white
                                        ${style.accent} transition-transform duration-300 group-hover:scale-110
                                     `}>
                                        {i + 1}
                                     </div>
                                     {/* Line connecting dot to card is implicit via layout or we can add a small svg */}
                                </div>

                                {/* Card */}
                                <div className={`
                                    flex-1 p-5 rounded-xl border bg-white shadow-sm transition-all duration-300
                                    ${style.border} hover:shadow-lg hover:border-gray-300
                                `}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${style.badge}`}>
                                            {status}
                                        </span>
                                    </div>
                                    
                                    <h4 className="text-slate-800 font-bold text-sm mb-2 leading-snug group-hover:text-blue-600 transition-colors">
                                        {node.title}
                                    </h4>
                                    <p className="text-slate-500 text-xs leading-relaxed">
                                        {node.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
             </div>
        </div>
    );
}