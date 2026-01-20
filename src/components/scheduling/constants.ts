import { AppointmentType, TimeSlot } from './types';

export const START_HOUR = 9;
export const END_HOUR = 17;
export const HOURS_COUNT = END_HOUR - START_HOUR;
export const PIXELS_PER_HOUR = 180; // Increased for better readability

// Professional medical color palette - white cards with colored left borders
export const APPOINTMENT_COLORS: Record<AppointmentType, string> = {
  [AppointmentType.CONSULTATION]: 'bg-white border-l-blue-600 text-slate-900',
  [AppointmentType.CHECKUP]: 'bg-white border-l-teal-600 text-slate-900',
  [AppointmentType.SURGERY]: 'bg-white border-l-indigo-600 text-slate-900',
  [AppointmentType.FOLLOW_UP]: 'bg-white border-l-cyan-600 text-slate-900',
  [AppointmentType.EMERGENCY]: 'bg-white border-l-slate-600 text-slate-900',
};

// Generate time slots for every 30 minutes
export const TIME_SLOTS: TimeSlot[] = [];
for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    if (hour === END_HOUR && minute > 0) break;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const minuteStr = minute === 0 ? '00' : minute.toString();
    TIME_SLOTS.push({
      hour: hour + (minute / 60),
      label: `${displayHour}:${minuteStr} ${ampm}`,
    });
  }
}

export const MOCK_APPOINTMENTS = [
  {
    id: '1',
    patientName: 'Alice Johnson',
    type: AppointmentType.CHECKUP,
    startTime: new Date(new Date().setHours(9, 30, 0, 0)),
    durationMinutes: 45,
    notes: 'Routine annual physical.'
  },
  {
    id: '2',
    patientName: 'Michael Smith',
    type: AppointmentType.CONSULTATION,
    startTime: new Date(new Date().setHours(11, 15, 0, 0)),
    durationMinutes: 15,
    notes: 'Quick follow-up on test results.'
  },
  {
    id: '3',
    patientName: 'Jennifer Wu',
    type: AppointmentType.FOLLOW_UP,
    startTime: new Date(new Date().setHours(11, 45, 0, 0)),
    durationMinutes: 15,
    notes: 'Prescription refill review.'
  },
  {
    id: '4',
    patientName: 'Sarah Connor',
    type: AppointmentType.EMERGENCY,
    startTime: new Date(new Date().setHours(14, 0, 0, 0)),
    durationMinutes: 90,
    notes: 'Urgent care required.'
  },
  {
    id: '5',
    patientName: 'Dr. House (Consult)',
    type: AppointmentType.SURGERY,
    startTime: new Date(new Date().setHours(16, 0, 0, 0)),
    durationMinutes: 60,
    notes: 'Pre-op assessment.'
  }
];
