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
  BarChart3
} from 'lucide-react';
import { PatientInfo } from './PatientInfo';
import { ChatInterface } from './ChatInterface';
import { QuestionsInterface } from './QuestionsInterface';
import { PatientEducationInterface } from './PatientEducationInterface';
import { DiagnosticInterface } from './DiagnosticInterface';
import { ChecklistInterface } from './ChecklistInterface';
import { ReportInterface } from './ReportInterface';
import { AnalyticsInterface } from './AnalyticsInterface';
import { Patient, ChatMessage, Diagnosis, Question, EducationItem, AnalyticsData, ChecklistItem, ReportData } from '../../types/nurse-sim';

// Import all dummy data
import chatData from '../../data/nurse-sim/new_format/chat.json';
import diagnosisData from '../../data/nurse-sim/new_format/diagnosis.json';
import analyticsData from '../../data/nurse-sim/new_format/analytics.json';
import questionsData from '../../data/nurse-sim/new_format/questions.json';
import reportData from '../../data/nurse-sim/new_format/report.json';
import educationData from '../../data/nurse-sim/new_format/education.json';
import checklistData from '../../data/nurse-sim/new_format/checklist.json';

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
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e5e5"
            strokeWidth={strokeWidth}
          />
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
  
  const getStrokeColor = () => {
    if (percentage === 100) return '#0891b2';
    if (percentage >= 60) return '#06b6d4';
    return '#22d3ee';
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

// Mock patient data
const MOCK_PATIENT: Patient = {
  id: 'P0001',
  firstName: 'Marcus',
  middleName: 'J.',
  lastName: 'Thorne',
  age: 46,
  gender: 'Male',
  diagnosis: 'Drug-Induced Liver Injury (DILI)',
  status: 'Critical',
  lastVisit: '2023-10-20'
};

export const ConsultationPageShowcase: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState<SectionId>('patient');
  const [consultationDuration] = useState<number>(30);
  const [elapsedTime, setElapsedTime] = useState<number>(450); // 7:30 elapsed
  const [hasStarted] = useState(true);

  // Static dummy data - already populated with safety checks
  const chatMessages = Array.isArray(chatData) ? (chatData as ChatMessage[]) : [];
  const diagnoses = Array.isArray(diagnosisData) ? (diagnosisData as Diagnosis[]) : [];
  const analytics = analyticsData as AnalyticsData;
  const questions = Array.isArray(questionsData) ? (questionsData as Question[]) : [];
  const educationItems = Array.isArray(educationData) ? (educationData as EducationItem[]) : [];
  const checklistItems = Array.isArray(checklistData) ? (checklistData as ChecklistItem[]) : [];

  // Debug logging
  console.log('Data loaded:', {
    chatMessages: chatMessages?.length,
    diagnoses: diagnoses?.length,
    questions: questions?.length,
    educationItems: educationItems?.length,
    checklistItems: checklistItems?.length
  });

  // Import report data from JSON
  const report = reportData as ReportData;

  // Calculate dynamic counts
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => q.status === "asked").length;
  const questionsPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const totalEducation = educationItems.length;
  const deliveredEducation = educationItems.filter(e => e.status === "asked").length;
  const educationPercentage = totalEducation > 0 ? Math.round((deliveredEducation / totalEducation) * 100) : 0;

  const elapsedMinutes = Math.floor(elapsedTime / 60);
  const elapsedSeconds = elapsedTime % 60;
  const timerProgressPercentage = Math.round((elapsedTime / (consultationDuration * 60)) * 100);

  const topDiagnosis = diagnoses.length > 0 ? diagnoses[0] : null;

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      {/* Combined Nav + Analytics Bar */}
      <div className="h-12 bg-white border-b border-gray-200 shrink-0 px-4 flex items-center shadow-sm">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 transition-colors mr-3"
        >
          <MoveLeftIcon size={18} />
        </button>
        
        <div className="h-6 w-px bg-cyan-200 mr-4"></div>

        {hasStarted && (
          <>
            <div className="flex items-center gap-2 mr-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#0EA5E9] animate-pulse">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-700">Listening</span>
                <span className="text-[8px] text-slate-500">Voice Active</span>
              </div>
            </div>
            <div className="h-6 w-px bg-cyan-200 mr-4"></div>
          </>
        )}

        <div className="flex-1 flex items-center gap-5">
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
          </div>

          <div className="h-6 w-px bg-cyan-200"></div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Diagnosis</span>
            {topDiagnosis ? (
              <>
                <span className="px-2 py-0.5 bg-cyan-600 text-white text-[10px] font-bold rounded shadow-sm">
                  {topDiagnosis.headline || 'DILI'}
                </span>
                <div className="w-16 h-1.5 bg-cyan-100 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(90, topDiagnosis.rank ? (100 - topDiagnosis.rank * 10) : 85)}%` }}></div>
                </div>
              </>
            ) : (
              <span className="text-[10px] text-slate-400">Analyzing...</span>
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
                  ? 'bg-neutral-100 text-neutral-900'
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
              <PatientInfo patient={MOCK_PATIENT} />
            </div>
          ) : activeSection === 'chat' ? (
            <ChatInterface 
              chatMessages={chatMessages}
              isSessionActive={true}
              hasStarted={hasStarted}
              showModal={false}
            />
          ) : activeSection === 'questions' ? (
            <QuestionsInterface questions={questions} />
          ) : activeSection === 'education' ? (
            <PatientEducationInterface educationItems={educationItems} />
          ) : activeSection === 'diagnostic' ? (
            <DiagnosticInterface diagnoses={diagnoses} />
          ) : activeSection === 'checklist' ? (
            <ChecklistInterface checklistItems={checklistItems} />
          ) : activeSection === 'analytics' ? (
            <AnalyticsInterface analyticsData={analytics} />
          ) : activeSection === 'report' ? (
            <ReportInterface reportData={report} />
          ) : null}
        </div>
      </div>
    </div>
  );
};
