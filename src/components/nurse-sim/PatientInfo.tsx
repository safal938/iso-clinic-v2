import React, { useState } from 'react';
import { 
  FileText, ChevronRight, ChevronLeft, Maximize2,
  Download, X, MessageSquare
} from 'lucide-react';
import { Patient } from '../../types/nurse-sim';
import patientInfoData from '../../data/nurse-sim/patient_info_data.json';
import { SummaryTab } from './patientInfo/SummaryTab';
import { ReferralTab } from './patientInfo/ReferralTab';
import { HistoryTab } from './patientInfo/HistoryTab';
import { ChatTab } from './patientInfo/ChatTab';
import { ContactTab } from './patientInfo/ContactTab';
import { DocumentThumbnail, FullDocumentView } from './patientInfo/SharedComponents';

// Mock data generator
const getPatientDetails = (patient: Patient) => {
  const details = patientInfoData.patientDetails;
  
  return {
    occupation: details.occupation,
    contact: details.contact,
    lastVisit: details.lastVisit,
    tags: details.chief_complaint?.split(' ').map(s => s.replace(/[()&.,]/g, '').trim()).filter(s => s.length > 2) || [],
    medicalHistory: details.medicalHistory,
    summary: details.summary,
    dob: details.dob,
    referral: {
      referredBy: details.referral.referredBy,
      previousProvider: details.referral.previousProvider,
      referralDate: details.referral.referralDate
    },
    preConsultation: {
      messageCount: details.preConsultation.messageCount,
      status: details.preConsultation.status
    },
    chief_complaint: details.chief_complaint,
    fullName: `${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`.trim(),
    address: details.contact,
    email: details.contact,
    nextOfKin: { name: 'N/A', relation: 'N/A', phone: 'N/A' },
    insurance: { provider: 'NHS', policyNumber: 'N/A', status: 'Active' },
    clinicalImpression: details.summary,
    alerts: []
  };
};

interface PatientInfoProps {
  patient: Patient;
}

export const PatientInfo: React.FC<PatientInfoProps> = ({ patient }) => {
  const details = getPatientDetails(patient);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'referral' | 'history' | 'chat' | 'contact'>('summary');
  const [documents] = useState(patientInfoData.documents);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  const selectedDoc = selectedIndex !== null ? documents[selectedIndex] : null;
  
  // Use chat data from patient or fallback to pre_consultation_chat.json
  const chatHistory = patient.pre_consultation?.chat || [];

  // Reset scroll position when tab changes
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex !== null && selectedIndex < documents.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const closeLightbox = () => setSelectedIndex(null);

  const tabs = [
    { id: 'summary' as const, label: 'Patient summary' },
    { id: 'referral' as const, label: 'Referral letter' },
    { id: 'history' as const, label: 'Medical history' },
    { id: 'chat' as const, label: 'Pre consultation chat' },
    { id: 'contact' as const, label: 'Patient contact' }
  ];

  return (
    <>
      {/* Lightbox Modal for Documents */}
      {selectedDoc && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={closeLightbox}
        >
          {selectedIndex !== null && selectedIndex > 0 && (
             <button 
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
             >
                <ChevronLeft size={48} strokeWidth={1} />
             </button>
          )}
          {selectedIndex !== null && selectedIndex < documents.length - 1 && (
             <button 
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
             >
                <ChevronRight size={48} strokeWidth={1} />
             </button>
          )}

          <div className="w-full h-full flex flex-col relative">
            <div className="flex items-center justify-between px-6 py-4 bg-transparent absolute top-0 left-0 right-0 z-50 pointer-events-none">
               <div onClick={e => e.stopPropagation()} className="flex items-center gap-4 pointer-events-auto bg-black/50 backdrop-blur-md p-2 pl-3 pr-4 rounded-full border border-white/10">
                  <div className={`p-2 rounded-full ${
                     selectedDoc.type === 'image' || selectedDoc.type === 'app' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/20 text-white'
                  }`}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{selectedDoc.title}</h3>
                    <p className="text-xs text-white/60">{selectedDoc.date} • {selectedDoc.source}</p>
                  </div>
               </div>
               
               <div onClick={e => e.stopPropagation()} className="flex gap-2 pointer-events-auto">
                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full text-white/80 font-medium transition-colors text-sm border border-white/10 bg-black/50 backdrop-blur-md">
                     <Download size={16} /> <span className="hidden sm:inline">Download</span>
                  </button>
                  <button 
                    onClick={closeLightbox}
                    className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full text-white/60 transition-colors border border-white/10 bg-black/50 backdrop-blur-md"
                  >
                     <X size={24} />
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-hidden flex items-center justify-center p-0 sm:p-4 md:p-12">
               <FullDocumentView doc={selectedDoc} />
            </div>
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 pointer-events-none">
               {documents.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2 h-2 rounded-full transition-all ${idx === selectedIndex ? 'bg-white scale-110' : 'bg-white/20'}`} 
                  />
               ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="bg-white border-b border-neutral-200 mb-5 rounded-md">
          <div className="flex gap-1 px-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-all relative rounded-t-lg ${
                  activeTab === tab.id
                    ? 'text-neutral-900 bg-neutral-50'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50/50'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0EA5E9] rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-2">
          {activeTab === 'summary' && <SummaryTab />}
          
          {activeTab === 'referral' && <ReferralTab onDocumentClick={setSelectedIndex} />}
          
          {activeTab === 'history' && <HistoryTab onDocumentClick={setSelectedIndex} />}
          
          {activeTab === 'chat' && <ChatTab chatHistory={chatHistory} onImageClick={setZoomedImage} />}
          
          {activeTab === 'contact' && <ContactTab patient={patient} details={details} />}
        </div>
      </div>

      {/* Zoom Modal for Chat Images */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
          >
            <X size={28} />
          </button>
          <div className="relative w-full h-full flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
            <img
              src={zoomedImage}
              alt="Zoomed Detail"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};
