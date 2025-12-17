import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_PATIENTS } from './constants';
import { Patient } from './types';
import { SearchBar } from './SearchBar';
import { PatientList } from './PatientList';
import { PatientDetailPage } from './PatientDetailPage';
import { ChatHistoryPage } from './ChatHistoryPage';
import { Activity, ArrowLeft } from 'lucide-react';

export default function PreConsultationApp() {
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'detail' | 'chat-history'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const handleBackToClinic = () => {
    navigate('/');
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_PATIENTS;
    const lowerQuery = searchQuery.toLowerCase();
    return MOCK_PATIENTS.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.id.toLowerCase().includes(lowerQuery) ||
      p.diagnosis.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setView('detail');
    window.scrollTo(0, 0);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setView('list');
  };

  const handleOpenChat = () => {
    setView('chat-history');
    window.scrollTo(0, 0);
  };

  const handleBackToDetail = () => {
    setView('detail');
  };

  if (view === 'chat-history' && selectedPatient) {
    return <ChatHistoryPage patient={selectedPatient} onBack={handleBackToDetail} />;
  }

  if (view === 'detail' && selectedPatient) {
    return (
      <PatientDetailPage
        patient={selectedPatient}
        onBack={handleBackToList}
        onOpenChat={handleOpenChat}
      />
    );
  }

  return (
    <div className="h-screen bg-[#F1F5F9] text-slate-900 font-sans selection:bg-indigo-100 flex flex-col overflow-hidden">
      {/* Desktop Header */}
      <header className="px-6 py-5 items-center justify-between bg-white border-b border-slate-200 shadow-sm flex-shrink-0 z-30 hidden md:flex">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToClinic}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to Clinic</span>
          </button>
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Activity size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Medforce AI Clinic</span>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden px-4 py-4 flex items-center gap-3 bg-white border-b border-slate-200 flex-shrink-0 z-30">
        <button
          onClick={handleBackToClinic}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="p-1.5 bg-indigo-600 rounded text-white">
          <Activity size={16} />
        </div>
        <span className="font-bold text-lg text-slate-900">Pre-Consultation</span>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto w-[85%] mx-auto px-4 md:px-6">
        <div className="py-6 pb-12">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Patient List</h1>
          <p className="text-slate-500 mb-6">Manage and view patient status updates.</p>

          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <div className="mt-4">
            <PatientList
              patients={filteredPatients}
              isLoading={false}
              onPatientClick={handlePatientClick}
            />
          </div>
        </div>
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
