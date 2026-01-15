import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Search, MoveLeftIcon } from 'lucide-react';
import { Header } from './Header';
import { PatientCard } from './PatientCard';
import { Pagination } from './Pagination';
import { ConsultationPage } from './ConsultationPage';
import { ConsultationPageShowcase } from './ConsultationPageShowcase';
import { MOCK_PATIENTS } from '../../constants/nurse-sim';
import { Patient } from '../../types/nurse-sim';

const ITEMS_PER_PAGE = 12;

// Patient List Page Component
const PatientListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPatients = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return MOCK_PATIENTS.filter((p) => {
      const fullName = `${p.firstName} ${p.middleName || ''} ${p.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.diagnosis.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);

  const currentPatients = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPatients.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredPatients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePatientSelect = (patient: Patient) => {
    navigate(`consultation/${patient.id}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col font-sans text-neutral-900">
      <Header />
      <main className="flex-1 w-[90%] max-w-[1920px] mx-auto py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 transition-colors"
          >
            <MoveLeftIcon size={20} />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
          <h1 className="text-2xl font-normal text-neutral-900 mb-1">Patient List</h1>
          <p className="text-neutral-600">Manage and view patient status updates.</p>
        </div>

        <div className="relative mb-10 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-white border border-border rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-none text-base"
            placeholder="Search by name, ID, or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPatients.length > 0 ? (
            currentPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onClick={handlePatientSelect}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center border border-dashed border-border rounded-lg bg-white">
              <p className="text-neutral-600">No patients found matching your search.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-primary hover:text-primary-hover font-medium text-sm"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {filteredPatients.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
            <div className="mt-6 text-center text-neutral-400 text-xs">
              <p>Showing {currentPatients.length} of {filteredPatients.length} patients</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Consultation Page Wrapper
const ConsultationPageWrapper: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const patient = MOCK_PATIENTS.find((p) => p.id === patientId);

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Patient not found</p>
          <button
            onClick={() => navigate('/nurse-sim')}
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Back to Patient List
          </button>
        </div>
      </div>
    );
  }

  return <ConsultationPage patient={patient} onBack={() => navigate('/nurse-sim')} />;
};

// Consultation Showcase Wrapper (Static Demo)
const ConsultationShowcaseWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <ConsultationPageShowcase onBack={() => navigate('/nurse-sim')} />;
};

const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<PatientListPage />} />
        <Route path="/consultation/:patientId" element={<ConsultationPageWrapper />} />
        <Route path="/consultation-showcase" element={<ConsultationShowcaseWrapper />} />
      </Routes>
    </>
  );
};

export default App;
