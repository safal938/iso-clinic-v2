import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PatientInfo from './PatientInfo';
import ChatInterface from './ChatInterface';
import ClinicalDashboard from './ClinicalDashboard';
import { Message, ChecklistItem, PatientData, DiagnosisOption } from '../../types/nurse-sim';
import completedAssessment from '../../data/completed-assessment.json';

interface StaticSimData {
    messages: Message[];
    checklist: ChecklistItem[];
    primaryDiagnosis: DiagnosisOption;
    secondaryDiagnosis: DiagnosisOption;
    elapsedTime: number;
}

// Transform completed-assessment.json data to the format needed by components
const transformAssessmentData = (): StaticSimData => {
    const data = completedAssessment as any;
    
    // Transform messages from conversation
    const messages: Message[] = data.conversation.map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'nurse' | 'patient',
        text: msg.text,
        timestamp: new Date(msg.timestamp),
        highlights: msg.highlights?.map((h: any) => ({
            level: h.level === 'danger' ? 'warning' : h.level,
            text: h.text
        })) || []
    }));

    // Transform checklist
    const checklist: ChecklistItem[] = data.checklist.map((item: any) => ({
        id: item.id,
        text: item.text,
        isCompleted: item.isCompleted,
        category: item.category as 'fixed' | 'dynamic',
        answer: item.answer
    }));

    // Transform diagnoses
    const diagnoses = data.differentialDiagnoses || [];
    const primaryDiag = diagnoses[0];
    const secondaryDiag = diagnoses[1];

    const primaryDiagnosis: DiagnosisOption = primaryDiag ? {
        diagnosis: primaryDiag.diagnosis,
        confidenceScore: primaryDiag.indicators_count * 8,
        severity: primaryDiag.severity || 'High',
        indicators: primaryDiag.indicators_point.map((point: string) => ({
            finding: point,
            source: 'Patient reported',
            significance: 'high' as const,
            patientQuote: point
        }))
    } : { diagnosis: "Pending Assessment...", confidenceScore: 0, severity: 'Very Low', indicators: [] };

    const secondaryDiagnosis: DiagnosisOption = secondaryDiag ? {
        diagnosis: secondaryDiag.diagnosis,
        confidenceScore: secondaryDiag.indicators_count * 7,
        severity: secondaryDiag.severity || 'Moderate',
        indicators: secondaryDiag.indicators_point.map((point: string) => ({
            finding: point,
            source: 'Patient reported',
            significance: 'medium' as const,
            patientQuote: point
        }))
    } : { diagnosis: "Pending Assessment...", confidenceScore: 0, severity: 'Very Low', indicators: [] };

    // Parse elapsed time from duration string (e.g., "5:51")
    const durationParts = data.assessment?.duration?.split(':') || ['0', '0'];
    const elapsedTime = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);

    return {
        messages,
        checklist,
        primaryDiagnosis,
        secondaryDiagnosis,
        elapsedTime
    };
};

// Build patient data from the JSON
const buildPatientData = (): PatientData => {
    const data = completedAssessment as any;
    return {
        id: data.patient.id,
        scenarioSecret: '',
        patient: {
            name: data.patient.name,
            date_of_birth: data.patient.date_of_birth,
            age: data.patient.age,
            sex: data.patient.sex,
            age_at_first_encounter: data.patient.age,
            identifiers: {
                mrn: data.patient.mrn
            }
        },
        riskLevel: 'high',
        primaryDiagnosis: data.differentialDiagnoses?.[0]?.diagnosis || 'Under Assessment',
        problem_list: data.differentialDiagnoses?.slice(0, 3).map((d: any) => ({
            name: d.diagnosis,
            status: d.probability
        })) || []
    };
};

const NurseSimStatic: React.FC = () => {
    const navigate = useNavigate();

    // Patient State - built from JSON
    const [patientData] = useState<PatientData>(buildPatientData());
    
    // Static Data State - transformed from JSON
    const [staticData] = useState<StaticSimData>(transformAssessmentData());
    
    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);

    const handleChangeScenario = () => {
        navigate('/');
    };

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
                            messages={staticData.messages}
                            isSimulationActive={false}
                            onToggleSimulation={() => {}}
                            onReset={() => {}}
                            isProcessing={false}
                            elapsedTime={staticData.elapsedTime}
                            timerStarted={staticData.elapsedTime > 0}
                            isCompact={isDashboardExpanded}
                            connectionStatus="disconnected"
                            isTogglingSimulation={false}
                        />
                    </div>

                    <div className={`${getDashboardWidth()} h-full overflow-hidden transition-all duration-500 ease-in-out`}>
                        <ClinicalDashboard 
                            checklist={staticData.checklist}
                            primaryDiagnosis={staticData.primaryDiagnosis}
                            secondaryDiagnosis={staticData.secondaryDiagnosis}
                            diagnosticPivot={false}
                            isExpanded={isDashboardExpanded}
                            onToggleExpand={() => setIsDashboardExpanded(!isDashboardExpanded)}
                            turnCount={Math.floor(staticData.messages.length / 2)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NurseSimStatic;
