import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  HelpCircle, 
  BookOpen, 
  Stethoscope, 
  User, 
  CheckSquare, 
  FileText,
  MoveLeftIcon,
  BarChart3,
  Bug,
  X
} from 'lucide-react';
import { PatientInfo } from './PatientInfo';
import { ChatInterface } from './ChatInterface';
import { QuestionsInterface } from './QuestionsInterface';
import { PatientEducationInterface } from './PatientEducationInterface';
import { DiagnosticInterface } from './DiagnosticInterface';
import { ChecklistInterface } from './ChecklistInterface';
import { ReportInterface } from './ReportInterface';
import { AnalyticsInterface } from './AnalyticsInterface';
import { Patient, PatientStatus, ChatMessage, Diagnosis, Question, EducationItem, AnalyticsData, ChecklistItem, ReportData } from '../../types/nurse-sim';
import { ClinicalSession } from '../../services/nurse-sim/websocket';

type SectionId = 'patient' | 'chat' | 'questions' | 'education' | 'diagnostic' | 'checklist' | 'analytics' | 'report';

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'patient', label: 'Patient Info', icon: <User size={16} /> },
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={16} /> },
  { id: 'questions', label: 'Questions', icon: <HelpCircle size={16} /> },
  { id: 'education', label: 'Patient Education', icon: <BookOpen size={16} /> },
  { id: 'diagnostic', label: 'Diagnostic', icon: <Stethoscope size={16} /> },
  { id: 'checklist', label: 'Checklist', icon: <CheckSquare size={16} /> },
  { id: 'analytics', label: 'Consult Analytics', icon: <BarChart3 size={16} /> },
  { id: 'report', label: 'Report Gen', icon: <FileText size={16} /> },
];

// Donut/Ring Chart Component
interface DonutChartProps {
  percentage: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
}

const DonutChart: React.FC<DonutChartProps> = ({ 
  percentage, 
  label, 
  size = 80, 
  strokeWidth = 8,
  filled = false 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e5e5"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={filled ? "#475569" : "#64748b"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        {/* Center fill for 100% */}
        {filled && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ 
              margin: strokeWidth,
              borderRadius: '50%',
              backgroundColor: '#475569'
            }}
          >
            <span className="text-white font-semibold text-sm">{percentage}%</span>
          </div>
        )}
        {/* Percentage text for non-filled */}
        {!filled && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-neutral-600 font-semibold text-sm">{percentage}%</span>
          </div>
        )}
      </div>
      <span className="text-xs text-neutral-500 mt-2 text-center leading-tight">{label}</span>
    </div>
  );
};

// Small circular indicator for analytics bar
interface SmallDonutProps {
  percentage: number;
  label: string;
  count?: string;
}

const SmallDonut: React.FC<SmallDonutProps> = ({ percentage, label, count }) => {
  const size = 24;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Color based on completion percentage
  const getStrokeColor = () => {
    if (percentage === 100) return '#0891b2'; // cyan-600
    if (percentage >= 60) return '#06b6d4'; // cyan-500
    return '#22d3ee'; // cyan-400
  };
  
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#cffafe"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        {/* Count inside the ring */}
        {count && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[7px] text-cyan-700 font-bold tabular-nums">{count}</span>
          </div>
        )}
      </div>
      <span className="text-[10px] text-slate-600 uppercase tracking-wide leading-tight font-semibold">{label}</span>
    </div>
  );
};

