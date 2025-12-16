import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ROOMS, STAFF, 
  SPAWN_POINT, WAITING_POINT, HEPA_POINT,
  PATIENT_SPEED, SPAWN_RATE_TICKS, WAITING_TIME_TICKS, TREATMENT_TIME_TICKS
} from '../../constants/isoclinic';
import { RoomType, RoomDef, Patient } from '../../types/isoclinic';
import { gridToScreen, getRandomColor } from '../../utils/isometric';
import { IsoCharacter, IsoRoundedZone } from './IsoComponents';

// Use public folder URLs for SVGs with namespace tags
const restSvg = '/rest.svg';
const doorSvg = '/door.svg';

const GAME_MINUTES_PER_TICK = 0.05;
const START_HOUR = 9;
const END_HOUR = 18;
const TOTAL_GAME_MINUTES = (END_HOUR - START_HOUR) * 60;

// Waypoints to avoid ALL rooms:
// - nurse3: x: 74-87, y: 10-21
// - nurse2: x: 76-89, y: 22-34  
// - nurse1: x: 77-89, y: 33.5-45.5
// - hepatologist: x: 77-110, y: 23-35
const CORRIDOR_NORTH = { x: 72, y: 10 };   // Go north (above nurse3)
const CORRIDOR_SOUTH = { x: 72, y: 45 };  // Go south (below nurse1)
const MONITORING_ENTRY_NORTH = { x: 120, y: 12 };  // Enter monitoring from north
const MONITORING_ENTRY_SOUTH = { x: 120, y: 50 }; // Enter monitoring from south

