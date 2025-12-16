/**
 * LEFT CLINIC PANEL
 * Edit this file to customize the left clinic view independently
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomType, RoomDef, Patient } from '../../types/isoclinic';
import { gridToScreen, getRandomColor } from '../../utils/isometric';
import { IsoCharacter, IsoRoundedZone } from './IsoComponents';

// ============================================
// SVG CONFIGURATION - LEFT CLINIC
// ============================================
const SVG_REST = {
  src: '/rest.svg',
  x: -825,
  y: -300,
  width: 4626,
  height: 3324,
};

const SVG_DOOR = {
  src: '/door.svg',
  x: 165,
  y: 600,
  width: 1557,
  height: 1869,
};

// Door zone - characters in this area render BEHIND the door SVG
const DOOR_ZONE = { minX: 30, maxX: 55, minY: 10, maxY: 25 };

// ============================================
// SIMULATION SETTINGS - AI CLINIC (HIGH EFFICIENCY)
// AI-assisted triage, multiple expert nurses, streamlined flow
// 4.6X faster processing than regular clinic
// ============================================
const PATIENT_SPEED = 0.2;            // Same speed as regular clinic
const SPAWN_RATE_TICKS = 200;         // Slower spawn rate for cleaner visuals
const BATCH_SIZE = 2;                 // Spawn 2 patients per batch
const WAITING_TIME_TICKS = 50;        // 4.6X faster than regular clinic
const NURSE_TIME_TICKS = 100;         // Time spent with nurse
const HEPATO_TIME_TICKS = 150;        // Time spent with hepatologist
const TOTAL_GAME_MINUTES = 540;       // 9 hours

// ============================================
// WAYPOINTS - LEFT CLINIC
// ============================================
const SPAWN_POINT = { x: 30, y: 19 };
const HEPA_POINT = { x: 93, y: 29 };
const CORRIDOR_NORTH = { x: 72, y: 10 };
const CORRIDOR_SOUTH = { x: 72, y: 45 };
const MONITORING_ENTRY_NORTH = { x: 120, y: 12 };
const MONITORING_ENTRY_SOUTH = { x: 120, y: 50 };

// 10 predefined seating positions in the waiting room
// Arranged in 2 rows of 5 seats each
const WAITING_SEATS = [
  { x: 70, y: 20 }, { x: 70, y: 21 }, { x: 70, y: 24 }, { x: 44, y: 21 }, { x: 48, y: 23 },
  { x: 70, y: 22 }, { x: 70, y: 23 }, { x: 72, y: 20 }, { x: 44, y: 22 }, { x: 48, y: 24 },
];


// ============================================
// ROOM COLORS
// ============================================
const COL_PRE_CONSULT = '#93c5fd';
const COL_WAITING = '#d8b4fe';
const COL_NURSE = '#67e8f9';
const COL_HEPA = '#fca5a5';
const COL_TELE_NURSE = '#cffafe';
const COL_MONITORING = '#fca5a5';

// ============================================
// ROOMS - LEFT CLINIC
// Modify gridX, gridY, width, height to reposition rooms
// ============================================
const ROOMS: RoomDef[] = [
  { id: 'pre_consult', name: 'Pre consultation', type: RoomType.ENTRANCE, gridX: -15.5, gridY: 4, width: 92, height: 30, color: '#fff', floorColor: COL_PRE_CONSULT, wallColor: '#fff' },
  { id: 'tele_pre', name: 'Tele Pre', type: RoomType.TELEMEDICINE, gridX: 16, gridY: -40, width: 23, height: 23, color: '#fff', floorColor: COL_PRE_CONSULT, wallColor: '#fff' },
  { id: 'waiting', name: 'Waiting room', type: RoomType.WAITING, gridX: 53, gridY: 20, width: 34, height: 10, color: '#fff', floorColor: COL_WAITING, wallColor: '#fff' },
  { id: 'nurse1', name: 'Expert Nurse', type: RoomType.NURSE, gridX: 77, gridY: 33.5, width: 12, height: 12, color: '#fff', floorColor: COL_NURSE, wallColor: '#fff' },
  { id: 'nurse2', name: 'Expert Nurse', type: RoomType.NURSE, gridX: 76, gridY: 22, width: 13, height: 12, color: '#fff', floorColor: COL_NURSE, wallColor: '#fff' },
  { id: 'nurse3', name: 'Expert Nurse', type: RoomType.NURSE, gridX: 74, gridY: 10, width: 13, height: 11, color: '#fff', floorColor: COL_NURSE, wallColor: '#fff' },
  { id: 'hepatologist', name: 'Hepatologist', type: RoomType.HEPATOLOGIST, gridX: 77, gridY: 23, width: 33, height: 12, color: '#fff', floorColor: COL_HEPA, wallColor: '#fff' },
  { id: 'expert_tele', name: 'Expert Tele Nurse', type: RoomType.NURSE, gridX: 57, gridY: -34, width: 24, height: 24, color: '#fff', floorColor: COL_TELE_NURSE, wallColor: '#fff' },
  { id: 'monitoring', name: 'Monitoring', type: RoomType.MONITORING, gridX: 94, gridY: 12, width: 58, height: 40, color: '#fff', floorColor: COL_MONITORING, wallColor: '#fff' },
];

// ============================================
// STAFF - LEFT CLINIC
// Positions are relative to their room
// ============================================
const STAFF = [
  { id: 'tele_doc', type: 'doctor' as const, roomId: 'tele_pre', gridX: 11.5, gridY: 11.5, facing: 'right' as const, name: 'Tele Doc', isSeated: true },
  { id: 'nurse_1', type: 'nurse' as const, roomId: 'nurse1', gridX: 6, gridY: 6, facing: 'left' as const, name: 'Nurse 1', isSeated: true },
  { id: 'nurse_2', type: 'nurse' as const, roomId: 'nurse2', gridX: 6.5, gridY: 6, facing: 'left' as const, name: 'Nurse 2', isSeated: true },
  { id: 'nurse_3', type: 'nurse' as const, roomId: 'nurse3', gridX: 6.5, gridY: 5.5, facing: 'left' as const, name: 'Nurse 3', isSeated: true },
  { id: 'hepa_doc', type: 'doctor' as const, roomId: 'hepatologist', gridX: 16.5, gridY: 6, facing: 'left' as const, name: 'Hepatologist', isSeated: false },
  { id: 'expert_tele_nurse', type: 'nurse' as const, roomId: 'expert_tele', gridX: 12, gridY: 12, facing: 'left' as const, name: 'Tele Nurse', isSeated: true },
];

// ============================================
// COMPONENT PROPS
// ============================================
interface ClinicPanelLeftProps {
  simActive: boolean;
  gameTime: number;
  onStatsUpdate?: (stats: any) => void;
}

// ============================================
// COMPONENT
// ============================================
const ClinicPanelLeft: React.FC<ClinicPanelLeftProps> = ({ simActive, gameTime, onStatsUpdate }) => {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState({ x: 0, y: 0, zoom: 0.15 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState({
    waiting: 0, treated: 0, hepaCases: 0, totalSpawned: 0, time: 0,
    cumReferred: 0, cumPreConsult: 0, cumTelePre: 0, cumNurse: 0, cumMonitoring: 0,
    // New metrics
    totalIn: 0,           // Total patients entered
    totalOut: 0,          // Patients who completed workflow
    kioskHandled: 0,      // AI Pre-Consult (automated intakes)
    triageHandled: 0,     // Triage nurses (patients triaged)
    doctorHandled: 0,     // AI-Assisted Doctor consultations
    doctorBusyTime: 0,    // Accumulated doctor busy ticks
  });

  const tickRef = useRef(0);
  const patientsRef = useRef<Patient[]>([]);
  const lastGameTimeRef = useRef(0);

  useEffect(() => {
    if (onStatsUpdate) onStatsUpdate(stats);
  }, [stats, onStatsUpdate]);

  useEffect(() => {
    if (gameTime === 0 && lastGameTimeRef.current > 0) {
      patientsRef.current = [];
      setPatients([]);
      tickRef.current = 0;
      setStats({ waiting: 0, treated: 0, hepaCases: 0, totalSpawned: 0, time: 0, cumReferred: 0, cumPreConsult: 0, cumTelePre: 0, cumNurse: 0, cumMonitoring: 0, totalIn: 0, totalOut: 0, kioskHandled: 0, triageHandled: 0, doctorHandled: 0, doctorBusyTime: 0 });
    }
    lastGameTimeRef.current = gameTime;
  }, [gameTime]);

  useEffect(() => {
    let frameId: number;

    const getAvailableWaitingSeat = () => {
      // Find which seats are currently occupied by waiting/entering patients
      const occupiedSeats = new Set<number>();
      patientsRef.current.forEach(p => {
        if ((p.state === 'waiting' || p.state === 'entering') && p.assignedSeatIndex !== undefined) {
          occupiedSeats.add(p.assignedSeatIndex);
        }
      });
      // Find first available seat
      for (let i = 0; i < WAITING_SEATS.length; i++) {
        if (!occupiedSeats.has(i)) return i;
      }
      return -1; // No seats available
    };

    const spawnPatientBatch = () => {
      // Spawn patients in a batch, assigning each to an available seat
      for (let i = 0; i < BATCH_SIZE; i++) {
        const seatIndex = getAvailableWaitingSeat();
        if (seatIndex === -1) break; // No more seats available

        const patientId = `left-p-${Date.now()}-${Math.random()}-${i}`;
        const rand = Math.random();
        let originType = 'pre';
        if (rand < 0.2) originType = 'referred';
        else if (rand < 0.6) originType = 'pre';
        else originType = 'tele';

        // Stagger spawn positions slightly so they don't overlap
        const offsetX = (i % 3) * 2;
        const offsetY = Math.floor(i / 3) * 2;

        const waitingSeat = WAITING_SEATS[seatIndex];
        const newPatient: Patient = {
          id: patientId, type: 'patient', 
          gridX: SPAWN_POINT.x + offsetX, 
          gridY: SPAWN_POINT.y + offsetY,
          path: [waitingSeat], state: 'entering', waitTimer: 0, color: getRandomColor(), facing: 'right',
          assignedSeatIndex: seatIndex
        };
        patientsRef.current.push(newPatient);
        setStats(s => ({ ...s, 
          totalSpawned: s.totalSpawned + 1,
          totalIn: s.totalIn + 1,
          kioskHandled: s.kioskHandled + 1, // AI Pre-Consult automated intake
          cumReferred: originType === 'referred' ? s.cumReferred + 1 : s.cumReferred,
          cumPreConsult: originType === 'pre' ? s.cumPreConsult + 1 : s.cumPreConsult,
          cumTelePre: originType === 'tele' ? s.cumTelePre + 1 : s.cumTelePre,
        }));
      }
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
          p.gridX = target.x; p.gridY = target.y; p.path.shift();
        }
      } else {
        switch (p.state) {
          case 'entering': p.state = 'waiting'; p.waitTimer = WAITING_TIME_TICKS; break;
          case 'to_nurse': p.state = 'at_nurse'; p.waitTimer = NURSE_TIME_TICKS; setStats(s => ({ ...s, cumNurse: s.cumNurse + 1, triageHandled: s.triageHandled + 1 })); break;
          case 'to_doc': p.state = 'at_doc'; p.waitTimer = HEPATO_TIME_TICKS; setStats(s => ({ ...s, doctorHandled: s.doctorHandled + 1 })); break;
          case 'to_monitoring': p.state = 'at_monitoring'; p.waitTimer = 50; setStats(s => ({ ...s, cumMonitoring: s.cumMonitoring + 1, totalOut: s.totalOut + 1 })); break;
          case 'exiting': return true;
        }
      }
      if (p.waitTimer > 0) {
        p.waitTimer--;
        if (p.waitTimer <= 0) {
          if (p.state === 'waiting') {
            // AI Clinic: 3 expert nurses with AI-assisted load balancing
            const nurses = ROOMS.filter(r => r.type === RoomType.NURSE && r.id.startsWith('nurse'));
            nurses.sort((a, b) => a.id.localeCompare(b.id));
            const occupiedRooms = new Set(patientsRef.current.filter(pt => (pt.state === 'at_nurse' || pt.state === 'to_nurse') && pt.assignedStaffId).map(pt => pt.assignedStaffId));
            const availableNurse = nurses.find(n => !occupiedRooms.has(n.id));
            if (availableNurse) {
              p.state = 'to_nurse'; p.assignedStaffId = availableNurse.id;
              p.assignedSeatIndex = undefined; // Free up the waiting seat
              p.path = [{ x: availableNurse.gridX + 2 + Math.random() * 2, y: availableNurse.gridY + 2 + Math.random() * 2 }];
            } else { p.waitTimer = 10; } // Short wait - AI queuing optimization
          } else if (p.state === 'at_nurse') {
            // AI Clinic: AI pre-screens efficiently, only ~8% need hepatologist (1/12)
            const isHepaCase = Math.random() < (1/12);
            if (isHepaCase) {
              const hepaOccupied = patientsRef.current.some(pt => (pt.state === 'at_doc' || pt.state === 'to_doc') && pt.id !== p.id);
              if (!hepaOccupied) { 
                p.state = 'to_doc'; 
                p.path = [{ x: HEPA_POINT.x + Math.random(), y: HEPA_POINT.y + Math.random() }]; 
                setStats(s => ({ ...s, hepaCases: s.hepaCases + 1 })); 
              } else { p.waitTimer = 15; } // Short wait - AI scheduling
            } else {
              // AI-assisted monitoring - fast transition
              p.state = 'to_monitoring';
              const monRoom = ROOMS.find(r => r.id === 'monitoring');
              const monitoringCount = patientsRef.current.filter(pt => pt.state === 'at_monitoring' || pt.state === 'to_monitoring').length;
              const cols = 12; const row = Math.floor(monitoringCount / cols); const col = monitoringCount % cols;
              const monTarget = monRoom ? { x: monRoom.gridX + 15 + col * 2, y: monRoom.gridY + 12 + row * 2 } : { x: 109 + col * 2, y: 24 + row * 2 };
              p.path = p.assignedStaffId === 'nurse3' ? [CORRIDOR_NORTH, MONITORING_ENTRY_NORTH, monTarget] : [CORRIDOR_SOUTH, MONITORING_ENTRY_SOUTH, monTarget];
              setStats(s => ({ ...s, treated: s.treated + 1 }));
            }
          } else if (p.state === 'at_doc') {
            // Fast hepatologist consultation with AI-assisted diagnosis
            p.state = 'to_monitoring';
            const monRoom = ROOMS.find(r => r.id === 'monitoring');
            const monitoringCount = patientsRef.current.filter(pt => pt.state === 'at_monitoring' || pt.state === 'to_monitoring').length;
            const cols = 12; const row = Math.floor(monitoringCount / cols); const col = monitoringCount % cols;
            const monTarget = monRoom ? { x: monRoom.gridX + 15 + col * 2, y: monRoom.gridY + 12 + row * 2 } : { x: 109 + col * 2, y: 24 + row * 2 };
            p.path = [monTarget];
          }
        }
      }
      return true;
    };

    const loop = () => {
      if (simActive && gameTime < TOTAL_GAME_MINUTES) {
        tickRef.current++;
        setStats(s => ({ ...s, time: tickRef.current }));
        // Track doctor busy time
        const doctorBusy = patientsRef.current.some(pt => pt.state === 'at_doc');
        if (doctorBusy) setStats(s => ({ ...s, doctorBusyTime: s.doctorBusyTime + 1 }));
        if (tickRef.current % SPAWN_RATE_TICKS === 0) spawnPatientBatch();
        patientsRef.current = patientsRef.current.filter(updatePatient);
        setPatients([...patientsRef.current]);
        setStats(s => ({ ...s, waiting: patientsRef.current.filter(p => p.state === 'waiting').length }));
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [simActive, gameTime]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.max(0.1, Math.min(2.0, viewState.zoom - e.deltaY * 0.001));
    setViewState(prev => ({ ...prev, zoom: newZoom }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.clickable-room')) return;
    e.preventDefault();
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => { setIsDragging(false); };

  const handleRoomClick = (room: RoomDef) => {
    if (room.id === 'pre_consult') navigate('/pre-consultation');
    else if (room.type === RoomType.HEPATOLOGIST) navigate('/board');
    else if (room.type === RoomType.NURSE && room.id.startsWith('nurse')) {
      if (room.id === 'nurse1') navigate('/nurse-sim-1');
      else navigate('/nurse-sim', { state: { triageRoom: room.id } });
    }
  };

  const isInDoorZone = (gridX: number, gridY: number) => gridX >= DOOR_ZONE.minX && gridX <= DOOR_ZONE.maxX && gridY >= DOOR_ZONE.minY && gridY <= DOOR_ZONE.maxY;

  const renderList = useMemo(() => {
    const clickableAreas: React.ReactNode[] = [];
    const charactersBehindDoor: { y: number; node: React.ReactNode }[] = [];
    const charactersInFront: { y: number; node: React.ReactNode }[] = [];

    ROOMS.forEach((room) => {
      const center = gridToScreen(room.gridX + room.width / 2, room.gridY + room.height / 2);
      const isClickable = room.id === 'pre_consult' || room.type === RoomType.HEPATOLOGIST || (room.type === RoomType.NURSE && room.id.startsWith('nurse'));
      const showHighlight = room.type === RoomType.HEPATOLOGIST || (room.type === RoomType.NURSE && room.id.startsWith('nurse'));
      clickableAreas.push(
        <g key={`left-zone-${room.id}`} onClick={(e) => { e.stopPropagation(); handleRoomClick(room); }} className={isClickable ? "cursor-pointer clickable-room" : ""} style={{ pointerEvents: 'all' }}>
          <IsoRoundedZone x={center.x} y={center.y} width={room.width * 32} height={room.height * 32} color={room.floorColor || '#888'} opacity={showHighlight ? 0.15 : 0.01} borderRadius={25} />
        </g>
      );
    });

    STAFF.forEach(staff => {
      const room = ROOMS.find(r => r.id === staff.roomId);
      if (room) {
        const gridX = room.gridX + staff.gridX; const gridY = room.gridY + staff.gridY;
        const center = gridToScreen(gridX, gridY);
        const charNode = { y: center.y, node: <IsoCharacter key={`left-staff-${staff.id}`} x={center.x} y={center.y} role={staff.type} facing={staff.facing} isSeated={staff.isSeated} /> };
        if (isInDoorZone(gridX, gridY)) charactersBehindDoor.push(charNode); else charactersInFront.push(charNode);
      }
    });

    patients.forEach(p => {
      const pos = gridToScreen(p.gridX, p.gridY);
      const charNode = { y: pos.y, node: <IsoCharacter key={p.id} x={pos.x} y={pos.y} role="patient" facing={p.facing} /> };
      if (isInDoorZone(p.gridX, p.gridY)) charactersBehindDoor.push(charNode); else charactersInFront.push(charNode);
    });

    charactersBehindDoor.sort((a, b) => a.y - b.y);
    charactersInFront.sort((a, b) => a.y - b.y);
    return { clickableAreas, charactersBehindDoor, charactersInFront };
  }, [patients]);

  return (
    <div className="w-full h-full bg-slate-50 relative overflow-hidden select-none"
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
      <svg width="100%" height="100%" className="block">
        <g transform={`translate(${200 + viewState.x}, ${150 + viewState.y}) scale(${viewState.zoom})`}>
          <image href={SVG_REST.src} x={SVG_REST.x} y={SVG_REST.y} width={SVG_REST.width} height={SVG_REST.height} preserveAspectRatio="xMidYMid meet" />
          {renderList.charactersBehindDoor.map(o => o.node)}
          <image href={SVG_DOOR.src} x={SVG_DOOR.x} y={SVG_DOOR.y} width={SVG_DOOR.width} height={SVG_DOOR.height} preserveAspectRatio="xMidYMid meet" />
          {renderList.charactersInFront.map(o => o.node)}
          {renderList.clickableAreas}
        </g>
      </svg>
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1">
        <button onClick={() => setViewState(prev => ({ ...prev, zoom: Math.min(2.0, prev.zoom + 0.1) }))}
          className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-md flex items-center justify-center hover:bg-slate-50">
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" /></svg>
        </button>
        <button onClick={() => setViewState(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom - 0.1) }))}
          className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-md flex items-center justify-center hover:bg-slate-50">
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12" /></svg>
        </button>
      </div>
    </div>
  );
};

export default ClinicPanelLeft;
