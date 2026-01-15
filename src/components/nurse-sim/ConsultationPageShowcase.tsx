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

  // Static dummy data - already populated
  const chatMessages = chatData as ChatMessage[];
  const diagnoses = (diagnosisData as any).diagnosis as Diagnosis[];
  const analytics = analyticsData as AnalyticsData;

  // Mock questions data
  const questions: Question[] = [
    {
      content: "What brings you in today?",
      qid: "00001",
      rank: 999,
      status: "asked",
      answer: "I'm yellow. And this itching is driving me nuts.",
      headline: "Chief Complaint",
      domain: "Symptom Triage",
      system_affected: "General",
      clinical_intent: "To understand the primary reason for the patient's visit.",
      tags: ["chief complaint"]
    },
    {
      content: "Current Medications",
      qid: "00004",
      rank: 999,
      status: "asked",
      answer: "I'm taking Tylenol for jaw pain, and I had antibiotics for a dental infection.",
      headline: "Current Medications",
      domain: "Medication Review",
      system_affected: "General",
      clinical_intent: "To obtain an accurate list of current medications.",
      tags: ["medication", "current"]
    },
    {
      content: "Do you have any known drug allergies?",
      qid: "00005",
      rank: 999,
      status: "asked",
      answer: "No known allergies.",
      headline: "Drug Allergies",
      domain: "Medical History",
      system_affected: "General",
      clinical_intent: "To identify potential adverse reactions to medications.",
      tags: ["allergy", "drug"]
    },
    {
      content: "Have you noticed any changes in the color of your urine or stool?",
      qid: "A1B2C",
      status: "asked",
      answer: "Yeah, darker urine and lighter stool.",
      rank: 1,
      headline: "GI Symptom Assessment",
      domain: "Symptom Triage",
      system_affected: "Gastrointestinal",
      clinical_intent: "To assess GI symptoms.",
      tags: ["GI symptoms"]
    },
    {
      qid: "D3E4F",
      content: "Have you had any recent travel or exposure to viral hepatitis?",
      status: null,
      answer: null,
      rank: 2,
      headline: "Hepatitis Exposure Risk",
      domain: "Symptom Triage",
      system_affected: "Gastrointestinal",
      clinical_intent: "To assess exposure risks.",
      tags: ["hepatitis", "exposure"]
    },
    {
      qid: "J7K8L",
      content: "Can you estimate how many Extra Strength Tylenol pills you take in a typical day?",
      status: null,
      answer: null,
      rank: 3,
      headline: "Tylenol Usage",
      domain: "Medication Review",
      system_affected: "General",
      clinical_intent: "To quantify daily acetaminophen intake.",
      tags: ["acetaminophen", "medication use"]
    },
    {
      qid: "XYZ78",
      content: "Have you consumed raw seafood or had close contact with someone with similar symptoms?",
      status: null,
      answer: null,
      rank: 5,
      headline: "Hepatitis Risk Factors",
      domain: "Symptom Triage",
      system_affected: "Gastrointestinal",
      clinical_intent: "To identify risk factors for hepatitis infection.",
      tags: ["hepatitis", "risk factors"]
    },
    {
      content: "Have you had any surgeries in the past?",
      qid: "00006",
      rank: 6,
      status: null,
      answer: null,
      headline: "Past Surgical History",
      domain: "Surgical History",
      system_affected: "General",
      clinical_intent: "To gather information on previous surgical interventions.",
      tags: ["surgery", "medical history"]
    },
    {
      qid: "G5H6I",
      content: "On a scale of 0 to 10, how severe is your jaw pain currently?",
      status: "asked",
      answer: "It's about a 3 now, much better than before.",
      rank: 999,
      headline: "Jaw Pain Assessment",
      domain: "Symptom Triage",
      system_affected: "Neurological",
      clinical_intent: "To quantify the severity of jaw pain.",
      tags: ["pain", "jaw pain"]
    }
  ];

  // Mock education items
  const educationItems: EducationItem[] = [
    {
      headline: "Emergency Red Flags for Liver Injury",
      content: "If you develop a high fever, severe abdominal pain, confusion, or notice the yellow color worsening rapidly, you must seek emergency care at the hospital immediately.",
      reasoning: "This warning is required to mitigate 'Failure to Warn' liability. Providing specific 'stop-use' and 'seek-care' triggers shifts the burden of action to the patient.",
      category: "Safety",
      urgency: "High",
      context_reference: "Patient mentioned jaundice and itching symptoms.",
      status: "pending"
    },
    {
      headline: "Acetaminophen (Tylenol) Discontinuation",
      content: "You must stop taking all forms of Tylenol immediately, including Extra Strength Tylenol and Tylenol PM. This medication is causing liver damage.",
      reasoning: "Immediate cessation of hepatotoxic medication is critical. Failure to communicate this clearly constitutes negligence.",
      category: "Medication Risk",
      urgency: "High",
      context_reference: "Patient reported frequent Tylenol use.",
      status: "pending"
    },
    {
      headline: "Alcohol Avoidance",
      content: "You must completely avoid alcohol consumption while your liver is recovering. Even small amounts can cause further damage.",
      reasoning: "Alcohol is hepatotoxic and will worsen liver injury. This is a standard of care requirement.",
      category: "Safety",
      urgency: "High",
      context_reference: "Patient has liver injury.",
      status: "asked"
    },
    {
      headline: "Medication Compliance",
      content: "Complete the entire course of any prescribed medications even if symptoms improve. Do not stop early.",
      reasoning: "Prevents resistance and ensures proper treatment.",
      category: "Medication Risk",
      urgency: "Normal",
      context_reference: "Prescription provided.",
      status: "asked"
    },
    {
      headline: "Hydration Importance",
      content: "Drink plenty of water throughout the day to help your liver flush out toxins. Aim for at least 8 glasses of water daily.",
      reasoning: "Adequate hydration supports liver function and recovery.",
      category: "Lifestyle",
      urgency: "Normal",
      context_reference: "Patient has liver injury.",
      status: "asked"
    },
    {
      headline: "Follow-up Lab Work",
      content: "You will need to have your liver function tests repeated in 48-72 hours to monitor your recovery. Do not skip this appointment.",
      reasoning: "Monitoring is essential to ensure liver function is improving and to detect any complications early.",
      category: "Follow-up Care",
      urgency: "Normal",
      context_reference: "Patient has elevated liver enzymes.",
      status: "pending"
    },
    {
      headline: "Over-the-Counter Medication Warning",
      content: "Many over-the-counter medications contain acetaminophen. Always read labels carefully and avoid any product containing acetaminophen or paracetamol.",
      reasoning: "Prevents accidental re-exposure to hepatotoxic medication.",
      category: "Medication Risk",
      urgency: "Normal",
      context_reference: "Patient needs to avoid acetaminophen.",
      status: "pending"
    },
    {
      headline: "Rest and Activity Modification",
      content: "Get plenty of rest and avoid strenuous physical activity until your liver function improves. Listen to your body and rest when you feel tired.",
      reasoning: "Rest supports the body's natural healing processes.",
      category: "Lifestyle",
      urgency: "Low",
      context_reference: "Patient reported fatigue.",
      status: "asked"
    }
  ];

  // Mock checklist items
  const checklistItems: ChecklistItem[] = [
    {
      id: "1",
      title: "Drug Allergy Verification",
      description: "Verify allergies before suggesting treatment.",
      reasoning: "Standard of Care requirement.",
      category: "Legal/Safety",
      completed: false,
      priority: "high",
      status: "asked"
    },
    {
      id: "2",
      title: "Safety Netting",
      description: "Provided emergency instructions.",
      reasoning: "Fulfills legal requirement.",
      category: "Informed Consent",
      completed: true,
      priority: "high",
      status: "asked"
    }
  ];

  // Mock report data
  const reportData: ReportData = {
    clinical_handover: {
      hpi_narrative: "Patient presents with jaundice and severe itching.",
      key_biomarkers_extracted: ["AST: 450 U/L", "ALT: 620 U/L"],
      clinical_impression_summary: "Drug-induced liver injury.",
      suggested_doctor_actions: ["Discontinue acetaminophen", "Monitor liver function"]
    },
    audit_summary: {
      performance_narrative: "Consultation conducted efficiently.",
      areas_for_improvement_summary: "Consider more detailed history taking."
    }
  };

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
            <ReportInterface reportData={reportData} />
          ) : null}
        </div>
      </div>
    </div>
  );
};
