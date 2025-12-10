import { RoomDef, RoomType, Staff, Patient } from '../types/isoclinic';

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const WALL_HEIGHT = 120;

export const PATIENT_SPEED = 0.15;
export const SPAWN_RATE_TICKS = 180;
export const WAITING_TIME_TICKS = 120;
export const TREATMENT_TIME_TICKS = 300;

export interface ExtendedRoomDef extends RoomDef {
  labelColor?: string;
}

const COL_PRE_CONSULT = '#93c5fd';
const COL_WAITING = '#d8b4fe';
const COL_NURSE = '#67e8f9';
const COL_HEPA = '#fca5a5';
const COL_TELE_NURSE = '#cffafe';
const COL_MONITORING = '#fca5a5';

export const MAIN_ROOM = { x: 24, y: 24, w: 45, h: 45 };

export const SPAWN_POINT = { x: 30, y: 19 };
export const WAITING_POINT = { x: 70, y: 22 };
export const HEPA_POINT = { x: 93, y: 29 };
export const EXIT_DOOR_POS = { x: 55, y: 10 };

export const ROOMS: ExtendedRoomDef[] = [
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
    gridX: 77, gridY: 33.5, width: 12, height: 12,
    color: '#fff', floorColor: COL_NURSE, wallColor: '#fff',
  },
  {
    id: 'nurse2',
    name: 'Expert Nurse',
    type: RoomType.NURSE,
    gridX: 76, gridY: 22, width: 13, height: 12,
    color: '#fff', floorColor: COL_NURSE, wallColor: '#fff',
  },
  {
    id: 'nurse3',
    name: 'Expert Nurse',
    type: RoomType.NURSE,
    gridX: 74, gridY: 10, width: 13, height: 11,
    color: '#fff', floorColor: COL_NURSE, wallColor: '#fff',
  },
  {
    id: 'hepatologist',
    name: 'Hepatologist',
    type: RoomType.HEPATOLOGIST,
    gridX: 77, gridY: 23, width: 33, height: 12,
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
    gridX: 94, gridY: 12, width: 58, height: 40,
    color: '#fff', floorColor: COL_MONITORING, wallColor: '#fff',
  }
];

export const STAFF: Staff[] = [
  { id: 'tele_doc', type: 'doctor', roomId: 'tele_pre', gridX: 11.5, gridY: 11.5, facing: 'right', name: 'Tele Doc', isSeated: true },
  { id: 'nurse_1', type: 'nurse', roomId: 'nurse1', gridX: 6, gridY: 6, facing: 'left', name: 'Nurse 1', isSeated: true },
  { id: 'nurse_2', type: 'nurse', roomId: 'nurse2', gridX: 6.5, gridY: 6, facing: 'left', name: 'Nurse 2', isSeated: true },
  { id: 'nurse_3', type: 'nurse', roomId: 'nurse3', gridX: 6.5, gridY: 5.5, facing: 'left', name: 'Nurse 3', isSeated: true },
  { id: 'hepa_doc', type: 'doctor', roomId: 'hepatologist', gridX: 16.5, gridY: 6, facing: 'left', name: 'Hepatologist', isSeated: false },
  { id: 'expert_tele_nurse', type: 'nurse', roomId: 'expert_tele', gridX: 12, gridY: 12, facing: 'left', name: 'Tele Nurse', isSeated: true },
];

export const STATIC_PATIENTS: Patient[] = [];

export const CLINIC_WIDTH = 80;
export const CLINIC_HEIGHT = 80;
