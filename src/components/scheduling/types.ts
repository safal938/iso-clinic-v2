export enum AppointmentType {
  CONSULTATION = 'Consultation',
  CHECKUP = 'Checkup',
  SURGERY = 'Surgery',
  FOLLOW_UP = 'Follow-up',
  EMERGENCY = 'Emergency'
}

export interface Appointment {
  id: string;
  patientName: string;
  type: AppointmentType;
  startTime: Date;
  durationMinutes: number;
  notes?: string;
  color?: string;
}

export interface TimeSlot {
  hour: number;
  label: string;
}