const IsometricMap: React.FC = () => {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState({ x: -100, y: -280, zoom: 0.25 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  const [simActive, setSimActive] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [gameTime, setGameTime] = useState(0);
  const [stats, setStats] = useState({
    waiting: 0, treated: 0, hepaCases: 0, totalSpawned: 0, time: 0,
    cumReferred: 0, cumPreConsult: 0, cumTelePre: 0, cumNurse: 0, cumMonitoring: 0
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const tickRef = useRef(0);
  const patientsRef = useRef<Patient[]>([]);

  useEffect(() => {
    let frameId: number;

    const spawnPatient = () => {
      const id = `p-${Date.now()}-${Math.random()}`;
      const rand = Math.random();
      let originType = 'pre';
      if (rand < 0.2) originType = 'referred';
      else if (rand < 0.6) originType = 'pre';
      else originType = 'tele';

      const newPatient: Patient = {
        id,
        type: 'patient',
        gridX: SPAWN_POINT.x,
        gridY: SPAWN_POINT.y,
        path: [WAITING_POINT],
        state: 'entering',
        waitTimer: 0,
        color: getRandomColor(),
        facing: 'right'
      };
      patientsRef.current.push(newPatient);
      
      setStats(s => ({ 
        ...s, 
        totalSpawned: s.totalSpawned + 1,
        cumReferred: originType === 'referred' ? s.cumReferred + 1 : s.cumReferred,
        cumPreConsult: originType === 'pre' ? s.cumPreConsult + 1 : s.cumPreConsult,
        cumTelePre: originType === 'tele' ? s.cumTelePre + 1 : s.cumTelePre,
      }));
    };

    const updatePatient = (p: Patient): boolean => {
      if (p.path.length > 0) {
        const target = p.path[0];
        const dx = target.x - p.gridX;
        const dy = target.y - p.gridY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > PATIENT_SPEED) {
          p.gridX += (dx / dist) * PATIENT_SPEED;
          p.gridY += (dy / dist) * PATIENT_SPEED;
          p.facing = dx > 0 ? 'right' : 'left';
        } else {
          p.gridX = target.x;
          p.gridY = target.y;
          p.path.shift();
        }
      } else {
        switch (p.state) {
          case 'entering':
            p.state = 'waiting';
            p.waitTimer = WAITING_TIME_TICKS;
            break;
          case 'to_nurse':
            p.state = 'at_nurse';
            p.waitTimer = TREATMENT_TIME_TICKS;
            setStats(s => ({ ...s, cumNurse: s.cumNurse + 1 }));
            break;
          case 'to_doc':
            p.state = 'at_doc';
            p.waitTimer = TREATMENT_TIME_TICKS;
            break;
          case 'to_monitoring':
            p.state = 'at_monitoring';
            p.waitTimer = TREATMENT_TIME_TICKS;
            setStats(s => ({ ...s, cumMonitoring: s.cumMonitoring + 1 }));
            break;
          case 'exiting':
            return true;
        }
      }

      if (p.waitTimer > 0) {
        p.waitTimer--;
        if (p.waitTimer <= 0) {
          if (p.state === 'waiting') {
            // Find available expert nurse room (only one patient per room)
            const nurses = ROOMS.filter(r => r.type === RoomType.NURSE && r.id.startsWith('nurse'));
            nurses.sort((a, b) => a.id.localeCompare(b.id));
            
            // Check which rooms are occupied
            const occupiedRooms = new Set(
              patientsRef.current
                .filter(pt => (pt.state === 'at_nurse' || pt.state === 'to_nurse') && pt.assignedStaffId)
                .map(pt => pt.assignedStaffId)
            );
            
            // Find first available room
            const availableNurse = nurses.find(n => !occupiedRooms.has(n.id));
            
            if (availableNurse) {
              p.state = 'to_nurse';
              p.assignedStaffId = availableNurse.id;
              p.path = [{ x: availableNurse.gridX + 2 + Math.random() * 2, y: availableNurse.gridY + 2 + Math.random() * 2 }];
            } else {
              // No room available, keep waiting
              p.waitTimer = 30; // Check again in 30 ticks
            }
          } else if (p.state === 'at_nurse') {
            const isHepaCase = Math.random() < (1/9);
            if (isHepaCase) {
              // Check if hepatologist room is available (only one patient at a time)
              const hepaOccupied = patientsRef.current.some(pt => 
                (pt.state === 'at_doc' || pt.state === 'to_doc') && pt.id !== p.id
              );
              
              if (!hepaOccupied) {
                p.state = 'to_doc';
                p.path = [{ x: HEPA_POINT.x + Math.random(), y: HEPA_POINT.y + Math.random() }];
                setStats(s => ({ ...s, hepaCases: s.hepaCases + 1 }));
              } else {
                // Hepatologist busy, wait a bit longer
                p.waitTimer = 30;
              }
            } else {
              p.state = 'to_monitoring';
              const monRoom = ROOMS.find(r => r.id === 'monitoring');
              const monitoringCount = patientsRef.current.filter(pt => pt.state === 'at_monitoring' || pt.state === 'to_monitoring').length;
              const cols = 12;
              const row = Math.floor(monitoringCount / cols);
              const col = monitoringCount % cols;
              const monTarget = monRoom 
                ? { x: monRoom.gridX + 15 + col * 2, y: monRoom.gridY + 12 + row * 2 }
                : { x: 109 + col * 2, y: 24 + row * 2 };
              // Route around ALL rooms - nurse3 uses north, nurse1/nurse2 use south
              const useNorthPath = p.assignedStaffId === 'nurse3';
              if (useNorthPath) {
                p.path = [CORRIDOR_NORTH, MONITORING_ENTRY_NORTH, monTarget];
              } else {
                p.path = [CORRIDOR_SOUTH, MONITORING_ENTRY_SOUTH, monTarget];
              }
              setStats(s => ({ ...s, treated: s.treated + 1 }));
            }
          } else if (p.state === 'at_doc') {
            p.state = 'to_monitoring';
            const monRoom = ROOMS.find(r => r.id === 'monitoring');
            const monitoringCount = patientsRef.current.filter(pt => pt.state === 'at_monitoring' || pt.state === 'to_monitoring').length;
            const cols = 12;
            const row = Math.floor(monitoringCount / cols);
            const col = monitoringCount % cols;
            const monTarget = monRoom 
              ? { x: monRoom.gridX + 15 + col * 2, y: monRoom.gridY + 12 + row * 2 }
              : { x: 109 + col * 2, y: 24 + row * 2 };
            // From hepatologist, go directly to monitoring (already adjacent)
            p.path = [monTarget];
          }
        }
      }
      return true;
    };

    const loop = () => {
      if (simActive) {
        tickRef.current++;
        
        setGameTime(prev => {
          const next = prev + GAME_MINUTES_PER_TICK;
          if (next >= TOTAL_GAME_MINUTES) {
            setSimActive(false);
            const monitoringPatients = patientsRef.current.filter(p => p.state === 'at_monitoring');
            patientsRef.current = monitoringPatients;
            setPatients([...monitoringPatients]);
            return TOTAL_GAME_MINUTES;
          }
          return next;
        });

        setStats(s => ({ ...s, time: tickRef.current }));

        if (tickRef.current % SPAWN_RATE_TICKS === 0 && gameTime < TOTAL_GAME_MINUTES) {
          spawnPatient();
        }

        patientsRef.current = patientsRef.current.filter(updatePatient);
        setPatients([...patientsRef.current]);
        
        const waitingCount = patientsRef.current.filter(p => p.state === 'waiting').length;
        setStats(s => ({ ...s, waiting: waitingCount }));
      }
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [simActive, gameTime]);

  const handleStartSim = () => {
    if (gameTime >= TOTAL_GAME_MINUTES) {
      setGameTime(0);
      setStats({ waiting: 0, treated: 0, hepaCases: 0, totalSpawned: 0, time: 0, cumReferred: 0, cumPreConsult: 0, cumTelePre: 0, cumNurse: 0, cumMonitoring: 0 });
      patientsRef.current = [];
      setPatients([]);
      tickRef.current = 0;
    }
    setSimActive(true);
  };
  
  const handleStopSim = () => setSimActive(false);

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSensitivity = 0.001;
    const newZoom = Math.max(0.1, Math.min(2.0, viewState.zoom - e.deltaY * zoomSensitivity));
    setViewState(prev => ({ ...prev, zoom: newZoom }));
  };

  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start dragging if clicking on a clickable element
    const target = e.target as HTMLElement;
    if (target.closest('.clickable-room')) {
      return;
    }
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => { isDragging.current = false; };

  const handleRoomClick = (room: RoomDef) => {
    console.log('Room clicked:', room.id, room.type, room.name);
    if (room.id === 'pre_consult') {
      console.log('Navigating to /pre-consultation');
      navigate('/pre-consultation');
    } else if (room.type === RoomType.HEPATOLOGIST) {
      console.log('Navigating to /board');
      navigate('/board');
    } else if (room.type === RoomType.NURSE && room.id.startsWith('nurse')) {
      // Only navigate for expert nurse rooms (nurse1, nurse2, nurse3), not tele nurse
      if (room.id === 'nurse1') {
        // Expert Nurse 1 goes to static version
        console.log('Navigating to /nurse-sim-1');
        navigate('/nurse-sim-1');
      } else {
        console.log('Navigating to /nurse-sim with room:', room.id);
        navigate('/nurse-sim', { state: { triageRoom: room.id } });
      }
    }
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(START_HOUR + minutes / 60);
    const m = Math.floor(minutes % 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const progressPercent = (gameTime / TOTAL_GAME_MINUTES) * 100;
  const treatedCount = stats.cumMonitoring; // Patients who completed full treatment (arrived at monitoring)
  const throughputPerHour = gameTime > 0 ? (treatedCount / (gameTime / 60)) : 0;
  const STANDARD_THROUGHPUT = 2.5;
  const productivityGain = throughputPerHour > 0 ? (throughputPerHour / STANDARD_THROUGHPUT).toFixed(1) : "0.0";
  const totalSpawned = stats.totalSpawned;
  const arrivalRate = gameTime > 0 ? (totalSpawned / (gameTime / 60)).toFixed(1) : "0.0";

  const listCounts = {
    referred: stats.cumReferred,
    preConsult: stats.cumPreConsult,
    telePre: stats.cumTelePre,
    waiting: stats.waiting,
    nurse: stats.cumNurse,
    hepato: stats.hepaCases,
    monitoring: stats.cumMonitoring
  };

  // Zone where characters should render behind the door/wall
  // Expanded to cover the entire path from pre-tele to waiting room
  const DOOR_ZONE = { minX: 30, maxX: 55, minY: 10, maxY: 25 };
  const isInDoorZone = (gridX: number, gridY: number) => {
    return gridX >= DOOR_ZONE.minX && gridX <= DOOR_ZONE.maxX && gridY >= DOOR_ZONE.minY && gridY <= DOOR_ZONE.maxY;
  };

  const renderList = useMemo(() => {
    const clickableAreas: React.ReactNode[] = [];
    const charactersBehindDoor: { y: number; node: React.ReactNode }[] = [];
    const charactersInFront: { y: number; node: React.ReactNode }[] = [];

    ROOMS.forEach((room) => {
      const centerX = room.gridX + room.width / 2;
      const centerY = room.gridY + room.height / 2;
      const center = gridToScreen(centerX, centerY);
      const screenWidth = room.width * 32;
      const screenHeight = room.height * 32;

      const isClickableRoom = room.id === 'pre_consult' || room.type === RoomType.HEPATOLOGIST || (room.type === RoomType.NURSE && room.id.startsWith('nurse'));
      const showHighlight = room.type === RoomType.HEPATOLOGIST || (room.type === RoomType.NURSE && room.id.startsWith('nurse'));
      
      clickableAreas.push(
        <g 
          key={`zone-${room.id}`} 
          onClick={(e) => {
            e.stopPropagation();
            handleRoomClick(room);
          }} 
          className={isClickableRoom ? "cursor-pointer clickable-room" : ""} 
          style={{ pointerEvents: 'all' }}
        >
          <IsoRoundedZone 
            x={center.x} 
            y={center.y} 
            width={screenWidth} 
            height={screenHeight} 
            color={room.floorColor || '#888'} 
            opacity={showHighlight ? 0.15 : 0.01} 
            borderRadius={25} 
          />
        </g>
      );
    });

    STAFF.forEach(staff => {
      const room = ROOMS.find(r => r.id === staff.roomId);
      if (room) {
        const gridX = room.gridX + staff.gridX;
        const gridY = room.gridY + staff.gridY;
        const center = gridToScreen(gridX, gridY);
        const charNode = { y: center.y, node: <IsoCharacter key={`staff-${staff.id}`} x={center.x} y={center.y} role={staff.type} facing={staff.facing} isSeated={staff.isSeated} /> };
        if (isInDoorZone(gridX, gridY)) charactersBehindDoor.push(charNode);
        else charactersInFront.push(charNode);
      }
    });

    patients.forEach(p => {
      const pos = gridToScreen(p.gridX, p.gridY);
      const charNode = { y: pos.y, node: <IsoCharacter key={p.id} x={pos.x} y={pos.y} role="patient" facing={p.facing} /> };
      if (isInDoorZone(p.gridX, p.gridY)) charactersBehindDoor.push(charNode);
      else charactersInFront.push(charNode);
    });

    charactersBehindDoor.sort((a, b) => a.y - b.y);
    charactersInFront.sort((a, b) => a.y - b.y);

    return { clickableAreas, charactersBehindDoor, charactersInFront };
  }, [patients]);

  return (
    <div className="w-full h-screen bg-slate-50 overflow-hidden relative select-none"
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}>
      
      {/* Title and Time Progress */}
      <div className={`absolute top-4 lg:top-8 z-20 transition-all duration-300 flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-8 ${isSidebarOpen ? 'left-72 lg:left-80 ml-4 lg:ml-8' : 'left-4 lg:left-8'}`}>
        <div>
          <h1 className="text-2xl lg:text-4xl font-extrabold text-slate-800 tracking-tight drop-shadow-sm">Medforce<span className="font-light text-slate-400">AI</span></h1>
          <p className="text-slate-500 font-semibold text-[10px] lg:text-sm tracking-widest uppercase mt-0.5 lg:mt-1">Hepatology Center</p>
        </div>
        <div className="flex flex-col gap-1.5 min-w-[180px] lg:min-w-[220px]">
          <div className="flex justify-between items-center">
            <span className="text-[9px] lg:text-[10px] text-slate-400 uppercase tracking-wide">Clinic Hours</span>
            <span className="text-xs lg:text-sm font-mono text-slate-600">{formatTime(gameTime)}</span>
          </div>
          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-linear" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex justify-between text-[8px] lg:text-[9px] text-slate-400">
            <span>09:00</span>
            <span>18:00</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`absolute top-0 left-0 z-30 h-full bg-white border-r border-slate-200 shadow-2xl transition-all duration-300 ease-in-out transform flex flex-col ${isSidebarOpen ? 'translate-x-0 w-64 lg:w-72 xl:w-80' : '-translate-x-full w-64 lg:w-72 xl:w-80'}`}>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-1/2 -right-6 lg:-right-8 w-6 lg:w-8 h-12 lg:h-16 bg-white border border-l-0 border-slate-200 rounded-r-xl flex items-center justify-center shadow-md hover:bg-slate-50 focus:outline-none z-50 transform -translate-y-1/2">
          <svg className={`w-3 h-3 lg:w-4 lg:h-4 text-slate-600 transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="p-3 lg:p-4 xl:p-6 flex flex-col h-full overflow-y-auto">
          <div className="space-y-4 lg:space-y-6 xl:space-y-8 flex-1 mt-2 lg:mt-4">
            {/* Benchmark Comparison */}
           

            <div className="space-y-2 lg:space-y-3">
              <h2 className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest">Metrics</h2>
              {[
                { label: 'Total patients treated', value: treatedCount, color: 'text-slate-900' },
                { label: 'Doctor : Patient ratio', value: `1 : ${totalSpawned}`, color: 'text-slate-900' },
                { label: 'Expert Nurse : Patient', value: `3 : ${totalSpawned}`, color: 'text-slate-900' },
                { label: 'Arrival Rate', value: `${arrivalRate}/h`, color: 'text-slate-900' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-1.5 lg:pb-2">
                  <span className="text-slate-600 font-medium text-[10px] lg:text-xs">{item.label}</span>
                  <span className={`font-bold text-xs lg:text-sm ${item.color} text-right min-w-[60px]`}>{item.value}</span>
                </div>
              ))}
            </div>

             <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 lg:p-4 border border-slate-200">
              <h3 className="text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 lg:mb-3">Throughput Benchmark</h3>
              <div className="space-y-2 lg:space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] lg:text-xs font-semibold text-indigo-700">Medforce Clinic</span>
                    <span className="text-[10px] lg:text-xs font-bold text-indigo-700">{throughputPerHour.toFixed(1)}/h</span>
                  </div>
                  <div className="w-full h-2 lg:h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (throughputPerHour / 10) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] lg:text-xs font-medium text-slate-500">Standard Hepatology Clinic</span>
                    <span className="text-[10px] lg:text-xs font-bold text-slate-500">{STANDARD_THROUGHPUT}/h</span>
                  </div>
                  <div className="w-full h-2 lg:h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full" style={{ width: `${(STANDARD_THROUGHPUT / 10) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="mt-2 lg:mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[9px] lg:text-[18px] text-slate-500">Productivity </span>
                <span className={`text-xs lg:text-sm font-bold ${parseFloat(productivityGain) >= 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {parseFloat(productivityGain) >= 1 ? '↑' : '↓'} {productivityGain}X
                </span>
              </div>
            </div>


            <div>
              <h3 className="text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase mb-2 lg:mb-3">Real-time Patient Status</h3>
              <div className="space-y-0.5">
                {[
                  { label: 'Referred', count: listCounts.referred, color: 'text-slate-800' },
                  { label: 'Pre Consultation', count: listCounts.preConsult, color: 'text-slate-600' },
                  { label: 'Tele-pre Consultation', count: listCounts.telePre, color: 'text-slate-600' },
                  { label: 'Waiting Room', count: listCounts.waiting, color: 'text-amber-600' },
                  { label: 'Expert Nurse Consult', count: listCounts.nurse, color: 'text-blue-600' },
                  { label: 'Hepatologist Consult', count: listCounts.hepato, color: 'text-indigo-600' },
                  { label: 'Monitoring', count: listCounts.monitoring, color: 'text-rose-600' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 lg:py-1.5 px-2 bg-white hover:bg-slate-50 rounded border border-slate-100 transition-colors">
                    <span className="text-[10px] lg:text-xs font-medium text-slate-600">{item.label}</span>
                    <span className={`font-bold text-xs lg:text-sm ${item.color} text-right min-w-[40px]`}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-3 lg:pt-4 border-t border-slate-100">
            <button onClick={simActive ? handleStopSim : handleStartSim}
              className={`w-full py-2 lg:py-2.5 rounded-lg font-bold text-[10px] lg:text-xs transition-all transform active:scale-95 duration-200 border shadow-sm flex items-center justify-center gap-1.5 lg:gap-2 ${simActive ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-slate-900 text-white border-transparent hover:bg-slate-800'}`}>
              {simActive ? (
                <><span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-amber-500 animate-pulse"></span>Pause Simulation</>
              ) : (
                <><svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Start Simulation</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <svg width="100%" height="100%" className="block">
        <g transform={`translate(${window.innerWidth / 2 + viewState.x - 100}, ${window.innerHeight / 2 + viewState.y}) scale(${viewState.zoom})`}>
          <image href={restSvg} x={-825} y={-300} width={4626} height={3324} preserveAspectRatio="xMidYMid meet" />
          {renderList.charactersBehindDoor.map(o => o.node)}
          <image href={doorSvg} x={165} y={600} width={1557} height={1869} preserveAspectRatio="xMidYMid meet" />
          {renderList.charactersInFront.map(o => o.node)}
          {renderList.clickableAreas}
        </g>
      </svg>

      {/* Zoom Controls */}
      <div className="absolute bottom-8 right-8 z-20 flex flex-col gap-2">
        <button onClick={() => setViewState(prev => ({ ...prev, zoom: Math.min(2.0, prev.zoom + 0.1) }))}
          className="w-10 h-10 bg-white border border-slate-200 rounded-lg shadow-md flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" /></svg>
        </button>
        <button onClick={() => setViewState(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom - 0.1) }))}
          className="w-10 h-10 bg-white border border-slate-200 rounded-lg shadow-md flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12" /></svg>
        </button>
      </div>
    </div>
  );
};

export default IsometricMap;
