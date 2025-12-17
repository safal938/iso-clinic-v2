import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PatientInfo from './PatientInfo';
import ChatInterface from './ChatInterface';
import ClinicalDashboard from './ClinicalDashboard';
import DebugPanel from './DebugPanel';
import { websocketService, ConnectionStatus, BackendDiagnosis, BackendQuestion } from '../../services/nurse-sim/websocketService';
import { INITIAL_CHECKLIST, SCENARIOS } from '../../constants/nurse-sim';
import { Message, ChecklistItem, PatientData, DiagnosisOption } from '../../types/nurse-sim';

const generateId = () => Math.random().toString(36).substr(2, 9);

const WEBSOCKET_URL = "wss://clinic-hepa-backend-481780815788.us-central1.run.app/ws/simulation";

// Map triage rooms to specific patients
const TRIAGE_PATIENT_MAP: Record<string, number> = {
  'Triage 1': 0, // Sarah Miller
  'Triage 2': 1, // David Chen
  'Triage 3': 2, // Maria Garcia
  'nurse1': 0, // Sarah Miller (from isoclinic)
  'nurse2': 1, // David Chen (from isoclinic)
  'nurse3': 2, // Maria Garcia (from isoclinic)
};

const NurseSimApp: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const triageRoom = (location.state as any)?.triageRoom;

    // Patient & Chat State
    const [patientData, setPatientData] = useState<PatientData | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    
    // Clinical Dashboard State
    const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
    const [primaryDiagnosis, setPrimaryDiagnosis] = useState<DiagnosisOption>({ diagnosis: "Pending Assessment...", confidenceScore: 0, severity: 'Very Low', indicators: [] });
    const [secondaryDiagnosis, setSecondaryDiagnosis] = useState<DiagnosisOption>({ diagnosis: "Pending Assessment...", confidenceScore: 0, severity: 'Very Low', indicators: [] });
    const [diagnosticPivotOccurred, setDiagnosticPivotOccurred] = useState<boolean>(false);
    
    // UI State
    const [isSimulationActive, setIsSimulationActive] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [isDebugOpen, setIsDebugOpen] = useState(false);
    const [isTogglingSimulation, setIsTogglingSimulation] = useState(false);
    
    const wsInitialized = useRef(false);
    
    // Timer State
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [timerStarted, setTimerStarted] = useState(false);

    // Auto-select patient based on triage room
    useEffect(() => {
        if (triageRoom && TRIAGE_PATIENT_MAP[triageRoom] !== undefined) {
            const patientIndex = TRIAGE_PATIENT_MAP[triageRoom];
            setPatientData(SCENARIOS[patientIndex]);
        } else if (triageRoom) {
            // Fallback to first patient if room not found
            console.warn(`Triage room "${triageRoom}" not found in mapping, using default patient`);
            setPatientData(SCENARIOS[0]);
        } else {
            // No triage room specified, use first patient
            setPatientData(SCENARIOS[0]);
        }
    }, [triageRoom]);

    const calculateConfidenceScore = (indicatorsCount: number): number => {
        const baseScore = Math.min(indicatorsCount * 10, 95);
        const variance = Math.random() * 5;
        return Math.round(Math.max(baseScore + variance, 10));
    };

    const transformDiagnosis = (diag: BackendDiagnosis): DiagnosisOption => ({
        diagnosis: diag.diagnosis,
        confidenceScore: calculateConfidenceScore(diag.indicators_count),
        severity: (diag as any).severity || 'Moderate',
        indicators: diag.indicators_point.map(point => {
            const significance: 'high' | 'medium' | 'low' = diag.indicators_count >= 5 ? 'high' : diag.indicators_count >= 3 ? 'medium' : 'low';
            return {
                finding: point,
                source: 'Patient reported',
                significance,
                patientQuote: point
            };
        })
    });

    const transformQuestions = (questions: BackendQuestion[]): ChecklistItem[] => {
        return questions
            .filter(q => q.status !== 'deleted')
            .map(q => ({
                id: q.qid,
                text: q.content,
                isCompleted: q.status === 'asked',
                category: q.qid.startsWith('0000') ? 'fixed' : 'dynamic' as const,
                answer: q.status === 'asked' ? (q.answer || 'Asked') : undefined,
                rank: q.rank
            }));
    };

    // WebSocket setup
    useEffect(() => {
        if (wsInitialized.current) return;
        
        websocketService.setBackendUrl(WEBSOCKET_URL);
        websocketService.setCallbacks({
            onTranscript: (speaker, text, highlights) => {
                const role = speaker === 'NURSE' ? 'nurse' : 'patient';
                const newMsg: Message = {
                    id: generateId(),
                    role,
                    text,
                    timestamp: new Date(),
                    highlights: highlights
                };
                setMessages(prev => [...prev, newMsg]);
            },
            onAudio: (_base64Data) => {
                // Audio chunk received - handled by websocket service
            },
            onSystem: (message) => {
                console.log("System:", message);
            },
            onClinical: (data) => {
                if (data.diagnosis && (data.confidenceScore !== undefined || data.severity)) {
                    const indicators = (data.indicators || []).map(ind => ({
                        ...ind,
                        significance: (ind.significance || 'medium') as 'high' | 'medium' | 'low'
                    }));
                    setPrimaryDiagnosis({
                        diagnosis: data.diagnosis,
                        confidenceScore: data.confidenceScore || 0,
                        severity: data.severity || 'Moderate',
                        indicators
                    });
                }
            },
            onDiagnoses: (diagnoses: BackendDiagnosis[]) => {
                const sorted = [...diagnoses].sort((a, b) => b.indicators_count - a.indicators_count);
                if (sorted.length > 0) {
                    setPrimaryDiagnosis(transformDiagnosis(sorted[0]));
                }
                if (sorted.length > 1) {
                    setSecondaryDiagnosis(transformDiagnosis(sorted[1]));
                }
            },
            onQuestions: (questions: BackendQuestion[]) => {
                const transformed = transformQuestions(questions);
                setChecklist(transformed);
            },
            onTurnCycle: (status) => {
                if (status === 'end') {
                    setIsSimulationActive(false);
                }
            },
            onStatusChange: (status) => {
                setConnectionStatus(status);
                if (status === 'disconnected' || status === 'error') {
                    setIsSimulationActive(false);
                }
            }
        });
        
        wsInitialized.current = true;
    }, []);

    const startWebSocketSimulation = async () => {
        if (!patientData) return;
        setIsTogglingSimulation(true);
        try {
            websocketService.resetAudioTiming();
            const connected = await websocketService.connect(patientData.id, patientData.patient.sex);
            if (connected) {
                setIsSimulationActive(true);
                setTimerStarted(true);
            }
        } finally {
            setIsTogglingSimulation(false);
        }
    };

    const stopWebSocketSimulation = () => {
        setIsTogglingSimulation(true);
        try {
            websocketService.disconnect();
            setIsSimulationActive(false);
        } finally {
            setTimeout(() => setIsTogglingSimulation(false), 300);
        }
    };

    const handleToggleSimulation = () => {
        if (isTogglingSimulation) return;
        
        if (isSimulationActive) {
            stopWebSocketSimulation();
        } else {
            startWebSocketSimulation();
        }
    };

    const handleReset = () => {
        websocketService.disconnect();
        setIsSimulationActive(false);
        setMessages([]);
        setChecklist(INITIAL_CHECKLIST);
        setPrimaryDiagnosis({ diagnosis: "Pending Assessment...", confidenceScore: 0, severity: 'Very Low', indicators: [] });
        setSecondaryDiagnosis({ diagnosis: "Pending Assessment...", confidenceScore: 0, severity: 'Very Low', indicators: [] });
        setDiagnosticPivotOccurred(false);
        setElapsedTime(0);
        setTimerStarted(false);
    };

    const handleChangeScenario = () => {
        handleReset();
        navigate('/');
    };
    
    // Timer effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timerStarted && isSimulationActive && elapsedTime < 600) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerStarted, isSimulationActive, elapsedTime]);
    
    useEffect(() => {
        if (isSimulationActive && !timerStarted) {
            setTimerStarted(true);
        }
    }, [isSimulationActive, timerStarted]);

    if (!patientData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading patient data...</p>
                </div>
            </div>
        );
    }

    const getSidebarWidth = () => {
        if (isDashboardExpanded) return 'w-16';
        return isSidebarOpen ? 'w-1/5 min-w-[280px]' : 'w-16';
    };

    const getChatWidth = () => {
        if (isDashboardExpanded) return 'w-[20%] min-w-[200px]';
        return 'w-1/2';
    };

    const getDashboardWidth = () => {
        if (isDashboardExpanded) return 'w-[80%]';
        return 'w-1/2';
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-gray-100 font-sans text-gray-900 overflow-hidden">
            {/* Debug Button */}
            <button
                onClick={() => setIsDebugOpen(true)}
                className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg hover:bg-gray-700 flex items-center gap-2"
            >
                🔍 Debug Logs
            </button>
            
            <DebugPanel isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />
            
            <div className="flex w-full h-full max-w-[1920px] mx-auto bg-white shadow-xl overflow-hidden relative">
                <div className={`${getSidebarWidth()} transition-all duration-500 ease-in-out h-full z-20 flex-shrink-0 relative`}>
                    <PatientInfo 
                        data={patientData} 
                        isOpen={isSidebarOpen && !isDashboardExpanded}
                        onToggle={() => !isDashboardExpanded && setIsSidebarOpen(!isSidebarOpen)}
                        onChangeScenario={handleChangeScenario}
                    />
                </div>

                <div className="flex-1 flex h-full overflow-hidden">
                    <div className={`${getChatWidth()} h-full border-r border-gray-200 overflow-hidden transition-all duration-500 ease-in-out`}>
                        <ChatInterface 
                            messages={messages}
                            isSimulationActive={isSimulationActive}
                            onToggleSimulation={handleToggleSimulation}
                            onReset={handleReset}
                            isProcessing={false}
                            elapsedTime={elapsedTime}
                            timerStarted={timerStarted}
                            isCompact={isDashboardExpanded}
                            connectionStatus={connectionStatus}
                            isTogglingSimulation={isTogglingSimulation}
                        />
                    </div>

                    <div className={`${getDashboardWidth()} h-full overflow-hidden transition-all duration-500 ease-in-out`}>
                        <ClinicalDashboard 
                            checklist={checklist}
                            primaryDiagnosis={primaryDiagnosis}
                            secondaryDiagnosis={secondaryDiagnosis}
                            diagnosticPivot={diagnosticPivotOccurred}
                            isExpanded={isDashboardExpanded}
                            onToggleExpand={() => setIsDashboardExpanded(!isDashboardExpanded)}
                            turnCount={Math.floor(messages.length / 2)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NurseSimApp;
