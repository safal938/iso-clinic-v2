export interface Patient {
    name: string;
    date_of_birth: string;
    age: number;
    sex: string;
    age_at_first_encounter: number;
    identifiers: {
        mrn: string;
    };
}

export interface Problem {
    name: string;
    status: string;
}

export interface ScenarioPath {
    id: string;
    diagnosis: string;
    triggerKeywords: string[];
    secretDetails: string;
}

export interface PatientData {
    id: string;
    scenarioSecret: string;
    possibleScenarios?: ScenarioPath[];
    patient: Patient;
    riskLevel: string;
    primaryDiagnosis: string;
    problem_list: Problem[];
}

export interface MessageHighlight {
    level: 'warning' | 'info';
    text: string;
}

export interface Message {
    id: string;
    role: 'nurse' | 'patient';
    text: string;
    timestamp: Date;
    highlights?: MessageHighlight[];
}

export interface ChecklistItem {
    id: string;
    text: string;
    isCompleted: boolean;
    category: 'fixed' | 'dynamic';
    answer?: string;
}

export interface ChecklistAnswer {
    id: string;
    answer: string;
}

export interface DiagnosticIndicator {
    finding: string;
    source: string;
    significance: 'high' | 'medium' | 'low';
    patientQuote: string;
}

export type SeverityLevel = 'High' | 'Moderate' | 'Low' | 'Very Low';

export interface DiagnosisOption {
    diagnosis: string;
    confidenceScore: number;
    severity: SeverityLevel;
    indicators: DiagnosticIndicator[];
}

export interface SimulationResponse {
    nurseQuestion: string;
    patientReply: string;
    primaryDiagnosis: DiagnosisOption;
    secondaryDiagnosis: DiagnosisOption;
    completedChecklistItems: ChecklistAnswer[];
    newDynamicQuestions: string[];
    activeScenarioId?: string;
    diagnosticPivot?: boolean;
}

export interface DecisionNode {
    id: string;
    label: string;
    status: string;
    nodeType?: 'standard' | 'convergent';
    children?: DecisionNode[];
}
