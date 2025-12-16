import { RoomType, Staff } from '../types/isoclinic';
import { ExtendedRoomDef } from './isoclinic';

// ============================================
// SVG CONFIGURATION FOR RIGHT CLINIC
// ============================================
// Change these paths to use different SVG files
// Place your SVG files in the /public folder
export const SVG_REST_RIGHT = {
  src: '/rest.svg',      // <-- Change this to your new SVG path (e.g., '/clinic-right.svg')
  x: -825,               // <-- Adjust X position
  y: -300,               // <-- Adjust Y position  
  width: 4626,           // <-- Adjust width
  height: 3324,          // <-- Adjust height
};

export const SVG_DOOR_RIGHT = {
  src: '/door.svg',      // <-- Change this to your new door SVG path (or set to empty string to hide)
  x: 165,                // <-- Adjust X position
  y: 600,                // <-- Adjust Y position
  width: 1557,           // <-- Adjust width
  height: 1869,          // <-- Adjust height
};

// Door zone defines where characters render "behind" the door
// Characters in this zone render before the door SVG layer
export const DOOR_ZONE_RIGHT = {
  minX: 30,
  maxX: 55,
  minY: 10,
  maxY: 25,
};

// ============================================
// ROOM COLORS
// ============================================
const COL_PRE_CONSULT = '#93c5fd';
const COL_WAITING = '#d8b4fe';
const COL_NURSE = '#67e8f9';
const COL_HEPA = '#fca5a5';
const COL_TELE_NURSE = '#cffafe';
const COL_MONITORING = '#fca5a5';

// Waypoints for right clinic - adjust these to match your room positions
export const SPAWN_POINT_RIGHT = { x: 30, y: 19 };
export const WAITING_POINT_RIGHT = { x: 70, y: 22 };
export const HEPA_POINT_RIGHT = { x: 93, y: 29 };

// Corridor waypoints for right clinic
export const CORRIDOR_NORTH_RIGHT = { x: 72, y: 10 };
export const CORRIDOR_SOUTH_RIGHT = { x: 72, y: 45 };
export const MONITORING_ENTRY_NORTH_RIGHT = { x: 120, y: 12 };
export const MONITORING_ENTRY_SOUTH_RIGHT = { x: 120, y: 50 };

// Room definitions for right clinic - modify gridX, gridY, width, height as needed
export const ROOMS_RIGHT: ExtendedRoomDef[] = [
  {
    id: 'pre_consult',
    name: 'Pre consultation',
    type: RoomType.ENTRANCE,
    gridX: -15.5, gridY: 4, width: 92, height: 30,
    color: '#fff', floorColor: COL_PRE_CONSULT, wallColor: '#fff',
  },
  {
    id: 'tele_pre',
    name: 'Tele Pre',
    type: RoomType.TELEMEDICINE,
    gridX: 16, gridY: -40, width: 23, height: 23,
    color: '#fff', floorColor: COL_PRE_CONSULT, wallColor: '#fff',
  },
  {
    id: 'waiting',
    name: 'Waiting room',
    type: RoomType.WAITING,
    gridX: 53, gridY: 20, width: 34, height: 10,
    color: '#fff', floorColor: COL_WAITING, wallColor: '#fff',
  },
  {
    id: 'nurse1',
    name: 'Expert Nurse',
    type: RoomType.NURSE,
    gridX: 77, gridY: 33.5, width: 12, height: 12,  // <-- Modify these values
    color: '#fff', floorColor: COL_NURSE, wallColor: '#fff',
  },
  {
    id: 'nurse2',
    name: 'Expert Nurse',
    type: RoomType.NURSE,
    gridX: 76, gridY: 22, width: 13, height: 12,  // <-- Modify these values
    color: '#fff', floorColor: COL_NURSE, wallColor: '#fff',
  },
  {
    id: 'nurse3',
    name: 'Expert Nurse',
    type: RoomType.NURSE,
    gridX: 74, gridY: 10, width: 13, height: 11,  // <-- Modify these values
    color: '#fff', floorColor: COL_NURSE, wallColor: '#fff',
  },
  {
    id: 'hepatologist',
    name: 'Hepatologist',
    type: RoomType.HEPATOLOGIST,
    gridX: 77, gridY: 23, width: 33, height: 12,  // <-- Modify these values
    color: '#fff', floorColor: COL_HEPA, wallColor: '#fff',
  },
  {
    id: 'expert_tele',
    name: 'Expert Tele Nurse',
    type: RoomType.NURSE,
    gridX: 57, gridY: -34, width: 24, height: 24,
    color: '#fff', floorColor: COL_TELE_NURSE, wallColor: '#fff',
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    type: RoomType.MONITORING,
    gridX: 94, gridY: 12, width: 58, height: 40,  // <-- Modify these values
    color: '#fff', floorColor: COL_MONITORING, wallColor: '#fff',
  }
];

// Staff positions for right clinic - positions are relative to their room
export const STAFF_RIGHT: Staff[] = [
  { id: 'tele_doc', type: 'doctor', roomId: 'tele_pre', gridX: 11.5, gridY: 11.5, facing: 'right', name: 'Tele Doc', isSeated: true },
  { id: 'nurse_1', type: 'nurse', roomId: 'nurse1', gridX: 6, gridY: 6, facing: 'left', name: 'Nurse 1', isSeated: true },
  { id: 'nurse_2', type: 'nurse', roomId: 'nurse2', gridX: 6.5, gridY: 6, facing: 'left', name: 'Nurse 2', isSeated: true },
  { id: 'nurse_3', type: 'nurse', roomId: 'nurse3', gridX: 6.5, gridY: 5.5, facing: 'left', name: 'Nurse 3', isSeated: true },
  { id: 'hepa_doc', type: 'doctor', roomId: 'hepatologist', gridX: 16.5, gridY: 6, facing: 'left', name: 'Hepatologist', isSeated: false },
  { id: 'expert_tele_nurse', type: 'nurse', roomId: 'expert_tele', gridX: 12, gridY: 12, facing: 'left', name: 'Tele Nurse', isSeated: true },
];
