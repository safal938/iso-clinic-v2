import React, { useState, useEffect } from 'react';
import { X, Calendar, Loader2, RefreshCw, Plus } from 'lucide-react';
import { TIME_SLOTS, PIXELS_PER_HOUR } from './constants';
import { Appointment, AppointmentType } from './types';
import { AppointmentCard } from './AppointmentCard';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { Patient } from '../../types/nurse-sim';
import { scheduleService } from '../../services/scheduling/scheduleService';

interface SchedulingCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients?: Patient[];
  clinicianId?: string; // e.g., "N0001" or "D0001"
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
                {patient.id} - {patient.firstName} {patient.lastName}
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

export const SchedulingCalendarModal: React.FC<SchedulingCalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  patients = [],
  clinicianId = 'N0001' // Default to nurse
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ hour: number; minute: number } | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [dropTargetSlot, setDropTargetSlot] = useState<{ hour: number; minute: number } | null>(null);
  const [dropTargetAppointment, setDropTargetAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load schedule from backend
  useEffect(() => {
    if (isOpen && clinicianId) {
      loadSchedule();
    }
  }, [isOpen, clinicianId]);

  const loadSchedule = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading schedule for:', clinicianId);
      const scheduleData = await scheduleService.getSchedule(clinicianId);
      
      console.log('📦 Raw backend data:', scheduleData);
      console.log('📊 Total slots from backend:', scheduleData.length);
      
      // Log all slots including empty ones
      scheduleData.forEach((slot, index) => {
        console.log(`  Slot ${index + 1}:`, {
          time: slot.time,
          patient: slot.patient,
          status: slot.status,
          isEmpty: !slot.patient || slot.patient === 'None'
        });
      });
      
      // Convert backend schedule to appointments
      const loadedAppointments: Appointment[] = scheduleData
        .filter(slot => {
          const hasPatient = slot.patient && slot.patient !== 'None';
          if (!hasPatient) {
            console.log(`  ⏭️  Filtering out empty slot at ${slot.time}`);
          }
          return hasPatient;
        })
        .map(slot => {
          const [hours, minutes] = slot.time.split(':').map(Number);
          const startTime = new Date(slot.date);
          startTime.setHours(hours, minutes, 0, 0);
          
          const appointment = {
            id: `${slot.clinician_id}-${slot.date}-${slot.time}`,
            patientId: slot.patient,
            patientName: slot.patient, // You might want to map this to actual patient names
            type: AppointmentType.CONSULTATION,
            startTime,
            durationMinutes: 30, // Default duration
            status: slot.status as any,
          };
          
          console.log(`  ✅ Created appointment:`, {
            id: appointment.id,
            patient: appointment.patientId,
            time: slot.time
          });
          
          return appointment;
        });
      
      console.log('📋 Final appointments to display:', loadedAppointments.length);
      console.log('📋 Appointment IDs:', loadedAppointments.map(a => a.id));
      
      setAppointments(loadedAppointments);
    } catch (err) {
      console.error('❌ Failed to load schedule:', err);
      setError('Failed to load schedule. Using mock data.');
      // Fallback to generating from patients if available
      if (patients.length > 0) {
        generateMockAppointments();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockAppointments = () => {
    const today = new Date();
    const generatedAppointments: Appointment[] = patients.slice(0, 8).map((patient, index) => {
      const hour = 9 + index;
      const minute = 0;
      const appointmentHour = Math.min(hour, 16);
      
      const startTime = new Date(today);
      startTime.setHours(appointmentHour, minute, 0, 0);
      
      let type = AppointmentType.CONSULTATION;
      if (patient.status === 'Critical') type = AppointmentType.EMERGENCY;
      else if (patient.status === 'Recovering') type = AppointmentType.FOLLOW_UP;
      else if (patient.status === 'Stable') type = AppointmentType.CHECKUP;
      
      const duration = patient.status === 'Critical' ? 60 : 30;
      
      return {
        id: patient.id,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        type,
        startTime,
        durationMinutes: duration,
        notes: patient.diagnosis,
        status: 'scheduled',
      };
    });
    
    setAppointments(generatedAppointments);
  };

  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const formatTimeForAPI = (date: Date): string => {
    const hours = date.getHours().toString(); // No padding for hours
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleDragStart = (apt: Appointment) => {
    setDraggedAppointment(apt);
  };

  const handleDragEnd = () => {
    setDraggedAppointment(null);
    setDropTargetSlot(null);
    setDropTargetAppointment(null);
  };

  const handleDropOnCard = async (targetAppointment: Appointment) => {
    if (!draggedAppointment || draggedAppointment.id === targetAppointment.id) {
      return;
    }

    // Swap the two appointments
    setIsLoading(true);
    setError(null);

    try {
      if (!draggedAppointment.patientId || !targetAppointment.patientId) {
        throw new Error('Patient IDs are required for swapping');
      }

      await scheduleService.switchSlots({
        clinician_id: clinicianId,
        item1: {
          date: formatDateForAPI(targetAppointment.startTime),
          time: formatTimeForAPI(targetAppointment.startTime),
          patient: draggedAppointment.patientId,
        },
        item2: {
          date: formatDateForAPI(draggedAppointment.startTime),
          time: formatTimeForAPI(draggedAppointment.startTime),
          patient: targetAppointment.patientId,
        },
      });

      // Update local state - swap the start times
      setAppointments(prev => prev.map(apt => {
        if (apt.id === draggedAppointment.id) {
          return { ...apt, startTime: targetAppointment.startTime };
        }
        if (apt.id === targetAppointment.id) {
          return { ...apt, startTime: draggedAppointment.startTime };
        }
        return apt;
      }));
    } catch (err) {
      console.error('Failed to swap appointments:', err);
      setError('Failed to swap appointments. Please try again.');
      await loadSchedule();
    } finally {
      setIsLoading(false);
      setDraggedAppointment(null);
      setDropTargetAppointment(null);
    }
  };

  const handleDrop = async (targetHour: number, targetMinute: number) => {
    if (!draggedAppointment) return;

    const newStartTime = new Date(currentDate);
    newStartTime.setHours(targetHour, targetMinute, 0, 0);

    // Check if there's an appointment at the target slot
    const targetAppointment = appointments.find(apt => {
      if (apt.id === draggedAppointment.id) return false; // Don't match self
      const aptHour = apt.startTime.getHours();
      const aptMinute = apt.startTime.getMinutes();
      return aptHour === targetHour && aptMinute === targetMinute;
    });

    setIsLoading(true);
    setError(null);

    try {
      if (targetAppointment) {
        // Ask user: Swap or Insert?
        const shouldInsert = window.confirm(
          `There's already an appointment at ${formatTimeForAPI(newStartTime)}.\n\n` +
          `Click OK to INSERT and shift later appointments forward.\n` +
          `Click Cancel to SWAP with the existing appointment.`
        );

        if (shouldInsert) {
          // INSERT MODE: Shift all appointments from target time forward
          await handleInsertAndShift(draggedAppointment, newStartTime);
        } else {
          // SWAP MODE: Just swap the two appointments
          await handleSwap(draggedAppointment, targetAppointment, newStartTime);
        }
      } else {
        // MOVE: Empty slot
        await handleMove(draggedAppointment, newStartTime);
      }
    } catch (err) {
      console.error('Failed to update schedule:', err);
      setError('Failed to update schedule. Please try again.');
      await loadSchedule();
    } finally {
      setIsLoading(false);
      setDraggedAppointment(null);
      setDropTargetSlot(null);
    }
  };

  const handleSwap = async (draggedApt: Appointment, targetApt: Appointment, newStartTime: Date) => {
    if (!draggedApt.patientId || !targetApt.patientId) {
      throw new Error('Patient IDs are required for swapping');
    }

    console.log('🔄 Swapping appointments:', {
      dragged: { patient: draggedApt.patientId, time: formatTimeForAPI(draggedApt.startTime) },
      target: { patient: targetApt.patientId, time: formatTimeForAPI(targetApt.startTime) }
    });

    await scheduleService.switchSlots({
      clinician_id: clinicianId,
      item1: {
        date: formatDateForAPI(newStartTime),
        time: formatTimeForAPI(newStartTime),
        patient: draggedApt.patientId,
      },
      item2: {
        date: formatDateForAPI(draggedApt.startTime),
        time: formatTimeForAPI(draggedApt.startTime),
        patient: targetApt.patientId,
      },
    });

    // Update local state - swap the start times and regenerate IDs
    const draggedNewId = `${clinicianId}-${formatDateForAPI(newStartTime)}-${formatTimeForAPI(newStartTime)}`;
    const targetNewId = `${clinicianId}-${formatDateForAPI(draggedApt.startTime)}-${formatTimeForAPI(draggedApt.startTime)}`;
    
    setAppointments(prev => prev.map(apt => {
      if (apt.id === draggedApt.id) {
        return { ...apt, id: draggedNewId, startTime: newStartTime };
      }
      if (apt.id === targetApt.id) {
        return { ...apt, id: targetNewId, startTime: draggedApt.startTime };
      }
      return apt;
    }));
  };

  const handleMove = async (draggedApt: Appointment, newStartTime: Date) => {
    if (!draggedApt.patientId) {
      throw new Error('Patient ID is required for moving');
    }

    console.log('📍 === MOVE OPERATION START ===');
    console.log('  Dragged appointment:', {
      id: draggedApt.id,
      patient: draggedApt.patientId,
      currentTime: formatTimeForAPI(draggedApt.startTime),
      currentDate: formatDateForAPI(draggedApt.startTime)
    });
    console.log('  Target:', {
      time: formatTimeForAPI(newStartTime),
      date: formatDateForAPI(newStartTime)
    });

    // Step 1: Place in new slot
    const newSlotRequest = {
      clinician_id: clinicianId,
      date: formatDateForAPI(newStartTime),
      time: formatTimeForAPI(newStartTime),
      patient: draggedApt.patientId,
    };
    console.log('  📤 API Call 1 - Place in new slot:', newSlotRequest);
    await scheduleService.updateSlot(newSlotRequest);
    console.log('  ✅ New slot updated');

    // Step 2: Clear the old slot
    const clearSlotRequest = {
      clinician_id: clinicianId,
      date: formatDateForAPI(draggedApt.startTime),
      time: formatTimeForAPI(draggedApt.startTime),
      patient: 'None',
    };
    console.log('  📤 API Call 2 - Clear old slot:', clearSlotRequest);
    await scheduleService.updateSlot(clearSlotRequest);
    console.log('  ✅ Old slot cleared');

    // Update local state - generate new ID based on new time
    const newId = `${clinicianId}-${formatDateForAPI(newStartTime)}-${formatTimeForAPI(newStartTime)}`;
    console.log('  🔄 Updating local state:');
    console.log('    Old ID:', draggedApt.id);
    console.log('    New ID:', newId);
    
    setAppointments(prev => {
      const updated = prev.map(apt => 
        apt.id === draggedApt.id 
          ? { ...apt, id: newId, startTime: newStartTime }
          : apt
      );
      console.log('  📋 Updated appointments:', updated.map(a => ({ id: a.id, patient: a.patientId, time: formatTimeForAPI(a.startTime) })));
      return updated;
    });
    
    console.log('📍 === MOVE OPERATION COMPLETE ===');
  };

  const handleInsertAndShift = async (draggedApt: Appointment, newStartTime: Date) => {
    if (!draggedApt.patientId) {
      throw new Error('Patient ID is required for inserting');
    }

    console.log('➡️ Inserting and shifting appointments');

    // Find all appointments at or after the target time (excluding the dragged one)
    const appointmentsToShift = appointments
      .filter(apt => apt.id !== draggedApt.id && apt.startTime >= newStartTime)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    console.log('📋 Appointments to shift:', appointmentsToShift.map(a => ({
      patient: a.patientId,
      time: formatTimeForAPI(a.startTime)
    })));

    // Calculate new times for shifted appointments
    const shiftedAppointments = appointmentsToShift.map((apt, index) => {
      const shiftAmount = (index + 1) * draggedApt.durationMinutes;
      const newTime = new Date(newStartTime.getTime() + shiftAmount * 60000);
      return { appointment: apt, newTime };
    });

    // Step 1: Clear the dragged appointment's old slot
    await scheduleService.updateSlot({
      clinician_id: clinicianId,
      date: formatDateForAPI(draggedApt.startTime),
      time: formatTimeForAPI(draggedApt.startTime),
      patient: 'None',
    });

    // Step 2: Move appointments in reverse order (from last to first) to avoid conflicts
    for (let i = shiftedAppointments.length - 1; i >= 0; i--) {
      const { appointment, newTime } = shiftedAppointments[i];
      
      if (!appointment.patientId) continue;

      console.log(`  Shifting ${appointment.patientId}: ${formatTimeForAPI(appointment.startTime)} → ${formatTimeForAPI(newTime)}`);

      // Move to new time
      await scheduleService.updateSlot({
        clinician_id: clinicianId,
        date: formatDateForAPI(newTime),
        time: formatTimeForAPI(newTime),
        patient: appointment.patientId,
      });

      // Clear old time (unless it's about to be filled by the next shift)
      const willBeFilled = i > 0 && shiftedAppointments[i - 1].newTime.getTime() === appointment.startTime.getTime();
      if (!willBeFilled && appointment.startTime.getTime() !== newStartTime.getTime()) {
        await scheduleService.updateSlot({
          clinician_id: clinicianId,
          date: formatDateForAPI(appointment.startTime),
          time: formatTimeForAPI(appointment.startTime),
          patient: 'None',
        });
      }
    }

    // Step 3: Place the dragged appointment in the target slot
    await scheduleService.updateSlot({
      clinician_id: clinicianId,
      date: formatDateForAPI(newStartTime),
      time: formatTimeForAPI(newStartTime),
      patient: draggedApt.patientId,
    });

    console.log('✅ Insert and shift complete');

    // Update local state - regenerate IDs for all moved appointments
    const draggedNewId = `${clinicianId}-${formatDateForAPI(newStartTime)}-${formatTimeForAPI(newStartTime)}`;
    
    setAppointments(prev => prev.map(apt => {
      if (apt.id === draggedApt.id) {
        return { ...apt, id: draggedNewId, startTime: newStartTime };
      }
      
      const shifted = shiftedAppointments.find(s => s.appointment.id === apt.id);
      if (shifted) {
        const newId = `${clinicianId}-${formatDateForAPI(shifted.newTime)}-${formatTimeForAPI(shifted.newTime)}`;
        return { ...apt, id: newId, startTime: shifted.newTime };
      }
      
      return apt;
    }));
  };

  const handleTimeSlotClick = (hour: number) => {
    if (!draggedAppointment) {
      setSelectedSlot({ hour, minute: 0 });
      setShowAddForm(true);
    }
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
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
              ) : (
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {appointments.length} appointments scheduled
                {clinicianId && ` • ${clinicianId}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedSlot({ hour: 9, minute: 0 });
                setShowAddForm(true);
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add new appointment"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
            <button
              onClick={() => {
                console.log('🔄 Manual reload triggered');
                loadSchedule();
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reload schedule from backend"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reload</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
                    {/* Horizontal Grid Lines - All Time Slots */}
                    {TIME_SLOTS.map((slot, index) => {
                      const isHourMark = slot.hour % 1 === 0;
                      const topPosition = index * (PIXELS_PER_HOUR / 2) + 16;
                      const slotHour = Math.floor(slot.hour);
                      const slotMinute = Math.round((slot.hour % 1) * 60);
                      const isDropTarget = dropTargetSlot?.hour === slotHour && dropTargetSlot?.minute === slotMinute;
                      
                      return (
                        <div 
                          key={index} 
                          className={`w-full absolute left-0 group ${isHourMark ? 'border-t border-slate-200' : 'border-t border-slate-100'}`}
                          style={{ top: `${topPosition}px` }}
                        >
                          <div 
                            onClick={() => {
                              if (!draggedAppointment) {
                                setSelectedSlot({ hour: slotHour, minute: slotMinute });
                                setShowAddForm(true);
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (draggedAppointment) {
                                setDropTargetSlot({ hour: slotHour, minute: slotMinute });
                              }
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDropTargetSlot(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDrop(slotHour, slotMinute);
                            }}
                            className={`absolute w-full h-12 -mt-6 transition-colors ${
                              draggedAppointment 
                                ? 'cursor-move hover:bg-blue-100/40 z-20' 
                                : 'cursor-pointer hover:bg-blue-50/20 z-0'
                            } ${isDropTarget ? 'bg-blue-200/50 border-2 border-dashed border-blue-400 z-20' : ''}`}
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
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onDropOnCard={handleDropOnCard}
                          onDragOverCard={(targetApt) => {
                            if (draggedAppointment && draggedAppointment.id !== targetApt.id) {
                              setDropTargetAppointment(targetApt);
                            }
                          }}
                          onDragLeaveCard={() => setDropTargetAppointment(null)}
                          isDragging={draggedAppointment?.id === apt.id}
                          isDropTarget={dropTargetAppointment?.id === apt.id}
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
