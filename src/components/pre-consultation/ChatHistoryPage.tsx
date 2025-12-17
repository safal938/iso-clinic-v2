import React, { useState } from 'react';
import { Patient, ChatMessage } from './types';
import {
  ArrowLeft, FileText, Calendar, CheckCircle, ZoomIn, X, ImageIcon,
  User, Clock, ChevronRight, Stethoscope, Paperclip, Mail, Phone, AlertCircle, History
} from 'lucide-react';

interface ChatHistoryPageProps {
  patient: Patient;
  onBack: () => void;
}

const ImageWithFallback = ({ src, alt, onClick }: { src: string; alt: string; onClick?: () => void }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full bg-white flex flex-col items-center justify-center text-slate-400 border border-slate-200 rounded-xl p-4 text-center min-h-[120px]">
        <ImageIcon size={24} className="mb-2 opacity-50" />
        <span className="text-xs font-medium text-slate-500">Image not found</span>
        <span className="text-[10px] font-mono mt-1 opacity-50 break-all select-all">{src}</span>
      </div>
    );
  }

  return (
    <div
      className="mt-2 rounded-xl overflow-hidden border border-black/5 cursor-pointer hover:opacity-90 transition-opacity bg-white min-h-[100px]"
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-contain max-h-72 bg-white"
        onError={() => setError(true)}
      />
    </div>
  );
};

