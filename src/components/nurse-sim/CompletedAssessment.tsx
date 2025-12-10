import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import assessmentData from '../../data/completed-assessment.json';

interface MessageHighlight {
  level: 'warning' | 'info';
  text: string;
}

interface Message {
  id: string;
  role: 'nurse' | 'patient';
  text: string;
  timestamp: string;
  highlights?: MessageHighlight[];
}

interface DifferentialDiagnosis {
  did: string;
  diagnosis: string;
  indicators_point: string[];
  indicators_count: number;
  probability: 'High' | 'Medium' | 'Low';
  rank: number;
}

interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  category: 'fixed' | 'dynamic';
  answer?: string;
}

// Helper to render text with highlights
const renderTextWithHighlights = (text: string, highlights?: MessageHighlight[]): React.ReactNode => {
  if (!highlights || highlights.length === 0) return text;
  const parts: { text: string; highlighted: boolean; level?: string }[] = [];
  let lastIndex = 0;
  const sortedHighlights = highlights
    .map(h => ({ ...h, index: text.toLowerCase().indexOf(h.text.toLowerCase()) }))
    .filter(h => h.index !== -1)
    .sort((a, b) => a.index - b.index);

  sortedHighlights.forEach(highlight => {
    const startIndex = text.toLowerCase().indexOf(highlight.text.toLowerCase(), lastIndex);
    if (startIndex === -1) return;
    if (startIndex > lastIndex) {
      parts.push({ text: text.slice(lastIndex, startIndex), highlighted: false });
    }
    parts.push({
      text: text.slice(startIndex, startIndex + highlight.text.length),
      highlighted: true,
      level: highlight.level
    });
    lastIndex = startIndex + highlight.text.length;
  });
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlighted: false });
  }
  return parts.map((part, index) =>
    part.highlighted ? (
      <span key={index} className={`px-0.5 rounded font-medium ${part.level === 'warning' ? 'bg-amber-100/70 text-amber-700' : 'bg-sky-100/70 text-sky-700'}`}>
        {part.text}
      </span>
    ) : (<span key={index}>{part.text}</span>)
  );
};

