import React from 'react';
import { 
  User, Calendar, Mail, Phone, AlertCircle, History, 
  CheckCircle, FileText, Clock, Stethoscope, Paperclip,
  ImageIcon, ZoomIn
} from 'lucide-react';
import { ChatMessage } from '../../../types/nurse-sim';
import preConsultationChatData from '../../../data/nurse-sim/pre_consultation_chat.json';
import { ImageWithFallback } from './SharedComponents';

interface ChatTabProps {
  chatHistory?: ChatMessage[];
  onImageClick: (image: string) => void;
}

const getSection = (index: number, msg: ChatMessage): { label: string; icon: React.ElementType } | null => {
  if (msg.object?.availableSlots) return { label: "Appointment Booking", icon: Calendar };
  const text = msg.message?.toLowerCase() || "";
  if (text.includes("upload the screenshots") || text.includes("recent lab results")) {
    return { label: "Medical Records Upload", icon: Paperclip };
  }
  if (index === 0) return { label: "Patient Intake", icon: User };
  return null;
};

export const ChatTab: React.FC<ChatTabProps> = ({ chatHistory, onImageClick }) => {
  const messages = chatHistory && chatHistory.length > 0 ? chatHistory : (preConsultationChatData as ChatMessage[]);

  const medicalHistoryStartIndex = messages.findIndex(m =>
    m.message?.toLowerCase().includes("upload the screenshots") ||
    m.message?.toLowerCase().includes("recent lab results")
  );

  const medicalHistoryImages = messages
    .slice(medicalHistoryStartIndex > -1 ? medicalHistoryStartIndex : messages.length)
    .filter(m => m.attachment)
    .map(m => m.attachment as string);

  if (messages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden p-12 text-center">
          <FileText size={48} className="mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-600 mb-2">No Chat History</h3>
          <p className="text-sm text-neutral-400">Pre-consultation chat messages will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative">
        <div className="absolute left-[24px] top-4 bottom-0 w-[3px] bg-neutral-200/80 z-0 rounded-full"></div>
        <div className="w-full space-y-6">
          {messages.map((msg, index) => {
            const isAdmin = msg.role === 'admin';
            const section = getSection(index, msg);

            return (
              <div key={index} className={`relative ${section ? 'pt-8' : ''}`}>
                {section && (
                  <div className="relative flex items-center mb-10 z-10">
                    <div className="w-14 h-14 rounded-2xl bg-[#0EA5E9] shadow-lg shadow-blue-600/20 flex items-center justify-center text-white border-4 border-white z-10">
                      <section.icon size={24} />
                    </div>
                    <div className="flex-grow ml-4 border-b-2 border-neutral-200/60 pb-2 flex justify-between items-end">
                      <h3 className="text-lg font-bold text-neutral-800 uppercase tracking-tight">{section.label}</h3>
                      <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-1">
                        Step {index === 0 ? 1 : index > 10 ? 3 : 2}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pl-[60px]">
                  <div className={`flex w-full items-start gap-3 ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                    {isAdmin && (
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-neutral-200 border-2 border-white shadow-sm flex items-center justify-center">
                        <Stethoscope size={16} className="text-neutral-600" />
                      </div>
                    )}

                    <div
                      className={`relative max-w-[100%] md:max-w-[85%] p-5 shadow-sm text-sm md:text-base transition-all ${
                        isAdmin
                          ? 'bg-white rounded-2xl rounded-tl-none text-neutral-700 border border-neutral-100 shadow-sm'
                          : 'bg-[#0EA5E9] rounded-2xl rounded-tr-none text-white shadow-md shadow-blue-600/20'
                      }`}
                    >
                      {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                      {msg.attachment && (
                        <ImageWithFallback src={msg.attachment} alt="Attachment" onClick={() => onImageClick(msg.attachment || '')} />
                      )}

                      {msg.object && (
                        <div className="mt-4 w-full text-left">
                          {/* Empty Form Request */}
                          {msg.object.formType === 'emptyRequest' && (
                            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                              <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center gap-2">
                                <div className="bg-white p-1.5 rounded-lg border border-indigo-100 shadow-sm text-indigo-600">
                                  <FileText size={16} />
                                </div>
                                <span className="font-bold text-indigo-900 text-sm uppercase tracking-wide">Intake Form Requested</span>
                              </div>
                              <div className="p-4 grid grid-cols-1 gap-y-4">
                                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
                                  <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                      <User size={10} /> Full Name
                                    </p>
                                    <div className="h-8 bg-neutral-50 border border-neutral-200 rounded-lg w-full"></div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                      <Calendar size={10} /> DOB
                                    </p>
                                    <div className="h-8 bg-neutral-50 border border-neutral-200 rounded-lg w-full"></div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
                                  <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                      <Mail size={10} /> Email
                                    </p>
                                    <div className="h-8 bg-neutral-50 border border-neutral-200 rounded-lg w-full"></div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                      <Phone size={10} /> Phone
                                    </p>
                                    <div className="h-8 bg-neutral-50 border border-neutral-200 rounded-lg w-full"></div>
                                  </div>
                                </div>
                                <div className="pb-4 border-b border-neutral-100">
                                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <AlertCircle size={10} /> Chief Complaint
                                  </p>
                                  <div className="h-16 bg-neutral-50 border border-neutral-200 rounded-lg w-full"></div>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <History size={10} /> Medical History
                                  </p>
                                  <div className="h-8 bg-neutral-50 border border-neutral-200 rounded-lg w-3/4"></div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Filled Form Response */}
                          {msg.object.formType === 'filledResponse' && (
                            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden text-left">
                              <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 flex items-center gap-2">
                                <div className="bg-white p-1.5 rounded-lg border border-neutral-200 shadow-sm">
                                  <CheckCircle size={16} className="text-emerald-500" />
                                </div>
                                <span className="font-bold text-neutral-700 text-sm uppercase tracking-wide">Intake Form Submitted</span>
                              </div>
                              <div className="p-4 grid grid-cols-1 gap-y-4">
                                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
                                  <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                      <User size={10} /> Full Name
                                    </p>
                                    <p className="font-semibold text-neutral-800 text-sm">{msg.object.firstName} {msg.object.lastName}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                      <Calendar size={10} /> DOB
                                    </p>
                                    <p className="font-semibold text-neutral-800 text-sm">{msg.object.dob}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
                                  <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                      <Mail size={10} /> Email
                                    </p>
                                    <p className="font-semibold text-neutral-800 text-sm truncate" title={msg.object.email}>{msg.object.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                      <Phone size={10} /> Phone
                                    </p>
                                    <p className="font-semibold text-neutral-800 text-sm">{msg.object.phone}</p>
                                  </div>
                                </div>
                                <div className="pb-4 border-b border-neutral-100">
                                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <AlertCircle size={10} /> Chief Complaint
                                  </p>
                                  <p className="font-medium text-neutral-800 text-sm bg-amber-50 border border-amber-100 p-2 rounded-lg">
                                    {msg.object.complaint}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <History size={10} /> Medical History
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {msg.object.medicalHistory?.map((h, i) => (
                                      <span key={i} className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-1 rounded-md border border-neutral-200">
                                        {h}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Available Slots */}
                          {msg.object.availableSlots && (
                            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                              <div className="bg-gradient-to-r from-neutral-50 to-white px-5 py-4 border-b border-neutral-100">
                                <h4 className="font-bold text-neutral-800">Select an Appointment</h4>
                                <p className="text-xs text-neutral-500 mt-0.5">Dr. A. Gupta • Hepatology • Urgent</p>
                              </div>
                              <div className="p-2 bg-neutral-50/50">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  {msg.object.availableSlots.map((slot: any) => (
                                    <button key={slot.slotId} className="relative flex flex-col items-center justify-center bg-white p-3 rounded-xl border-2 border-neutral-100 hover:border-primary hover:shadow-md transition-all group text-center">
                                      <span className="text-xs font-bold text-neutral-400 mb-1">{slot.date}</span>
                                      <span className="text-lg font-bold text-neutral-800 group-hover:text-primary">{slot.time}</span>
                                      <div className="mt-2 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded group-hover:bg-primary/10 group-hover:text-primary">
                                        Available
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Appointment Confirmation */}
                          {msg.object.appointmentId && (
                            <div className="relative bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
                              <div className="p-5 pl-7">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-600">
                                    <CheckCircle size={16} />
                                  </div>
                                  <span className="font-bold text-emerald-700 text-sm uppercase tracking-wide">Confirmed</span>
                                </div>
                                <div className="flex flex-col gap-1 mb-4">
                                  <h2 className="text-xl font-bold text-neutral-800">{msg.object.schedule?.provider}</h2>
                                  <p className="text-sm text-neutral-500">{msg.object.schedule?.location}</p>
                                </div>
                                <div className="flex items-center gap-4 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                                  <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-neutral-400" />
                                    <span className="font-semibold text-neutral-700 text-sm">{msg.object.schedule?.date}</span>
                                  </div>
                                  <div className="w-px h-4 bg-neutral-300"></div>
                                  <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-neutral-400" />
                                    <span className="font-semibold text-neutral-700 text-sm">{msg.object.schedule?.time}</span>
                                  </div>
                                </div>
                                <div className="mt-3 text-xs text-neutral-400 bg-white border border-neutral-100 px-3 py-2 rounded-lg italic">
                                  Note: {msg.object.schedule?.instructions}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {!isAdmin && (
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 border-2 border-white shadow-sm flex items-center justify-center">
                        <User size={16} className="text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Documents Summary Section */}
          {medicalHistoryImages.length > 0 && (
            <div className="relative pt-12">
              <div className="relative flex items-center mb-10 z-10">
                <div className="w-14 h-14 rounded-2xl bg-neutral-800 shadow-lg shadow-neutral-300 flex items-center justify-center text-white border-4 border-white z-10">
                  <FileText size={24} />
                </div>
                <div className="flex-grow ml-4 border-b-2 border-neutral-200/60 pb-2 flex justify-between items-end">
                  <h3 className="text-lg font-bold text-neutral-800 uppercase tracking-tight">Documents & Reports</h3>
                  <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-1">Summary</span>
                </div>
              </div>
              <div className="pl-[60px]">
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                  <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wide mb-4">
                    Uploaded Files ({medicalHistoryImages.length})
                  </h4>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                    {medicalHistoryImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => onImageClick(img)}
                        className="snap-start flex-shrink-0 w-40 h-40 bg-neutral-50 rounded-2xl overflow-hidden border border-neutral-200 shadow-sm cursor-pointer hover:shadow-md hover:border-primary transition-all relative group"
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
                        <div className="hidden absolute inset-0 flex-col items-center justify-center text-neutral-400 p-2 text-center bg-white">
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
  );
};
