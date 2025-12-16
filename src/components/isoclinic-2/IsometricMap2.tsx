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
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import ClinicPanelLeft from './ClinicPanelLeft';
import ClinicPanelRight from './ClinicPanelRight';

const GAME_MINUTES_PER_TICK = 0.1; // ~90 seconds real time for full 9-hour day
const START_HOUR = 9;
const END_HOUR = 18;
const TOTAL_GAME_MINUTES = (END_HOUR - START_HOUR) * 60;

// Cost calculation constants
const WORK_HOURS_PER_YEAR = 2080;
const ANNUAL_NURSE_SALARY = 60000;
const ANNUAL_DOCTOR_SALARY = 200000;
const NURSE_HOURLY = ANNUAL_NURSE_SALARY / WORK_HOURS_PER_YEAR; // ~$28.85/hour
const DOCTOR_HOURLY = ANNUAL_DOCTOR_SALARY / WORK_HOURS_PER_YEAR; // ~$96.15/hour

// Staff counts
const AI_CLINIC_NURSES = 3;
const AI_CLINIC_DOCTORS = 1;
const STD_CLINIC_NURSES = 1;
const STD_CLINIC_DOCTORS = 2;

const IsometricMap2: React.FC = () => {
  const [simActive, setSimActive] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [statsLeft, setStatsLeft] = useState({ 
    waiting: 0, cumMonitoring: 0, cumNurse: 0, hepaCases: 0,
    totalIn: 0, totalOut: 0, kioskHandled: 0, triageHandled: 0, doctorHandled: 0, doctorBusyTime: 0
  });
  const [statsRight, setStatsRight] = useState({ 
    waiting: 0, cumMonitoring: 0, cumNurse: 0, hepaCases: 0,
    totalIn: 0, totalOut: 0, receptionHandled: 0, doctorHandled: 0, doctorBusyTime: 0
  });
  const [treatedHistory, setTreatedHistory] = useState<{ time: number; aiTreated: number; stdTreated: number }[]>([]);
  const frameRef = useRef<number>();
  const lastRecordedTime = useRef<number>(-1);

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
      setTreatedHistory([]);
      lastRecordedTime.current = -1;
    }
    setSimActive(true);
  };

  // Record treated patients history every 30 game minutes
  useEffect(() => {
    const interval = Math.floor(gameTime / 30);
    if (interval > lastRecordedTime.current && simActive) {
      lastRecordedTime.current = interval;
      setTreatedHistory(prev => [...prev, { time: gameTime, aiTreated: statsLeft.cumMonitoring, stdTreated: statsRight.cumMonitoring }]);
    }
  }, [gameTime, simActive, statsLeft.cumMonitoring, statsRight.cumMonitoring]);
  
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
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <span className="text-xs font-mono text-slate-600">{formatTime(gameTime)}</span>
      </div>

      {/* 4 Quadrants */}
      <div className="flex-1 grid grid-cols-2" style={{ gridTemplateRows: '30% 70%' }}>
        {/* Cell 0,0 - Top Left: AI Clinic Stats */}
        <div className="border-r border-b border-slate-300 bg-indigo-50 p-3 flex flex-col overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest">MedforceAI Clinic</h2>
              <button 
                onClick={() => setShowMetricsModal(true)}
                className="px-2 py-1 bg-indigo-600 text-white text-[10px] rounded font-bold hover:bg-indigo-700 transition-colors"
              >
                 Detailed Metrics
              </button>
            </div>
            {/* Productivity Lift - Distinctive Display */}
            <div className="text-black rounded-lg px-2 py-2 flex items-center gap-2">
              <span className="text-xs font-semibold">Productivity Lift</span>
              <span className="text-2xl font-black">
                {statsRight.cumMonitoring > 0 ? (statsLeft.cumMonitoring / statsRight.cumMonitoring).toFixed(1) : ''}x
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-1">
            {/* Stats */}
            <div className="flex flex-col gap-2 text-xs w-1/2">
              <div className="bg-white rounded p-2">
                <div className="font-bold text-indigo-600 mb-1">Patient Flow</div>
                <div className="flex justify-between"><span>Total In:</span><span className="font-bold">{statsLeft.totalIn}</span></div>
                <div className="flex justify-between"><span>Total Out:</span><span className="font-bold">{statsLeft.totalOut}</span></div>
                <div className="flex justify-between"><span>Waiting:</span><span className="font-bold text-amber-600">{statsLeft.waiting}</span></div>
                <div className="flex justify-between"><span>Patients Seen:</span><span className="font-bold text-emerald-600">{statsLeft.cumMonitoring}</span></div>
              </div>
              <div className="bg-white rounded p-2">
                <div className="font-bold text-indigo-600 mb-1">AI Resources</div>
                <div className="flex justify-between"><span>AI Pre-Consult:</span><span className="font-bold">{statsLeft.kioskHandled}</span></div>
                <div className="flex justify-between"><span>Triage Nurses:</span><span className="font-bold">{statsLeft.triageHandled}</span></div>
                <div className="flex justify-between"><span>Hepatologist Consult:</span><span className="font-bold">{statsLeft.doctorHandled}</span></div>
              </div>
            </div>
            {/* Patients Treated Graph */}
            <div className="bg-white rounded p-2 flex-1 flex flex-col">
              <div className="font-bold text-indigo-600 mb-1 text-xs">Patients Treated Over Time</div>
              <div style={{ width: '100%', height: 130 }}>
                {treatedHistory.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={treatedHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 9 }} 
                        tickFormatter={(val) => `${Math.floor(START_HOUR + val / 60)}:${String(Math.floor(val % 60)).padStart(2, '0')}`}
                        stroke="#94a3b8"
                      />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" width={30} />
                      <Tooltip 
                        contentStyle={{ fontSize: 10, padding: '4px 8px' }}
                        labelFormatter={(val) => `Time: ${Math.floor(START_HOUR + Number(val) / 60)}:${String(Math.floor(Number(val) % 60)).padStart(2, '0')}`}
                      />
                      <Line type="linear" dataKey="aiTreated" stroke="#4f46e5" strokeWidth={2} dot={{ r: 1, fill: '#4f46e5' }} isAnimationActive={false} name="AI Clinic" />
                      <Line type="linear" dataKey="stdTreated" stroke="#84cc16" strokeWidth={2} dot={{ r: 1, fill: '#84cc16' }} isAnimationActive={false} name="Standard" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Graph will appear during simulation
                  </div>
                )}
              </div>
              <div className="flex gap-3 text-[10px] mt-1">
                <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-indigo-600"></span>AI Clinic</div>
                <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-lime-500"></span>Standard</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cell 0,1 - Top Right: Standard Clinic Stats */}
        <div className="border-b border-slate-300 bg-slate-50 p-3 flex flex-col overflow-auto">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Standard Hepatology Clinic</h2>
          <div className="flex gap-2 flex-1">
            {/* Stats */}
            <div className="flex flex-col gap-2 text-xs w-1/2">
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
            {/* Patients Treated Graph */}
            
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

      {/* Metrics Modal */}
      {showMetricsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMetricsModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">📊 Detailed Cost & Productivity Metrics</h2>
                <button onClick={() => setShowMetricsModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
              </div>

              {/* Cost Analysis Section */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 border-b pb-2"> Cost Analysis (9-hour shift)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* AI Clinic Costs */}
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h4 className="font-bold text-indigo-700 mb-2">AI Clinic Staffing</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span>Nurses ({AI_CLINIC_NURSES}):</span><span className="font-mono">${(AI_CLINIC_NURSES * NURSE_HOURLY * 9).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Doctors ({AI_CLINIC_DOCTORS}):</span><span className="font-mono">${(AI_CLINIC_DOCTORS * DOCTOR_HOURLY * 9).toFixed(2)}</span></div>
                      <div className="flex justify-between border-t pt-1 font-bold"><span>Total:</span><span className="font-mono text-indigo-700">${((AI_CLINIC_NURSES * NURSE_HOURLY + AI_CLINIC_DOCTORS * DOCTOR_HOURLY) * 9).toFixed(2)}</span></div>
                    </div>
                  </div>
                  {/* Standard Clinic Costs */}
                  <div className="bg-slate-100 rounded-lg p-4">
                    <h4 className="font-bold text-slate-700 mb-2">Standard Clinic Staffing</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span>Nurses ({STD_CLINIC_NURSES}):</span><span className="font-mono">${(STD_CLINIC_NURSES * NURSE_HOURLY * 9).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Doctors ({STD_CLINIC_DOCTORS}):</span><span className="font-mono">${(STD_CLINIC_DOCTORS * DOCTOR_HOURLY * 9).toFixed(2)}</span></div>
                      <div className="flex justify-between border-t pt-1 font-bold"><span>Total:</span><span className="font-mono text-slate-700">${((STD_CLINIC_NURSES * NURSE_HOURLY + STD_CLINIC_DOCTORS * DOCTOR_HOURLY) * 9).toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Productivity Metrics */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 border-b pb-2"> Productivity Metrics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-black text-emerald-600">
                      {statsRight.cumMonitoring > 0 ? (statsLeft.cumMonitoring / statsRight.cumMonitoring).toFixed(1) : '-'}x
                    </div>
                    <div className="text-xs text-emerald-700 font-semibold">Patient Throughput Lift</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-black text-blue-600">
                      {statsRight.doctorHandled > 0 ? (statsLeft.doctorHandled / statsRight.doctorHandled).toFixed(1) : '-'}x
                    </div>
                    <div className="text-xs text-blue-700 font-semibold">Doctor Efficiency Lift</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-black text-purple-600">
                      {statsRight.receptionHandled > 0 ? (statsLeft.triageHandled / statsRight.receptionHandled).toFixed(1) : '-'}x
                    </div>
                    <div className="text-xs text-purple-700 font-semibold">Intake Capacity Lift</div>
                  </div>
                </div>
              </div>

              {/* KPI Comparison */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 border-b pb-2"> KPI Comparison</h3>
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-2">Metric</th>
                      <th className="text-right p-2">AI Clinic</th>
                      <th className="text-right p-2">Standard</th>
                      <th className="text-right p-2">Difference</th>
                      <th className="text-right p-2">% Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">Patients Treated</td>
                      <td className="text-right p-2 font-mono text-indigo-600">{statsLeft.cumMonitoring}</td>
                      <td className="text-right p-2 font-mono">{statsRight.cumMonitoring}</td>
                      <td className="text-right p-2 font-mono text-emerald-600">+{statsLeft.cumMonitoring - statsRight.cumMonitoring}</td>
                      <td className="text-right p-2 font-mono text-emerald-600">{statsRight.cumMonitoring > 0 ? `+${(((statsLeft.cumMonitoring - statsRight.cumMonitoring) / statsRight.cumMonitoring) * 100).toFixed(0)}%` : '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Doctor Consultations</td>
                      <td className="text-right p-2 font-mono text-indigo-600">{statsLeft.doctorHandled}</td>
                      <td className="text-right p-2 font-mono">{statsRight.doctorHandled}</td>
                      <td className="text-right p-2 font-mono">{statsLeft.doctorHandled - statsRight.doctorHandled}</td>
                      <td className="text-right p-2 font-mono">{statsRight.doctorHandled > 0 ? `${(((statsLeft.doctorHandled - statsRight.doctorHandled) / statsRight.doctorHandled) * 100).toFixed(0)}%` : '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Patients Waiting</td>
                      <td className="text-right p-2 font-mono text-indigo-600">{statsLeft.waiting}</td>
                      <td className="text-right p-2 font-mono">{statsRight.waiting}</td>
                      <td className={`text-right p-2 font-mono ${statsLeft.waiting < statsRight.waiting ? 'text-emerald-600' : 'text-red-600'}`}>{statsLeft.waiting - statsRight.waiting}</td>
                      <td className={`text-right p-2 font-mono ${statsLeft.waiting < statsRight.waiting ? 'text-emerald-600' : 'text-red-600'}`}>{statsRight.waiting > 0 ? `${(((statsLeft.waiting - statsRight.waiting) / statsRight.waiting) * 100).toFixed(0)}%` : '-'}</td>
                    </tr>
                    <tr>
                      <td className="p-2">Cost per Patient</td>
                      <td className="text-right p-2 font-mono text-indigo-600">${statsLeft.cumMonitoring > 0 ? (((AI_CLINIC_NURSES * NURSE_HOURLY + AI_CLINIC_DOCTORS * DOCTOR_HOURLY) * 9) / statsLeft.cumMonitoring).toFixed(2) : '-'}</td>
                      <td className="text-right p-2 font-mono">${statsRight.cumMonitoring > 0 ? (((STD_CLINIC_NURSES * NURSE_HOURLY + STD_CLINIC_DOCTORS * DOCTOR_HOURLY) * 9) / statsRight.cumMonitoring).toFixed(2) : '-'}</td>
                      <td className="text-right p-2 font-mono text-emerald-600">
                        {statsLeft.cumMonitoring > 0 && statsRight.cumMonitoring > 0 ? 
                          `$${((((STD_CLINIC_NURSES * NURSE_HOURLY + STD_CLINIC_DOCTORS * DOCTOR_HOURLY) * 9) / statsRight.cumMonitoring) - (((AI_CLINIC_NURSES * NURSE_HOURLY + AI_CLINIC_DOCTORS * DOCTOR_HOURLY) * 9) / statsLeft.cumMonitoring)).toFixed(2)} saved` : '-'}
                      </td>
                      <td className="text-right p-2 font-mono text-emerald-600">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default IsometricMap2;