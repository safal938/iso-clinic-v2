export enum AppointmentType {
  CONSULTATION = 'Consultation',
  CHECKUP = 'Checkup',
  SURGERY = 'Surgery',
  FOLLOW_UP = 'Follow-up',
  EMERGENCY = 'Emergency'
}

export interface Appointment {
  id: string;
  patientId?: string; // Backend patient ID (e.g., "P0004")
  patientName: string;
  type: AppointmentType;
  startTime: Date;
  durationMinutes: number;
  notes?: string;
  color?: string;
  status?: 'scheduled' | 'done' | 'cancelled';
}

export interface TimeSlot {
  hour: number;
  label: string;
}