export const ConsultationPage: React.FC<{ patient: Patient; onBack: () => void }> = ({ patient, onBack }) => {
  const [activeSection, setActiveSection] = useState<SectionId>('patient');
  const [consultationDuration, setConsultationDuration] = useState<number>(20); // Default 20 minutes
  const sessionRef = useRef<ClinicalSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // in seconds

  // Backend data states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [educationItems, setEducationItems] = useState<EducationItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Chat UI states - lifted from ChatInterface to preserve across tab switches
  const [hasStarted, setHasStarted] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  // Debug modal state
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugLogs, setDebugLogs] = useState<Array<{ timestamp: string; type: string; data: any }>>([]);

  // Calculate dynamic counts from backend data
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => q.status === "asked").length;
  const questionsPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const totalEducation = educationItems.length;
  const deliveredEducation = educationItems.filter(e => e.status === "asked").length;
  const educationPercentage = totalEducation > 0 ? Math.round((deliveredEducation / totalEducation) * 100) : 0;

  // Calculate timer progress
  const elapsedMinutes = Math.floor(elapsedTime / 60);
  const elapsedSeconds = elapsedTime % 60;
  const timerProgressPercentage = Math.round((elapsedTime / (consultationDuration * 60)) * 100);

  // Get top diagnosis
  const topDiagnosis = diagnoses.length > 0 ? diagnoses[0] : null;

  // Timer effect - updates every second when session is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isSessionActive && sessionStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - sessionStartTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, sessionStartTime]);

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.stop();
      }
    };
  }, []);

  // Handle consultation type selection and start WebSocket session
  const handleConsultationTypeSelected = (type: 'new' | 'followup') => {
    if (type === 'new') {
      setConsultationDuration(20);
    } else {
      setConsultationDuration(10);
    }

    // Start timer
    setSessionStartTime(Date.now());
    setElapsedTime(0);

    // Mark as started and hide modal
    setHasStarted(true);
    setShowConsultationModal(false);

    // Start WebSocket session
    startClinicalSession(patient.id, patient.gender);
  };

  // Handle microphone click - show modal if not started
  const handleMicClick = () => {
    if (!hasStarted) {
      setShowConsultationModal(true);
    }
  };

  const addDebugLog = (type: string, data: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, { timestamp, type, data }].slice(-50)); // Keep last 50 logs
  };

  const startClinicalSession = (patientId: string, gender: string) => {
    if (sessionRef.current) {
      console.log('Session already active');
      return;
    }

    console.log('Starting clinical session for patient:', patientId);
    addDebugLog('system', { message: 'Starting clinical session', patientId, gender });
    
    const session = new ClinicalSession(patientId, gender, {
      onChat: (messages) => {
        console.log('[ConsultationPage] Received chat messages:', messages);
        addDebugLog('chat', { count: messages.length, data: messages });
        setChatMessages(messages);
      },
      onDiagnoses: (newDiagnoses) => {
        console.log('Received diagnoses:', newDiagnoses.length);
        setDiagnoses(newDiagnoses);
        addDebugLog('diagnosis', { count: newDiagnoses.length, data: newDiagnoses });
      },
      onQuestions: (newQuestions) => {
        console.log('Received questions:', newQuestions.length);
        setQuestions(newQuestions);
        addDebugLog('questions', { count: newQuestions.length, data: newQuestions });
      },
      onEducation: (items) => {
        console.log('Received education items:', items.length);
        setEducationItems(items);
        addDebugLog('education', { count: items.length, data: items });
      },
      onAnalytics: (analyticsData) => {
        console.log('Received analytics data');
        setAnalytics(analyticsData);
        addDebugLog('analytics', analyticsData);
      },
      onChecklist: (items) => {
        console.log('Received checklist items:', items.length);
        setChecklistItems(items);
        addDebugLog('checklist', { count: items.length, data: items });
      },
      onReport: (report) => {
        console.log('Received report data');
        setReportData(report);
        addDebugLog('report', report);
      },
      onStatusChange: (status) => {
        console.log('Session status:', status);
        setIsSessionActive(status === 'connected');
        addDebugLog('status', { status });
      },
      onLog: (message, type) => {
        console.log(`[${type}] ${message}`);
        addDebugLog('log', { message, level: type });
      },
    });

    sessionRef.current = session;
    session.start().catch((error) => {
      console.error('Failed to start session:', error);
      addDebugLog('error', { message: 'Failed to start session', error: error.message });
      sessionRef.current = null;
    });
  };

  // Format duration for display
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:00`;
    }
    return `${mins}:00`;
  };

  return (
    <div className="h-screen bg-neutral-100 flex flex-col overflow-hidden font-sans text-neutral-800">
      {/* Debug Modal */}
      {showDebugModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl mx-4 h-[80vh] flex flex-col border border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gray-800 shrink-0">
              <div className="flex items-center gap-3">
                <Bug size={20} className="text-cyan-500" />
                <h2 className="text-lg font-bold text-white">WebSocket Debug Console</h2>
                <span className="text-xs text-gray-400 font-mono">Real-time Data Stream</span>
              </div>
              <button
                onClick={() => setShowDebugModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Connection Status */}
            <div className="px-6 py-3 border-b border-gray-700 flex gap-4 bg-gray-850 shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                <span className="text-xs font-mono text-gray-300">
                  Session: <span className={isSessionActive ? 'text-green-400' : 'text-gray-500'}>{isSessionActive ? 'ACTIVE' : 'INACTIVE'}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400">Logs: {debugLogs.length}</span>
              </div>
              <button
                onClick={() => setDebugLogs([])}
                className="ml-auto text-xs text-gray-400 hover:text-white transition-colors"
              >
                Clear Logs
              </button>
            </div>

            {/* Data Grid */}
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-4 gap-3">
                {/* Chat */}
                <div className="flex flex-col h-[280px]">
                  <div className="text-xs font-bold text-purple-400 mb-2 uppercase tracking-wide">● Chat ({chatMessages.length})</div>
                  <div className="flex-1 bg-black rounded-lg border border-gray-800 overflow-y-auto">
                    <pre className="text-[10px] text-green-400 p-3 leading-tight font-mono whitespace-pre-wrap break-words">
                      {chatMessages.length > 0 ? JSON.stringify(chatMessages, null, 2) : 'Waiting...'}
                    </pre>
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="flex flex-col h-[280px]">
                  <div className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-wide">● Diagnosis ({diagnoses.length})</div>
                  <div className="flex-1 bg-black rounded-lg border border-gray-800 overflow-y-auto">
                    <pre className="text-[10px] text-green-400 p-3 leading-tight font-mono whitespace-pre-wrap break-words">
                      {diagnoses.length > 0 ? JSON.stringify(diagnoses, null, 2) : 'Waiting...'}
                    </pre>
                  </div>
                </div>

                {/* Questions */}
                <div className="flex flex-col h-[280px]">
                  <div className="text-xs font-bold text-yellow-400 mb-2 uppercase tracking-wide">● Questions ({questions.length})</div>
                  <div className="flex-1 bg-black rounded-lg border border-gray-800 overflow-y-auto">
                    <pre className="text-[10px] text-green-400 p-3 leading-tight font-mono whitespace-pre-wrap break-words">
                      {questions.length > 0 ? JSON.stringify(questions, null, 2) : 'Waiting...'}
                    </pre>
                  </div>
                </div>

                {/* Education */}
                <div className="flex flex-col h-[280px]">
                  <div className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wide">● Education ({educationItems.length})</div>
                  <div className="flex-1 bg-black rounded-lg border border-gray-800 overflow-y-auto">
                    <pre className="text-[10px] text-green-400 p-3 leading-tight font-mono whitespace-pre-wrap break-words">
                      {educationItems.length > 0 ? JSON.stringify(educationItems, null, 2) : 'Waiting...'}
                    </pre>
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex flex-col h-[280px]">
                  <div className="text-xs font-bold text-pink-400 mb-2 uppercase tracking-wide">● Analytics</div>
                  <div className="flex-1 bg-black rounded-lg border border-gray-800 overflow-y-auto">
                    <pre className="text-[10px] text-green-400 p-3 leading-tight font-mono whitespace-pre-wrap break-words">
                      {analytics ? JSON.stringify(analytics, null, 2) : 'Waiting...'}
                    </pre>
                  </div>
                </div>

                {/* Checklist */}
                <div className="flex flex-col h-[280px]">
                  <div className="text-xs font-bold text-orange-400 mb-2 uppercase tracking-wide">● Checklist ({checklistItems.length})</div>
                  <div className="flex-1 bg-black rounded-lg border border-gray-800 overflow-y-auto">
                    <pre className="text-[10px] text-green-400 p-3 leading-tight font-mono whitespace-pre-wrap break-words">
                      {checklistItems.length > 0 ? JSON.stringify(checklistItems, null, 2) : 'Waiting...'}
                    </pre>
                  </div>
                </div>

                {/* Report */}
                <div className="flex flex-col h-[280px]">
                  <div className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wide">● Report</div>
                  <div className="flex-1 bg-black rounded-lg border border-gray-800 overflow-y-auto">
                    <pre className="text-[10px] text-green-400 p-3 leading-tight font-mono whitespace-pre-wrap break-words">
                      {reportData ? JSON.stringify(reportData, null, 2) : 'Waiting...'}
                    </pre>
                  </div>
                </div>

                {/* Event Log */}
                <div className="flex flex-col h-[280px]">
                  <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">● Event Log</div>
                  <div className="flex-1 bg-black rounded-lg border border-gray-800 overflow-y-auto">
                    <div className="text-[10px] text-green-400 p-3 leading-tight font-mono space-y-1">
                      {debugLogs.length > 0 ? (
                        debugLogs.slice().reverse().map((log, idx) => (
                          <div key={idx} className="border-b border-gray-800 pb-1 mb-1">
                            <div className="text-cyan-400">[{log.timestamp}] {log.type}</div>
                            <div className="text-gray-500 text-[9px] ml-2 break-all">{JSON.stringify(log.data).substring(0, 100)}...</div>
                          </div>
                        ))
                      ) : (
                        'Waiting...'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Combined Nav + Analytics Bar */}
      <div className="h-12 bg-white border-b border-gray-200 shrink-0 px-4 flex items-center shadow-sm">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 transition-colors mr-3"
        >
          <MoveLeftIcon size={18} />
        </button>
        
        {/* Debug Button */}
        <button
          onClick={() => setShowDebugModal(true)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 transition-colors mr-3"
          title="Open Debug Console"
        >
          <Bug size={18} />
        </button>
        
        {/* Vertical Separator */}
        <div className="h-6 w-px bg-cyan-200 mr-4"></div>

        {/* Voice Consultation Status - Always visible when active */}
        {hasStarted && (
          <>
            <div className="flex items-center gap-2 mr-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isSessionActive ? 'bg-[#0EA5E9] animate-pulse' : 'bg-neutral-300'
              }`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-700">
                  {isSessionActive ? 'Connected' : 'Connecting...'}
                </span>
                <span className="text-[8px] text-slate-500">Voice Simulation</span>
              </div>
              {/* Stop Button */}
              <button
                onClick={() => {
                  if (sessionRef.current) {
                    sessionRef.current.stop();
                    sessionRef.current = null;
                  }
                  setIsSessionActive(false);
                }}
                className="ml-1 w-6 h-6 rounded flex items-center justify-center bg-cyan-500/50 hover:bg-cyan-600 transition-colors"
                title="Stop consultation"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
              </button>
            </div>
            <div className="h-6 w-px bg-cyan-200 mr-4"></div>
          </>
        )}

        {/* Analytics Section */}
        <div className="flex-1 flex items-center gap-5">
          {/* Consultation Duration with Timer */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Duration</span>
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-1.5 bg-cyan-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, timerProgressPercentage)}%` }}></div>
              </div>
              <span className="text-[10px] text-slate-700 font-bold whitespace-nowrap tabular-nums">
                {String(elapsedMinutes).padStart(2, '0')}:{String(elapsedSeconds).padStart(2, '0')}/{formatDuration(consultationDuration)}
              </span>
            </div>
          </div>

          {/* Small Donut Indicators with counts */}
          <div className="flex items-center gap-4">
            <SmallDonut 
              percentage={questionsPercentage} 
              label="Questions" 
              count={`${answeredQuestions}/${totalQuestions}`} 
            />
            <SmallDonut 
              percentage={educationPercentage} 
              label="Education" 
              count={`${deliveredEducation}/${totalEducation}`} 
            />
            <div className="h-6 w-px bg-cyan-200"></div>
            <SmallDonut 
              percentage={analytics?.overall_score ? Math.round(analytics.overall_score) : 0} 
              label="Analytics" 
              count={analytics?.overall_score ? Math.round(analytics.overall_score).toString() : '0'} 
            />
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-cyan-200"></div>

          {/* Top Diagnosis */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Diagnosis</span>
            {topDiagnosis ? (
              <span className="px-2 py-0.5 bg-cyan-600 text-white text-[10px] font-bold rounded shadow-sm">
                {topDiagnosis.headline || 'DILI'}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Not Ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <div className="w-16 bg-white border-r border-neutral-200 flex flex-col py-2 shrink-0">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center justify-center py-2.5 px-1 mx-1.5 rounded-lg transition-all ${
                activeSection === item.id
                  ? 'bg-cyan-50 text-cyan-600'
                  : 'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600'
              }`}
            >
              {item.icon}
              <span className="text-[9px] mt-1 font-medium text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-3 overflow-hidden">
          {activeSection === 'patient' ? (
            <div className="h-full overflow-y-auto">
              <PatientInfo patient={patient} />
            </div>
          ) : activeSection === 'chat' ? (
            <ChatInterface 
              onConsultationTypeSelected={handleConsultationTypeSelected}
              chatMessages={chatMessages}
              isSessionActive={isSessionActive}
              hasStarted={hasStarted}
              showModal={showConsultationModal}
              onMicClick={handleMicClick}
              onModalClose={() => setShowConsultationModal(false)}
            />
          ) : !hasStarted ? (
            // Show "Please Start Consultation" for all tabs except Patient and Chat
            <div className="h-full flex items-center justify-center">
              <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" x2="12" y1="19" y2="22"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-700 mb-2">Start Consultation</h3>
                <p className="text-sm text-neutral-500">
                  Please start the consultation from the Chat tab to view {activeSection} data
                </p>
              </div>
            </div>
          ) : activeSection === 'questions' ? (
            questions.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center max-w-md">
                  <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-700 mb-2">Analyzing Consultation</h3>
                  <p className="text-sm text-neutral-500">
                    Waiting for consultation data to present questions
                  </p>
                </div>
              </div>
            ) : (
              <QuestionsInterface questions={questions} />
            )
          ) : activeSection === 'education' ? (
            educationItems.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center max-w-md">
                  <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-700 mb-2">Analyzing Consultation</h3>
                  <p className="text-sm text-neutral-500">
                    Waiting for consultation data to present patient education
                  </p>
                </div>
              </div>
            ) : (
              <PatientEducationInterface educationItems={educationItems} />
            )
          ) : activeSection === 'diagnostic' ? (
            diagnoses.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center max-w-md">
                  <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-700 mb-2">Analyzing Consultation</h3>
                  <p className="text-sm text-neutral-500">
                    Waiting for consultation data to present diagnostic information
                  </p>
                </div>
              </div>
            ) : (
              <DiagnosticInterface diagnoses={diagnoses} />
            )
          ) : activeSection === 'checklist' ? (
            checklistItems.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center max-w-md">
                  <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-700 mb-2">Analyzing Consultation</h3>
                  <p className="text-sm text-neutral-500">
                    Waiting for consultation data to present checklist
                  </p>
                </div>
              </div>
            ) : (
              <ChecklistInterface checklistItems={checklistItems} />
            )
          ) : activeSection === 'analytics' ? (
            !analytics || !analytics.metrics ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center max-w-md">
                  <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-700 mb-2">Analyzing Consultation</h3>
                  <p className="text-sm text-neutral-500">
                    Waiting for consultation data to present analytics
                  </p>
                </div>
              </div>
            ) : (
              <AnalyticsInterface analyticsData={analytics} />
            )
          ) : activeSection === 'report' ? (
            !reportData ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center max-w-md">
                  <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-700 mb-2">Analyzing Consultation</h3>
                  <p className="text-sm text-neutral-500">
                    Waiting for consultation data to generate report
                  </p>
                </div>
              </div>
            ) : (
              <ReportInterface reportData={reportData} />
            )
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="bg-white rounded-xl border border-neutral-200 p-8">
                <h2 className="text-lg font-semibold text-neutral-700 mb-8 capitalize">{activeSection}</h2>
                
                {/* Donut Charts Display */}
                <div className="flex items-center justify-center gap-16">
                  <DonutChart percentage={60} label="Key Symptoms" size={100} strokeWidth={10} />
                  <DonutChart percentage={80} label="Patient Education" size={100} strokeWidth={10} />
                  <DonutChart percentage={100} label="Safety Check" size={100} strokeWidth={10} filled />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
