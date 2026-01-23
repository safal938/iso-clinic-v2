import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { SchedulingCalendarModal } from './SchedulingCalendarModal';

export const SchedulingDemo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [clinicianId, setClinicianId] = useState('N0001');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Clinic Schedule Manager
          </h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Clinician
              </label>
              <select
                value={clinicianId}
                onChange={(e) => setClinicianId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="N0001">Nurse N0001</option>
                <option value="N0002">Nurse N0002</option>
                <option value="D0001">Doctor D0001</option>
                <option value="D0002">Doctor D0002</option>
              </select>
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <Calendar className="w-5 h-5" />
              Open Schedule Calendar
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Drag and drop appointments to reorder</li>
                <li>• Swap appointments by dragging one onto another</li>
                <li>• Move appointments to empty time slots</li>
                <li>• Changes sync automatically with backend</li>
                <li>• Click appointments to view details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <SchedulingCalendarModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        clinicianId={clinicianId}
      />
    </div>
  );
};
