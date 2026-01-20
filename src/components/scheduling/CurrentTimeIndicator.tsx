import React, { useState, useEffect } from 'react';
import { PIXELS_PER_HOUR, START_HOUR, END_HOUR } from './constants';

export const CurrentTimeIndicator: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (currentHour < START_HOUR || currentHour >= END_HOUR) {
    return null;
  }

  const hoursSinceStart = currentHour - START_HOUR + (currentMinute / 60);
  const topPosition = hoursSinceStart * PIXELS_PER_HOUR + 16;

  return (
    <div 
      className="absolute left-0 right-0 border-t-2 border-red-500 z-20 flex items-center pointer-events-none"
      style={{ top: `${topPosition}px` }}
    >
      <div className="absolute -left-2 w-3 h-3 bg-red-500 rounded-full shadow-md"></div>
      <div className="absolute -right-2 w-3 h-3 bg-red-500 rounded-full shadow-md"></div>
    </div>
  );
};
