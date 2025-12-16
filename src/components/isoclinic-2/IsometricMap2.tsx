/**
 * ISOMETRIC MAP 2 - DUAL CLINIC VIEW
 * 
 * This component displays two clinic panels side by side:
 * - Left panel: Edit ClinicPanelLeft.tsx
 * - Right panel: Edit ClinicPanelRight.tsx
 * 
 * Each panel has its own:
 * - SVG configuration
 * - Room positions
 * - Staff positions
 * - Waypoints
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import ClinicPanelLeft from './ClinicPanelLeft';
import ClinicPanelRight from './ClinicPanelRight';

const GAME_MINUTES_PER_TICK = 0.1; // ~90 seconds real time for full 9-hour day
const START_HOUR = 9;
const END_HOUR = 18;
const TOTAL_GAME_MINUTES = (END_HOUR - START_HOUR) * 60;

const IsometricMap2: React.FC = () => {
  const [simActive, setSimActive] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [statsLeft, setStatsLeft] = useState({ 
    waiting: 0, cumMonitoring: 0, cumNurse: 0, hepaCases: 0,
    totalIn: 0, totalOut: 0, kioskHandled: 0, triageHandled: 0, doctorHandled: 0, doctorBusyTime: 0
  });
  const [statsRight, setStatsRight] = useState({ 
    waiting: 0, cumMonitoring: 0, cumNurse: 0, hepaCases: 0,
    totalIn: 0, totalOut: 0, receptionHandled: 0, doctorHandled: 0, doctorBusyTime: 0
  });
  const frameRef = useRef<number>();

  useEffect(() => {
    const loop = () => {
      if (simActive) {
        setGameTime(prev => {
          const next = prev + GAME_MINUTES_PER_TICK;
          if (next >= TOTAL_GAME_MINUTES) {
            setSimActive(false);
            return TOTAL_GAME_MINUTES;
          }
          return next;
        });
      }
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [simActive]);

  const handleStartSim = () => {
    if (gameTime >= TOTAL_GAME_MINUTES) {
      setGameTime(0);
      setStatsLeft({ waiting: 0, cumMonitoring: 0, cumNurse: 0, hepaCases: 0, totalIn: 0, totalOut: 0, kioskHandled: 0, triageHandled: 0, doctorHandled: 0, doctorBusyTime: 0 });
      setStatsRight({ waiting: 0, cumMonitoring: 0, cumNurse: 0, hepaCases: 0, totalIn: 0, totalOut: 0, receptionHandled: 0, doctorHandled: 0, doctorBusyTime: 0 });
    }
    setSimActive(true);
  };
  
  const handleStopSim = () => setSimActive(false);

  const formatTime = (minutes: number) => {
    const h = Math.floor(START_HOUR + minutes / 60);
    const m = Math.floor(minutes % 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const progressPercent = (gameTime / TOTAL_GAME_MINUTES) * 100;

  const handleStatsUpdateLeft = useCallback((stats: any) => {
    setStatsLeft({ 
      waiting: stats.waiting, cumMonitoring: stats.cumMonitoring, cumNurse: stats.cumNurse, hepaCases: stats.hepaCases,
      totalIn: stats.totalIn, totalOut: stats.totalOut, kioskHandled: stats.kioskHandled, 
      triageHandled: stats.triageHandled, doctorHandled: stats.doctorHandled, doctorBusyTime: stats.doctorBusyTime
    });
  }, []);

  const handleStatsUpdateRight = useCallback((stats: any) => {
    setStatsRight({ 
      waiting: stats.waiting, cumMonitoring: stats.cumMonitoring, cumNurse: stats.cumNurse, hepaCases: stats.hepaCases,
      totalIn: stats.totalIn, totalOut: stats.totalOut, receptionHandled: stats.receptionHandled, 
      doctorHandled: stats.doctorHandled, doctorBusyTime: stats.doctorBusyTime
    });
  }, []);

  return (
    <div className="w-full h-screen bg-slate-100 overflow-hidden flex flex-col">
      {/* Header Row - Controls */}
      <div className="bg-white border-b border-slate-300 px-4 py-2 flex items-center gap-4">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Medforce<span className="font-light text-slate-400">AI</span></h1>
        <button onClick={simActive ? handleStopSim : handleStartSim}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all border shadow-sm flex items-center justify-center gap-2 ${simActive ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-900 text-white border-transparent'}`}>
          {simActive ? 'Pause' : 'Start'} Simulation
        </button>
        <div className="flex-1 mx-4">
          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <span className="text-xs font-mono text-slate-600">{formatTime(gameTime)}</span>
      </div>

      {/* 4 Quadrants */}
      <div className="flex-1 grid grid-cols-2" style={{ gridTemplateRows: '30% 70%' }}>
        {/* Cell 0,0 - Top Left: AI Clinic Stats */}
        <div className="border-r border-b border-slate-300 bg-indigo-50 p-3 flex flex-col overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest">AI Clinic</h2>
            {/* Productivity Lift - Distinctive Display */}
            <div className=" text-black rounded-lg px-2 py-2 flex items-center gap-2">
              <span className="text-xs font-semibold">Productivity Lift</span>
              <span className="text-2xl font-black">
                {statsRight.cumMonitoring > 0 ? (statsLeft.cumMonitoring / statsRight.cumMonitoring).toFixed(1) : ''}x
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white rounded p-2">
              <div className="font-bold text-indigo-600 mb-1">Patient Flow</div>
              <div className="flex justify-between"><span>Total In:</span><span className="font-bold">{statsLeft.totalIn}</span></div>
              <div className="flex justify-between"><span>Total Out:</span><span className="font-bold">{statsLeft.totalOut}</span></div>
              <div className="flex justify-between"><span>Waiting:</span><span className="font-bold text-amber-600">{statsLeft.waiting}</span></div>
              <div className="flex justify-between"><span>Patients Seen:</span><span className="font-bold text-emerald-600">{statsLeft.cumMonitoring}</span></div>
            </div>
            <br></br>
            <div className="bg-white rounded p-2">
              <div className="font-bold text-indigo-600 mb-1">AI Resources</div>
              <div className="flex justify-between"><span>AI Pre-Consult:</span><span className="font-bold">{statsLeft.kioskHandled}</span></div>
              <div className="flex justify-between"><span>Triage Nurses:</span><span className="font-bold">{statsLeft.triageHandled}</span></div>
              <div className="flex justify-between"><span>AI Doctor:</span><span className="font-bold">{statsLeft.doctorHandled}</span></div>
            </div>
          </div>
        </div>

        {/* Cell 0,1 - Top Right: Standard Clinic Stats */}
        <div className="border-b border-slate-300 bg-slate-50 p-3 flex flex-col overflow-auto">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Standard Clinic</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white rounded p-2">
              <div className="font-bold text-slate-500 mb-1">Patient Flow</div>
              <div className="flex justify-between"><span>Total In:</span><span className="font-bold">{statsRight.totalIn}</span></div>
              <div className="flex justify-between"><span>Total Out:</span><span className="font-bold">{statsRight.totalOut}</span></div>
              <div className="flex justify-between"><span>Waiting:</span><span className="font-bold text-amber-600">{statsRight.waiting}</span></div>
              <div className="flex justify-between"><span>Patients Seen:</span><span className="font-bold text-emerald-600">{statsRight.cumMonitoring}</span></div>
            </div>
            <div className="bg-white rounded p-2">
              <div className="font-bold text-slate-500 mb-1">Resources</div>
              <div className="flex justify-between"><span>Reception:</span><span className="font-bold">{statsRight.receptionHandled}</span></div>
              <div className="flex justify-between"><span>Doctor Consults:</span><span className="font-bold">{statsRight.doctorHandled}</span></div>
            </div>
          </div>
        </div>

        {/* Cell 1,0 - Bottom Left: AI Clinic Panel */}
        <div className="border-r border-slate-300">
          <ClinicPanelLeft simActive={simActive} gameTime={gameTime} onStatsUpdate={handleStatsUpdateLeft} />
        </div>

        {/* Cell 1,1 - Bottom Right: Standard Clinic Panel */}
        <div>
          <ClinicPanelRight simActive={simActive} gameTime={gameTime} onStatsUpdate={handleStatsUpdateRight} />
        </div>
      </div>
    </div>
  );
};

export default IsometricMap2;