export const ChatHistoryPage: React.FC<ChatHistoryPageProps> = ({ patient, onBack }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const chatHistory = patient.pre_consultation?.chat || [];

  const getSection = (index: number, msg: ChatMessage): { label: string; icon: React.ElementType } | null => {
    if (msg.object?.availableSlots) return { label: "Appointment Booking", icon: Calendar };
    const text = msg.message?.toLowerCase() || "";
    if (text.includes("upload the screenshots") || text.includes("recent lab results")) {
      return { label: "Medical Records Upload", icon: Paperclip };
    }
    if (index === 0) return { label: "Patient Intake", icon: User };
    return null;
  };

  const medicalHistoryStartIndex = chatHistory.findIndex(m =>
    m.message?.toLowerCase().includes("upload the screenshots") ||
    m.message?.toLowerCase().includes("recent lab results")
  );

  const medicalHistoryImages = chatHistory
    .slice(medicalHistoryStartIndex > -1 ? medicalHistoryStartIndex : chatHistory.length)
    .filter(m => m.attachment)
    .map(m => m.attachment as string);

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0 shadow-sm flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pre-Consultation Chat</h1>
          <p className="text-sm text-slate-500">History for {patient.name}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto w-full max-w-6xl mx-auto p-4 md:p-8 pb-32">
        <div className="relative">
          <div className="absolute left-[24px] top-4 bottom-0 w-[3px] bg-slate-200/80 z-0 rounded-full"></div>
          <div className="w-full space-y-6">
            {chatHistory.map((msg, index) => {
              const isAdmin = msg.role === 'admin';
              const section = getSection(index, msg);

              return (
                <div key={index} className={`relative ${section ? 'pt-8' : ''}`}>
                  {section && (
                    <div className="relative flex items-center mb-10 z-10">
                      <div className="w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 flex items-center justify-center text-white border-4 border-[#F8FAFC] z-10">
                        <section.icon size={24} />
                      </div>
                      <div className="flex-grow ml-4 border-b-2 border-slate-200/60 pb-2 flex justify-between items-end">
                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{section.label}</h3>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">
                          Step {index === 0 ? 1 : index > 10 ? 3 : 2}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pl-[60px]">
                    <div className={`flex w-full items-start gap-3 ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                      {isAdmin && (
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center">
                          <Stethoscope size={16} className="text-slate-600" />
                        </div>
                      )}

                      <div
                        className={`relative max-w-[100%] md:max-w-[85%] p-5 shadow-sm text-sm md:text-base transition-all ${
                          isAdmin
                            ? 'bg-white rounded-2xl rounded-tl-none text-slate-700 border border-slate-100 shadow-sm'
                            : 'bg-blue-600 rounded-2xl rounded-tr-none text-white shadow-md shadow-blue-200'
                        }`}
                      >
                        {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                        {msg.attachment && (
                          <ImageWithFallback src={msg.attachment} alt="Attachment" onClick={() => setZoomedImage(msg.attachment || null)} />
                        )}

                        {msg.object && (
                          <div className="mt-4 w-full text-left">
                            {msg.object.formType === 'emptyRequest' && (
                              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center gap-2">
                                  <div className="bg-white p-1.5 rounded-lg border border-indigo-100 shadow-sm text-indigo-600">
                                    <FileText size={16} />
                                  </div>
                                  <span className="font-bold text-indigo-900 text-sm uppercase tracking-wide">Intake Form Requested</span>
                                </div>
                                <div className="p-4 grid grid-cols-1 gap-y-4">
                                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <User size={10} /> Full Name
                                      </p>
                                      <div className="h-8 bg-slate-50 border border-slate-200 rounded-lg w-full"></div>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Calendar size={10} /> DOB
                                      </p>
                                      <div className="h-8 bg-slate-50 border border-slate-200 rounded-lg w-full"></div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Mail size={10} /> Email
                                      </p>
                                      <div className="h-8 bg-slate-50 border border-slate-200 rounded-lg w-full"></div>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Phone size={10} /> Phone
                                      </p>
                                      <div className="h-8 bg-slate-50 border border-slate-200 rounded-lg w-full"></div>
                                    </div>
                                  </div>
                                  <div className="pb-4 border-b border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                      <AlertCircle size={10} /> Chief Complaint
                                    </p>
                                    <div className="h-16 bg-slate-50 border border-slate-200 rounded-lg w-full"></div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                      <History size={10} /> Medical History
                                    </p>
                                    <div className="h-8 bg-slate-50 border border-slate-200 rounded-lg w-3/4"></div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {msg.object.formType === 'filledResponse' && (
                              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-left">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                                  <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                                    <CheckCircle size={16} className="text-emerald-500" />
                                  </div>
                                  <span className="font-bold text-slate-700 text-sm uppercase tracking-wide">Intake Form Submitted</span>
                                </div>
                                <div className="p-4 grid grid-cols-1 gap-y-4">
                                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                        <User size={10} /> Full Name
                                      </p>
                                      <p className="font-semibold text-slate-800 text-sm">{msg.object.firstName} {msg.object.lastName}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                        <Calendar size={10} /> DOB
                                      </p>
                                      <p className="font-semibold text-slate-800 text-sm">{msg.object.dob}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                        <Mail size={10} /> Email
                                      </p>
                                      <p className="font-semibold text-slate-800 text-sm truncate" title={msg.object.email}>{msg.object.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                        <Phone size={10} /> Phone
                                      </p>
                                      <p className="font-semibold text-slate-800 text-sm">{msg.object.phone}</p>
                                    </div>
                                  </div>
                                  <div className="pb-4 border-b border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                      <AlertCircle size={10} /> Chief Complaint
                                    </p>
                                    <p className="font-medium text-slate-800 text-sm bg-amber-50 border border-amber-100 p-2 rounded-lg">
                                      {msg.object.complaint}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                      <History size={10} /> Medical History
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {msg.object.medicalHistory?.map((h, i) => (
                                        <span key={i} className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                          {h}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {msg.object.availableSlots && (
                              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-4 border-b border-slate-100">
                                  <h4 className="font-bold text-slate-800">Select an Appointment</h4>
                                  <p className="text-xs text-slate-500 mt-0.5">Dr. A. Gupta • Hepatology • Urgent</p>
                                </div>
                                <div className="p-2 bg-slate-50/50">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {msg.object.availableSlots.map(slot => (
                                      <button key={slot.slotId} className="relative flex flex-col items-center justify-center bg-white p-3 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:shadow-md transition-all group text-center">
                                        <span className="text-xs font-bold text-slate-400 mb-1">{slot.date}</span>
                                        <span className="text-lg font-bold text-slate-800 group-hover:text-blue-600">{slot.time}</span>
                                        <div className="mt-2 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded group-hover:bg-blue-100 group-hover:text-blue-700">
                                          Available
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {msg.object.appointmentId && (
                              <div className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500"></div>
                                <div className="p-5 pl-7">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-600">
                                      <CheckCircle size={16} />
                                    </div>
                                    <span className="font-bold text-emerald-700 text-sm uppercase tracking-wide">Confirmed</span>
                                  </div>
                                  <div className="flex flex-col gap-1 mb-4">
                                    <h2 className="text-xl font-bold text-slate-800">{msg.object.schedule?.provider}</h2>
                                    <p className="text-sm text-slate-500">{msg.object.schedule?.location}</p>
                                  </div>
                                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2">
                                      <Calendar size={16} className="text-slate-400" />
                                      <span className="font-semibold text-slate-700 text-sm">{msg.object.schedule?.date}</span>
                                    </div>
                                    <div className="w-px h-4 bg-slate-300"></div>
                                    <div className="flex items-center gap-2">
                                      <Clock size={16} className="text-slate-400" />
                                      <span className="font-semibold text-slate-700 text-sm">{msg.object.schedule?.time}</span>
                                    </div>
                                  </div>
                                  <div className="mt-3 text-xs text-slate-400 bg-white border border-slate-100 px-3 py-2 rounded-lg italic">
                                    Note: {msg.object.schedule?.instructions}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {!isAdmin && (
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center">
                          <User size={16} className="text-blue-600" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {medicalHistoryImages.length > 0 && (
              <div className="relative pt-12">
                <div className="relative flex items-center mb-10 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 shadow-lg shadow-slate-300 flex items-center justify-center text-white border-4 border-[#F8FAFC] z-10">
                    <FileText size={24} />
                  </div>
                  <div className="flex-grow ml-4 border-b-2 border-slate-200/60 pb-2 flex justify-between items-end">
                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Documents & Reports</h3>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Summary</span>
                  </div>
                </div>
                <div className="pl-[60px]">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
                      Uploaded Files ({medicalHistoryImages.length})
                    </h4>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                      {medicalHistoryImages.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setZoomedImage(img)}
                          className="snap-start flex-shrink-0 w-40 h-40 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-400 transition-all relative group"
                        >
                          <img
                            src={img}
                            alt="Doc"
                            className="w-full h-full object-contain p-2 bg-white"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden absolute inset-0 flex-col items-center justify-center text-slate-400 p-2 text-center bg-white">
                            <ImageIcon size={24} />
                            <span className="text-[10px] mt-1">Preview Unavailable</span>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-200 p-4">
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
    </div>
  );
};
