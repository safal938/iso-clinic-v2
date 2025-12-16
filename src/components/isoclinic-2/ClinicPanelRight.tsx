/**
 * RIGHT CLINIC PANEL
 * Edit this file to customize the right clinic view independently
 * This file is completely separate from ClinicPanelLeft.tsx
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomType, RoomDef, Patient } from '../../types/isoclinic';
import { getRandomColor } from '../../utils/isometric';
import { gridToScreenRight, getMonitoringTargetRight, WAYPOINTS_RIGHT } from '../../utils/isometric-right';
import { IsoCharacter, IsoRoundedZone } from './IsoComponents';

// ============================================
// SVG CONFIGURATION - RIGHT CLINIC
// Change these to use different SVG files
// ============================================
const SVG_REST = {
  src: '/regular_floor.svg',       // <-- Change to your custom SVG (e.g., '/clinic-right.svg')
  x: -265,                // <-- Adjust X position
  y: 150,                // <-- Adjust Y position
width: 2513,
height: 1762,
};

const SVG_DOOR = {
  src: '/regular_door.svg',       // <-- Change to your custom door SVG or '' to hide
  x: -430,
  y: -200,
  width: 1457,
  height: 1769,
};

// Door zone - characters in this area render BEHIND the door SVG
// Covers the entrance corridor where the door is located
const DOOR_ZONE = { minX: 15, maxX: 35, minY: 5, maxY: 25 };

// ============================================
// SIMULATION SETTINGS - STANDARD CLINIC (TRADITIONAL)
// Manual processes, fewer staff, longer wait times
// Same spawn rate as AI clinic, but 4.6X slower processing
// ============================================
const PATIENT_SPEED = 0.2;            // Same speed as AI clinic
const SPAWN_RATE_TICKS = 200;         // Slower spawn rate for cleaner visuals
const BATCH_SIZE = 2;                 // Spawn 2 patients per batch
const WAITING_TIME_TICKS = 230;       // 4.6X slower than AI clinic (50 * 4.6)
const NURSE_TIME_TICKS = 220;         // Time spent with nurse
const HEPATO_TIME_TICKS = 350;        // Time spent with hepatologist (longer consultation)
const TOTAL_GAME_MINUTES = 540;       // 9 hours

// ============================================
// WAYPOINTS - RIGHT CLINIC
// Using centralized waypoints from isometric-right.ts
// ============================================
const SPAWN_POINT = WAYPOINTS_RIGHT.SPAWN;
const HEPA_POINT = WAYPOINTS_RIGHT.HEPA_1;
const HEPA_POINT_2 = WAYPOINTS_RIGHT.HEPA_2;
const CORRIDOR_POINT = WAYPOINTS_RIGHT.CORRIDOR;
const MONITORING_ENTRY = WAYPOINTS_RIGHT.MONITORING_ENTRY;

// 10 predefined seating positions in the waiting room
// Arranged in 2 rows of 5 seats each
const WAITING_SEATS_RIGHT = [

{ x: 44, y: 18 },
{ x: 44, y: 19 },
{ x: 44, y: 20 },
{ x: 44, y: 21 },
{ x: 44, y: 22 },
{ x: 44, y: 23 },
{ x: 44, y: 24 },
{ x: 44, y: 25 },
{ x: 46, y: 18 },
{ x: 46, y: 19 },
{ x: 46, y: 20 },
{ x: 46, y: 21 },
{ x: 46, y: 22 },
{ x: 46, y: 23 },
{ x: 46, y: 24 },
];
// ============================================
// ROOM COLORS - RIGHT CLINIC
// ============================================
const COL_PRE_CONSULT = '#93c5fd';
const COL_WAITING = '#d8b4fe';
const COL_NURSE = '#67e8f9';
const COL_HEPA = '#fca5a5';
const COL_TELE_NURSE = '#cffafe';
const COL_MONITORING = '#fca5a5';

// ============================================
// ROOMS - RIGHT CLINIC
// Modify gridX, gridY, width, height to reposition rooms
// These are INDEPENDENT from the left clinic
// ============================================
const ROOMS: RoomDef[] = [
  { id: 'pre_consult', name: 'Pre consultation', type: RoomType.ENTRANCE, gridX: 0.5, gridY: 0, width: 20, height: 20, color: '#fff', floorColor: COL_PRE_CONSULT, wallColor: '#fff' },
  { id: 'waiting', name: 'Waiting room', type: RoomType.WAITING, gridX: 28, gridY: 15, width: 32, height: 10, color: '#fff', floorColor: COL_WAITING, wallColor: '#fff' },
  { id: 'nurse1', name: 'Expert Nurse', type: RoomType.NURSE, gridX: 49, gridY: 16.5, width: 12, height: 12, color: '#fff', floorColor: COL_NURSE, wallColor: '#fff' },
  { id: 'hepatologist', name: 'Hepatologist', type: RoomType.HEPATOLOGIST, gridX: 56, gridY: 10, width: 18, height: 10, color: '#fff', floorColor: COL_HEPA, wallColor: '#fff' },
  { id: 'hepatologist2', name: 'Hepatologist', type: RoomType.HEPATOLOGIST, gridX: 57, gridY: 26, width: 18, height: 10, color: '#fff', floorColor: COL_HEPA, wallColor: '#fff' },
  { id: 'monitoring', name: 'Monitoring', type: RoomType.MONITORING, gridX: 70, gridY: 10, width: 58, height: 40, color: '#fff', floorColor: COL_MONITORING, wallColor: '#fff' },
];

// ============================================
// STAFF - RIGHT CLINIC
// Positions are relative to their room
// ============================================
const STAFF = [
  { id: 'nurse_1', type: 'nurse' as const, roomId: 'nurse1', gridX: 6.5, gridY: 5.5, facing: 'left' as const, name: 'Nurse 3', isSeated: true },
  { id: 'hepa_doc', type: 'doctor' as const, roomId: 'hepatologist', gridX: 9, gridY: 5, facing: 'left' as const, name: 'Hepatologist', isSeated: false },
  { id: 'hepa_doc2', type: 'doctor' as const, roomId: 'hepatologist2', gridX: 9, gridY: 5, facing: 'left' as const, name: 'Hepatologist', isSeated: false },
  { id: 'expert_tele_nurse', type: 'nurse' as const, roomId: 'expert_tele', gridX: 12, gridY: 12, facing: 'left' as const, name: 'Tele Nurse', isSeated: true },
];

// ===========================================
// COMPONENT PROPS
// ============================================
interface ClinicPanelRightProps {
  simActive: boolean;
  gameTime: number;
  onStatsUpdate?: (stats: any) => void;
}

// ============================================
// COMPONENT
// ============================================
const ClinicPanelRight: React.FC<ClinicPanelRightProps> = ({ simActive, gameTime, onStatsUpdate }) => {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState({ x: 0, y: 0, zoom: 0.17 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState({
    waiting: 0, treated: 0, hepaCases: 0, totalSpawned: 0, time: 0,
    cumReferred: 0, cumPreConsult: 0, cumTelePre: 0, cumNurse: 0, cumMonitoring: 0,
    // New metrics
    totalIn: 0,             // Total patients entered
    totalOut: 0,            // Patients who completed workflow
    receptionHandled: 0,    // Receptionists (patients checked-in)
    doctorHandled: 0,       // Standard Doctor consultations
    doctorBusyTime: 0,      // Accumulated doctor busy ticks
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
      setStats({ waiting: 0, treated: 0, hepaCases: 0, totalSpawned: 0, time: 0, cumReferred: 0, cumPreConsult: 0, cumTelePre: 0, cumNurse: 0, cumMonitoring: 0, totalIn: 0, totalOut: 0, receptionHandled: 0, doctorHandled: 0, doctorBusyTime: 0 });
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
      for (let i = 0; i < WAITING_SEATS_RIGHT.length; i++) {
        if (!occupiedSeats.has(i)) return i;
      }
      return -1; // No seats available
    };

    const spawnPatientBatch = () => {
      // Spawn patients in a batch, assigning each to an available seat
      for (let i = 0; i < BATCH_SIZE; i++) {
        const seatIndex = getAvailableWaitingSeat();
        if (seatIndex === -1) break; // No more seats available

        const patientId = `right-p-${Date.now()}-${Math.random()}-${i}`;
        const rand = Math.random();
        let originType = 'pre';
        if (rand < 0.2) originType = 'referred';
        else if (rand < 0.6) originType = 'pre';
        else originType = 'tele';

        // Stagger spawn positions slightly so they don't overlap
        const offsetX = (i % 3) * 2;
        const offsetY = Math.floor(i / 3) * 2;

        const waitingSeat = WAITING_SEATS_RIGHT[seatIndex];
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
          receptionHandled: s.receptionHandled + 1, // Standard reception check-in
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
          case 'to_nurse': p.state = 'at_nurse'; p.waitTimer = NURSE_TIME_TICKS; setStats(s => ({ ...s, cumNurse: s.cumNurse + 1 })); break;
          case 'to_doc': p.state = 'at_doc'; p.waitTimer = HEPATO_TIME_TICKS; setStats(s => ({ ...s, doctorHandled: s.doctorHandled + 1 })); break;
          case 'to_monitoring': p.state = 'at_monitoring'; p.waitTimer = 50; setStats(s => ({ ...s, cumMonitoring: s.cumMonitoring + 1, totalOut: s.totalOut + 1 })); break;
          case 'exiting': return true;
        }
      }
      if (p.waitTimer > 0) {
        p.waitTimer--;
        if (p.waitTimer <= 0) {
          if (p.state === 'waiting') {
            // Standard clinic: Only 1 nurse, creates major bottleneck
            const nurseRoom = ROOMS.find(r => r.id === 'nurse1');
            const occupiedRooms = new Set(patientsRef.current.filter(pt => (pt.state === 'at_nurse' || pt.state === 'to_nurse') && pt.assignedStaffId).map(pt => pt.assignedStaffId));
            if (nurseRoom && !occupiedRooms.has(nurseRoom.id)) {
              p.state = 'to_nurse'; 
              p.assignedStaffId = nurseRoom.id;
              p.assignedSeatIndex = undefined; // Free up the waiting seat
              const nurseCenter = { x: nurseRoom.gridX + nurseRoom.width / 2, y: nurseRoom.gridY + nurseRoom.height / 2 };
              p.path = [nurseCenter];
            } else { p.waitTimer = 60; } // Long wait - single nurse bottleneck
          } else if (p.state === 'at_nurse') {
            // Standard clinic: high hepatologist referral rate (1/3 = 33%), less efficient triage
            // Only roll once - mark patient as needing hepato
            if (p.needsHepa === undefined) {
              p.needsHepa = Math.random() < (1/3);
            }
            if (p.needsHepa) {
              // Check which hepatologist is available
              const hepa1Occupied = patientsRef.current.some(pt => (pt.state === 'at_doc' || pt.state === 'to_doc') && pt.assignedStaffId === 'hepatologist');
              const hepa2Occupied = patientsRef.current.some(pt => (pt.state === 'at_doc' || pt.state === 'to_doc') && pt.assignedStaffId === 'hepatologist2');
              
              if (!hepa1Occupied) {
                p.state = 'to_doc';
                p.assignedStaffId = 'hepatologist';
                p.path = [HEPA_POINT];
                setStats(s => ({ ...s, hepaCases: s.hepaCases + 1 }));
              } else if (!hepa2Occupied) {
                p.state = 'to_doc';
                p.assignedStaffId = 'hepatologist2';
                p.path = [HEPA_POINT_2];
                setStats(s => ({ ...s, hepaCases: s.hepaCases + 1 }));
              } else { p.waitTimer = 30; } // Wait for hepato availability
            } else {
              // Go to monitoring - slower processing
              p.state = 'to_monitoring';
              const monitoringCount = patientsRef.current.filter(pt => pt.state === 'at_monitoring' || pt.state === 'to_monitoring').length;
              const monTarget = getMonitoringTargetRight(monitoringCount);
              p.path = [CORRIDOR_POINT, MONITORING_ENTRY, monTarget];
              setStats(s => ({ ...s, treated: s.treated + 1 }));
            }
          } else if (p.state === 'at_doc') {
            // After hepatologist, go to monitoring
            p.state = 'to_monitoring';
            const monitoringCount = patientsRef.current.filter(pt => pt.state === 'at_monitoring' || pt.state === 'to_monitoring').length;
            const monTarget = getMonitoringTargetRight(monitoringCount);
            p.path = [CORRIDOR_POINT, MONITORING_ENTRY, monTarget];
            setStats(s => ({ ...s, treated: s.treated + 1 }));
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
      const center = gridToScreenRight(room.gridX + room.width / 2, room.gridY + room.height / 2);
      const isClickable = room.id === 'pre_consult' || room.type === RoomType.HEPATOLOGIST || (room.type === RoomType.NURSE && room.id.startsWith('nurse'));
      const roomOpacity = room.id === 'monitoring' ? 0.4 : 0;
      clickableAreas.push(
        <g key={`right-zone-${room.id}`} onClick={(e) => { e.stopPropagation(); handleRoomClick(room); }} className={isClickable ? "cursor-pointer clickable-room" : ""} style={{ pointerEvents: 'all' }}>
          <IsoRoundedZone x={center.x} y={center.y} width={room.width * 32} height={room.height * 32} color={room.floorColor || '#888'} opacity={roomOpacity} borderRadius={25} />
        </g>
      );
    });

    STAFF.forEach(staff => {
      const room = ROOMS.find(r => r.id === staff.roomId);
      if (room) {
        const gridX = room.gridX + staff.gridX; const gridY = room.gridY + staff.gridY;
        const center = gridToScreenRight(gridX, gridY);
        const charNode = { y: center.y, node: <IsoCharacter key={`right-staff-${staff.id}`} x={center.x} y={center.y} role={staff.type} facing={staff.facing} isSeated={staff.isSeated} /> };
        if (isInDoorZone(gridX, gridY)) charactersBehindDoor.push(charNode); else charactersInFront.push(charNode);
      }
    });

    patients.forEach(p => {
      const pos = gridToScreenRight(p.gridX, p.gridY);
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
          {renderList.clickableAreas}
          {renderList.charactersInFront.map(o => o.node)}
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

export default ClinicPanelRight;
