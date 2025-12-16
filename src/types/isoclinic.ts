export interface Point {
  x: number;
  y: number;
}

export enum RoomType {
  ENTRANCE = 'Entrance',
  TELEMEDICINE = 'Telemedicine',
  WAITING = 'Waiting Room',
  NURSE = 'Nurse Station',
  HEPATOLOGIST = 'Hepatologist',
  MONITORING = 'Monitoring AI',
  EXIT = 'Exit'
}

export interface RoomDef {
  id: string;
  name: string;
  type: RoomType;
  gridX: number;
  gridY: number;
  width: number;
  height: number;
  color: string;
  wallColor: string;
  floorColor: string;
  labelColor?: string;
}

export interface Patient {
  id: string;
  type: 'patient';
  gridX: number;
  gridY: number;
  path: Point[];
  targetX?: number;
  targetY?: number;
  state: 'entering' | 'waiting' | 'to_nurse' | 'at_nurse' | 'to_doc' | 'at_doc' | 'to_monitoring' | 'at_monitoring' | 'exiting';
  assignedStaffId?: string;
  assignedSeatIndex?: number;
  waitTimer: number;
  color: string;
  facing: 'left' | 'right';
  needsHepa?: boolean;
}

export interface Staff {
  id: string;
  type: 'doctor' | 'nurse' | 'admin' | 'tech';
  roomId: string;
  gridX: number;
  gridY: number;
  facing: 'left' | 'right';
  name: string;
  isSeated?: boolean;
  color?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
