import React, { useState, useRef } from 'react';
import { Patient } from './types';
import { STATUS_COLORS } from './constants';
import {
  ArrowLeft, User, Activity, FileText, MessageSquare, ZoomIn, X,
  ChevronRight, ChevronLeft, Clock, AlertCircle, CheckCircle
} from 'lucide-react';

interface PatientDetailPageProps {
  patient: Patient;
  onBack: () => void;
  onOpenChat: () => void;
}

export const PatientDetailPage: React.FC<PatientDetailPageProps> = ({ patient, onBack, onOpenChat }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const documents = patient.pre_consultation?.documents || [];
  const symptoms = patient.symptoms || [];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="h-screen bg-[#F8FAFC] font-sans flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex-shrink-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{patient.name}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">{patient.id}</span>
              <span>•</span>
              <span className="font-medium">{patient.diagnosis}</span>
            </div>
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-sm font-semibold border shadow-sm ${STATUS_COLORS[patient.status || 'Stable']}`}>
          {patient.status || 'Stable'}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex-1 overflow-y-auto pb-12">
        <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Summary Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center uppercase tracking-wide">
                <User className="mr-2 text-indigo-500" size={18} />
                Clinical Summary
              </h2>
              <div className="flex items-center text-xs text-slate-400">
                <Clock size={14} className="mr-1" />
                Last Updated: {patient.lastVisit}
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 scrollbar-hide">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Age / Gender</label>
                  <p className="text-slate-800 font-semibold">{patient.age} yrs, {patient.gender}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Occupation</label>
                  <p className="text-slate-800 font-semibold">{patient.occupation || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Last Visit</label>
                  <p className="text-slate-800 font-semibold">{patient.lastVisit}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact</label>
                  <p className="text-slate-800 font-semibold truncate">{patient.contact?.phone || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  <Activity size={14} className="mr-1.5" /> Presenting Complaint
                </label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-lg font-medium text-slate-800 mb-2">{patient.diagnosis}</p>
                  <div className="flex flex-wrap gap-2">
                    {symptoms.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600 shadow-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {patient.medical_history && (
                <div>
                  <label className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Medical History
                  </label>
                  <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 ml-1">
                    {patient.medical_history.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="flex items-center text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></div>
                  Summary Note
                </label>
                <div className="text-slate-600 text-sm leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                  {patient.notes || patient.description || "No specific notes available for this patient."}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Entry Card */}
          <div
            onClick={onOpenChat}
            className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all flex flex-col"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <h2 className="text-base font-bold text-slate-800 flex items-center">
                <MessageSquare className="mr-2 text-indigo-500" size={18} />
                Pre-Consultation
              </h2>
              <div className="p-1.5 bg-slate-50 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600" />
              </div>
            </div>

            <div className="flex-grow bg-slate-50/50 p-6 relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
              <div className="space-y-4 opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out text-sm">
                <div className="flex justify-end mb-2">
                  <div className="bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tr-none shadow-sm max-w-[95%] p-3 text-xs md:text-sm">
                    <p className="mb-3 font-medium">Done. I filled out the form.</p>
                    <div className="bg-slate-50 rounded-xl p-3 text-slate-800 shadow-sm border border-slate-200">
                      <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
                        <CheckCircle size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">Intake Form Submitted</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Full Name</span>
                          <span className="font-semibold text-xs text-slate-700">Marcus Thorne Elias</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">DOB</span>
                          <span className="font-semibold text-xs text-slate-700">1978-08-14</span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Chief Complaint</span>
                        <div className="bg-amber-50 text-amber-900 border border-amber-100 px-2 py-1.5 rounded-lg text-xs font-medium">
                          Jaundice (yellow eyes) and severe itching
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm max-w-[90%] text-xs md:text-sm text-slate-600">
                    <p>Thanks, Marcus. Your profile is updated...</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <button className="bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-800 font-semibold px-6 py-2.5 rounded-full shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 hover:bg-blue-600 hover:text-white hover:border-blue-600">
                  View Chat History <ArrowLeft size={16} className="rotate-180" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center">
              <span>{patient.pre_consultation?.chat.length || 0} messages</span>
              <span className="flex items-center text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                Completed
              </span>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center uppercase tracking-wide">
              <FileText className="mr-2 text-indigo-500" size={18} />
              Documents & Attachments
            </h2>
            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
              {documents.length} Files
            </span>
          </div>

          <div className="p-6 relative group/carousel">
            {documents && documents.length > 0 ? (
              <>
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-2 rounded-full shadow-lg border border-slate-100 text-slate-500 hover:text-indigo-600 hover:scale-110 transition-all opacity-0 group-hover/carousel:opacity-100"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-2 rounded-full shadow-lg border border-slate-100 text-slate-500 hover:text-indigo-600 hover:scale-110 transition-all opacity-0 group-hover/carousel:opacity-100"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={20} />
                </button>
                <div
                  ref={scrollContainerRef}
                  className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x scroll-smooth"
                >
                  {documents.map((img, idx) => (
                    <div
                      key={idx}
                      className="snap-start group relative flex-shrink-0 w-56 h-40 bg-slate-50 rounded-xl overflow-hidden cursor-pointer border border-slate-200 hover:border-indigo-400 transition-all shadow-sm hover:shadow-md"
                      onClick={() => setZoomedImage(img)}
                    >
                      <img
                        src={img}
                        alt={`Document ${idx + 1}`}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                        <div className="bg-white text-slate-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg">
                          <ZoomIn size={18} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full h-32 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <AlertCircle size={24} className="mb-2 opacity-50" />
                <span className="text-sm font-medium">No documents uploaded yet.</span>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200 p-4">
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
          >
            <X size={28} />
          </button>
          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={() => setZoomedImage(null)}
          >
            <img
              src={zoomedImage}
              alt="Zoomed Detail"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
