import React from 'react';
import { Appointment, AppointmentType } from './types';
import { PIXELS_PER_HOUR, APPOINTMENT_COLORS, START_HOUR } from './constants';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: (apt: Appointment) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onClick }) => {
  const startHour = appointment.startTime.getHours();
  const startMinute = appointment.startTime.getMinutes();
  
  // Calculate position relative to the grid start (9 AM)
  const hoursSinceStart = startHour - START_HOUR + (startMinute / 60);
  const topPosition = hoursSinceStart * PIXELS_PER_HOUR;
  const height = (appointment.durationMinutes / 60) * PIXELS_PER_HOUR;

  const colorClass = APPOINTMENT_COLORS[appointment.type] || APPOINTMENT_COLORS[AppointmentType.CONSULTATION];

  // Helper to format time display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const endTime = new Date(appointment.startTime.getTime() + appointment.durationMinutes * 60000);

  // Compact mode for short appointments (less than 30 mins)
  const isCompact = height < 60;
  const isTiny = height < 40;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(appointment);
      }}
      className={`absolute left-4 right-4  border-l-4 px-4 py-3 cursor-pointer shadow-sm hover:shadow-md transition-all z-10 overflow-hidden ${colorClass} border border-slate-200`}
      style={{
        top: `${topPosition}px`,
        height: `${height}px`,
      }}
    >
      <div className={`flex h-full ${isCompact ? 'flex-row items-center gap-3' : 'flex-col justify-start'}`}>
        {!isTiny && (
          <div className={`text-xs font-bold text-slate-600 ${isCompact ? 'whitespace-nowrap' : 'mb-1.5'}`}>
            {formatTime(appointment.startTime)}
            {!isCompact && ` - ${formatTime(endTime)}`}
          </div>
        )}
        
        <div className={`font-semibold truncate leading-tight ${isTiny ? 'text-xs' : 'text-sm'} text-slate-900`}>
          {appointment.patientName}
        </div>
        
        {!isCompact && (
          <>
            <div className="text-xs text-slate-500 truncate uppercase tracking-wide font-medium mt-1">
              {appointment.type}
            </div>
            {height > 100 && appointment.notes && (
              <div className="text-xs mt-2 text-slate-600 line-clamp-2 leading-relaxed">
                {appointment.notes}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};