// Question Card Component
const QuestionCard: React.FC<{ item: ChecklistItem; isDynamic: boolean }> = ({ item, isDynamic }) => {
  const [isAnswerExpanded, setIsAnswerExpanded] = useState(false);
  const hasLongAnswer = item.answer && item.answer.length > 80;
  return (
    <div className="group rounded-lg border p-3 bg-white border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-green-500 text-white">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-xs font-medium leading-snug text-gray-700">{item.text}</h3>
            {isDynamic && (
              <span className="flex-shrink-0 px-1.5 py-0.5 text-[9px] rounded font-semibold bg-blue-500 text-white uppercase">AI</span>
            )}
          </div>
          {item.answer && (
            <div className={`mt-2 ${hasLongAnswer ? 'cursor-pointer' : ''}`} onClick={() => hasLongAnswer && setIsAnswerExpanded(!isAnswerExpanded)}>
              <div className={`relative overflow-hidden transition-all ${isAnswerExpanded || !hasLongAnswer ? 'max-h-96' : 'max-h-12'}`}>
                <div className="text-xs text-gray-600 italic leading-relaxed">"{item.answer}"</div>
                {!isAnswerExpanded && hasLongAnswer && (
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent"></div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const CompletedAssessment: React.FC = () => {
  const navigate = useNavigate();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showIndicatorsModal, setShowIndicatorsModal] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DifferentialDiagnosis | null>(null);

  const { patient, assessment, differentialDiagnoses, checklist, conversation, recommendations } = assessmentData;
  const dynamicItems = (checklist as ChecklistItem[]).filter(q => q.category === 'dynamic').reverse();
  const fixedItems = (checklist as ChecklistItem[]).filter(q => q.category === 'fixed');
  
  // Get top diagnoses for display
  const topDiagnoses = (differentialDiagnoses as DifferentialDiagnosis[]).slice(0, 3);

  const scrollChat = (direction: 'up' | 'down') => {
    if (chatContainerRef.current) {
      const scrollAmount = 300;
      chatContainerRef.current.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gray-100 font-sans text-gray-900 overflow-hidden">
      <div className="flex w-full h-full max-w-[1920px] mx-auto bg-white shadow-xl overflow-hidden relative">
        
        {/* Left Sidebar - Patient Info */}
        <div className="w-1/5 min-w-[280px] h-full bg-white flex flex-col overflow-hidden border-r border-gray-200">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
            <button onClick={() => navigate('/')} className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 border border-slate-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Clinic
            </button>
          </div>
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <div className="px-6 pb-6 pt-4 border-b border-gray-100 bg-white">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl flex-shrink-0">
                  {patient.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 truncate">{patient.name}</h2>
                  <p className="text-sm text-gray-500 truncate">MRN: {patient.mrn}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">DOB</p>
                  <p className="font-medium whitespace-nowrap">{patient.date_of_birth}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Age/Sex</p>
                  <p className="font-medium whitespace-nowrap">{patient.age} / {patient.sex}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assessment Status</h3>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-100">
                  <span className="w-2 h-2 rounded-full mr-2 bg-green-500"></span>
                  COMPLETED
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assessment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Nurse</span><span className="font-medium">{assessment.nurseName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-medium">{assessment.duration}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Questions</span><span className="font-medium">{checklist.length}</span></div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recommendations</h3>
                <ul className="space-y-2">
                  {recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600 bg-amber-50 border border-amber-100 p-2 rounded">
                      <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>


        {/* Middle - Chat Transcript */}
        <div className="w-[30%] h-full border-r border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-white border-b border-gray-200 shadow-sm z-10 flex-shrink-0 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Consultation Transcript</h2>
              <p className="text-xs text-gray-500">Completed Assessment Review</p>
            </div>
            {/* Scroll Controls */}
            <div className="flex items-center gap-1">
              <button onClick={() => scrollChat('up')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title="Scroll Up">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button onClick={() => scrollChat('down')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title="Scroll Down">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6 bg-slate-50">
            {(conversation as Message[]).map(msg => (
              <div key={msg.id} className={`flex w-full ${msg.role === 'nurse' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${msg.role === 'nurse' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md z-10 ${msg.role === 'nurse' ? 'bg-teal-600 ml-4 ring-2 ring-teal-100' : 'bg-blue-600 mr-4 ring-2 ring-blue-100'}`}>
                    {msg.role === 'nurse' ? 'RN' : 'PT'}
                  </div>
                  <div className={`flex flex-col ${msg.role === 'nurse' ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs font-bold text-gray-400 mb-1 mx-1 uppercase tracking-wider">
                      {msg.role === 'nurse' ? 'Nurse AI' : 'Patient'}
                    </span>
                    <div className={`rounded-2xl px-6 py-4 text-sm leading-relaxed shadow-sm ${msg.role === 'nurse' ? 'bg-white text-gray-800 border border-teal-100 rounded-tr-none' : 'bg-blue-50 text-blue-900 border border-blue-100 rounded-tl-none'}`}>
                      {renderTextWithHighlights(msg.text, msg.highlights as MessageHighlight[])}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-center py-6">
              <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 max-w-md">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-green-900">Assessment Complete</p>
                    <p className="text-xs text-green-700 mt-1">Duration: {assessment.duration}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Right - Clinical Dashboard */}
        <div className="flex-1 h-full bg-slate-50 border-l border-gray-200 flex flex-col overflow-hidden font-sans">
          <div className="px-6 py-5 bg-white border-b border-gray-200 shadow-sm flex-shrink-0 z-10">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Differential Diagnoses</h2>
            <div className="grid grid-cols-3 gap-2">
              {topDiagnoses.map((dx, idx) => {
                const isTop = idx === 0;
                const probabilityColor = dx.probability === 'High' ? 'red' : dx.probability === 'Medium' ? 'amber' : 'gray';
                return (
                  <div 
                    key={dx.did} 
                    className={`p-1 rounded-xl cursor-pointer hover:shadow-lg transition-all ${isTop ? 'bg-gradient-to-br from-blue-50 to-white shadow-lg border border-blue-200' : 'bg-gradient-to-br from-gray-50 to-white shadow border border-gray-200'}`}
                    onClick={() => { setSelectedDiagnosis(dx); setShowIndicatorsModal(true); }}
                  >
                    <div className="bg-white rounded-lg p-3 border border-slate-50">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${isTop ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>#{dx.rank}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold bg-${probabilityColor}-100 text-${probabilityColor}-600`}>{dx.probability}</span>
                      </div>
                      <div className={`text-xs font-bold leading-tight ${isTop ? 'text-slate-800' : 'text-gray-600'}`}>{dx.diagnosis}</div>
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-[9px] text-gray-400">{dx.indicators_count} indicators</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Questions List */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50 p-4">
            <div className="space-y-4">
              {dynamicItems.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">AI-Generated Questions</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {dynamicItems.map(item => (<QuestionCard key={item.id} item={item} isDynamic={true} />))}
                  </div>
                </div>
              )}
              {fixedItems.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Standard Protocol</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {fixedItems.map(item => (<QuestionCard key={item.id} item={item} isDynamic={false} />))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Far Right - Nurse Notes */}
        <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Nurse Notes</h3>
              <span className="text-xs text-gray-400">{assessment.duration}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                47 y/o male presenting with <span className="font-medium text-amber-700">jaundice</span> and <span className="font-medium text-amber-700">severe pruritus</span>. 
                Sister first noticed yellowing of eyes. Itching described as intense ("like ants crawling under skin"), rated 8-9/10, worse at night, affecting sleep.
              </p>
              
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                <span className="font-medium">Medication Hx:</span> Currently on <span className="font-medium text-blue-700">lisinopril</span> for HTN. 
                Reports heavy <span className="font-medium text-red-700">Tylenol use</span> (6-8 pills/day x 3 weeks) for dental pain - stopped yesterday. No known drug allergies.
              </p>

              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                <span className="font-medium">Associated Sx:</span> Dark urine ("like Coke"), pale/clay-colored stools, nausea, decreased appetite, possible unintentional weight loss (clothes looser). 
                Dull heavy feeling under right ribs. Denies fever/chills. Social EtOH use ("few beers with the guys").
              </p>

              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                <span className="font-medium">PMHx/FHx:</span> HTN on lisinopril. Recent dental abscess. No prior liver disease. No recent travel or sick contacts.
              </p>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-sm font-medium text-gray-800 mb-2">Impression:</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Clinical picture highly suggestive of <span className="font-medium text-red-700">biliary obstruction</span>. 
                  Classic triad of jaundice, pruritus, and acholic stools with choluria. 
                  Differential includes <span className="font-medium text-amber-700">cholangitis</span> and <span className="font-medium text-amber-700">choledocholithiasis</span>. 
                  RUQ discomfort supports hepatobiliary etiology.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-sm font-medium text-gray-800 mb-2">Plan:</p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Hepatology/GI consult - urgent</li>
                  <li>Comprehensive LFTs (AST, ALT, ALP, GGT, Bilirubin)</li>
                  <li>Coagulation studies (PT/INR)</li>
                  <li>Abdominal ultrasound with Doppler to evaluate biliary tree</li>
                  <li>Viral hepatitis panel</li>
                  <li>Symptomatic relief for pruritus</li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  — {assessment.nurseName}<br/>
                  {new Date(assessment.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>


      {/* Indicators Modal */}
      {showIndicatorsModal && selectedDiagnosis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowIndicatorsModal(false); setSelectedDiagnosis(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Diagnostic Indicators</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-semibold text-blue-600">{selectedDiagnosis.diagnosis}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${selectedDiagnosis.probability === 'High' ? 'bg-red-100 text-red-600' : selectedDiagnosis.probability === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                      {selectedDiagnosis.probability} Probability
                    </span>
                  </p>
                </div>
                <button onClick={() => { setShowIndicatorsModal(false); setSelectedDiagnosis(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              <div className="mb-3 text-xs text-gray-500 font-medium">{selectedDiagnosis.indicators_count} supporting indicators found:</div>
              <div className="space-y-2">
                {selectedDiagnosis.indicators_point.map((indicator, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-blue-50 border-l-4 border-blue-500">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-slate-700">{indicator}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedAssessment;
