import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { TIME_SLOTS, PIXELS_PER_HOUR } from './constants';
import { Appointment, AppointmentType } from './types';
import { AppointmentCard } from './AppointmentCard';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { Patient } from '../../types/nurse-sim';

interface SchedulingCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients?: Patient[];
}

interface AddAppointmentFormProps {
  onSave: (appointment: Omit<Appointment, 'id'>) => void;
  onCancel: () => void;
  initialTime?: { hour: number; minute: number };
  currentDate: Date;
  patients?: Patient[];
}

const AddAppointmentForm: React.FC<AddAppointmentFormProps> = ({ 
  onSave, 
  onCancel, 
  initialTime, 
  currentDate,
  patients = []
}) => {
  const [patientName, setPatientName] = useState('');
  const [type, setType] = useState<AppointmentType>(AppointmentType.CONSULTATION);
  const [timeStr, setTimeStr] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialTime) {
      const h = initialTime.hour.toString().padStart(2, '0');
      const m = initialTime.minute.toString().padStart(2, '0');
      setTimeStr(`${h}:${m}`);
    }
  }, [initialTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const startTime = new Date(currentDate);
    startTime.setHours(hours, minutes, 0, 0);

    onSave({
      patientName,
      type,
      startTime,
      durationMinutes: duration,
      notes
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-8">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-2xl font-bold text-gray-900">Add New Appointment</h3>
        <p className="text-sm text-gray-500 mt-1">Fill in the details to schedule a new patient appointment</p>
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Patient Name</label>
        {patients.length > 0 ? (
          <select
            required
            value={patientName}
            onChange={e => setPatientName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base bg-white"
          >
            <option value="">Select a patient</option>
            {patients.map(patient => (
              <option key={patient.id} value={`${patient.firstName} ${patient.lastName}`}>
                {patient.firstName} {patient.lastName} - {patient.diagnosis}
              </option>
            ))}
          </select>
        ) : (
          <input
            required
            type="text"
            value={patientName}
            onChange={e => setPatientName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
            placeholder="e.g. John Doe"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
          <input
            required
            type="time"
            value={timeStr}
            onChange={e => setTimeStr(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</label>
          <input
            required
            type="number"
            min="15"
            step="15"
            value={duration}
            onChange={e => setDuration(parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Appointment Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as AppointmentType)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-base"
        >
          {Object.values(AppointmentType).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-28 resize-none text-base"
          placeholder="Add any additional notes or special instructions..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
        >
          Save Appointment
        </button>
      </div>
    </form>
  );
};

export const SchedulingCalendarModal: React.FC<SchedulingCalendarModalProps> = ({ isOpen, onClose, patients = [] }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ hour: number; minute: number } | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (isOpen && patients.length > 0) {
      // Convert patient data to appointments with times between 9 AM - 5 PM
      const today = new Date();
      const generatedAppointments: Appointment[] = patients.slice(0, 8).map((patient, index) => {
        // Distribute appointments evenly throughout the day (9 AM - 4:30 PM)
        // 8 patients over 7.5 hours = roughly every hour
        const hour = 9 + index;
        const minute = 0;
        
        // Ensure we don't go past 5 PM
        const appointmentHour = Math.min(hour, 16); // Max 4 PM for 60-min appointments
        
        const startTime = new Date(today);
        startTime.setHours(appointmentHour, minute, 0, 0);
        
        // Map patient status to appointment type
        let type = AppointmentType.CONSULTATION;
        if (patient.status === 'Critical') type = AppointmentType.EMERGENCY;
        else if (patient.status === 'Recovering') type = AppointmentType.FOLLOW_UP;
        else if (patient.status === 'Stable') type = AppointmentType.CHECKUP;
        
        // Critical patients get 60 min, others get 30 min
        const duration = patient.status === 'Critical' ? 60 : 30;
        
        return {
          id: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          type,
          startTime,
          durationMinutes: duration,
          notes: patient.diagnosis
        };
      });
      
      setAppointments(generatedAppointments);
      setShowAddForm(false);
    }
  }, [isOpen, patients]);

  const handleTimeSlotClick = (hour: number) => {
    setSelectedSlot({ hour, minute: 0 });
    setShowAddForm(true);
  };

  const handleSaveAppointment = (newApt: Omit<Appointment, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAppointments([...appointments, { ...newApt, id }]);
    setShowAddForm(false);
  };

  const handleAppointmentClick = (apt: Appointment) => {
    alert(`Patient: ${apt.patientName}\nTime: ${apt.startTime.toLocaleTimeString()}\nNotes: ${apt.notes || 'N/A'}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] sm:max-w-[90vw] sm:max-h-[90vh] lg:max-w-[1200px] lg:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-16 sm:h-20 border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 bg-gradient-to-r from-blue-50 to-white shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">{appointments.length} appointments scheduled</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Calendar Content */}
        <div className="flex-1 overflow-hidden flex bg-slate-50">
          {showAddForm ? (
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white m-3 sm:m-6 rounded-lg shadow-sm border border-slate-200">
              <AddAppointmentForm
                onSave={handleSaveAppointment}
                onCancel={() => setShowAddForm(false)}
                initialTime={selectedSlot}
                currentDate={currentDate}
                patients={patients}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden bg-white m-3 sm:m-6 rounded-lg shadow-sm border border-slate-200">
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="flex relative">
                  {/* Time Labels Column */}
                  <div className="w-16 sm:w-20 lg:w-24 flex-shrink-0 bg-slate-50 border-r border-slate-200">
                    <div className="h-4"></div>
                    {TIME_SLOTS.map((slot, index) => {
                      const isHourMark = slot.hour % 1 === 0;
                      return (
                        <div 
                          key={index} 
                          className="relative text-right pr-2 sm:pr-3 lg:pr-4"
                          style={{ height: `${PIXELS_PER_HOUR / 2}px` }}
                        >
                          <div className={`absolute -top-2 right-2 sm:right-3 lg:right-4 ${isHourMark ? 'text-xs sm:text-sm font-bold text-slate-700' : 'text-[10px] sm:text-xs font-medium text-slate-400'}`}>
                            <span>{slot.label.split(' ')[0]}</span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 ml-0.5">{slot.label.split(' ')[1]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid Area */}
                  <div className="flex-1 relative pt-4 px-3 sm:px-4 lg:px-6 pb-10">
                    {/* Horizontal Grid Lines - Hour Markers Only */}
                    {TIME_SLOTS.map((slot, index) => {
                      const isHourMark = slot.hour % 1 === 0;
                      if (!isHourMark) return null;
                      
                      const topPosition = index * (PIXELS_PER_HOUR / 2) + 16;
                      
                      return (
                        <div 
                          key={index} 
                          className="w-full absolute left-0 group border-t border-slate-200"
                          style={{ top: `${topPosition}px` }}
                        >
                          <div 
                            onClick={() => {
                              setSelectedSlot({ hour: Math.floor(slot.hour), minute: 0 });
                              setShowAddForm(true);
                            }}
                            className="absolute w-full h-12 -mt-6 z-0 cursor-pointer hover:bg-blue-50/20 transition-colors"
                          ></div>
                        </div>
                      );
                    })}

                    {/* Current Time Line */}
                    <CurrentTimeIndicator />

                    {/* Events Layer */}
                    <div className="relative w-full">
                      {appointments.map(apt => (
                        <AppointmentCard 
                          key={apt.id} 
                          appointment={apt} 
                          onClick={handleAppointmentClick}
                        />
                      ))}
                    </div>
                    
                    <div 
                      className="absolute inset-0 z-0 pointer-events-none" 
                      style={{ height: `${TIME_SLOTS.length * (PIXELS_PER_HOUR / 2)}px` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
