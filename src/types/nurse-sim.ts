export enum PatientStatus {
  Critical = 'Critical',
  Recovering = 'Recovering',
  Stable = 'Stable',
  Discharged = 'Discharged'
}


export interface Patient {
  id: string;
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Non-binary';
  diagnosis: string;
  status: 'Critical' | 'Stable' | 'Recovering' | 'Discharged';
  lastVisit?: string;
  lastUpdate?: string;
  roomNumber?: string;
  image?: string;
  symptoms?: string[];
  notes?: string;
  dob?: string;
  occupation?: string;
  maritalStatus?: string;
  contact?: any;
  medical_history?: string[];
  allergies?: string[];
  description?: string;
  severity?: string;
  pre_consultation?: {
    documents?: string[];
    chat?: ChatMessage[];
  };
}

// Backend response types
export interface Diagnosis {
  did: string;
  headline: string;
  diagnosis: string;
  indicators_point: Array<{
    criteria: string;
    check: boolean;
  }>;
  reasoning: string;
  followup_question: string;
  rank: number;
  severity: 'High' | 'Moderate' | 'Low' | string;
}

export interface Question {
  qid: string;
  content: string;
  rank: number;
  status: 'asked' | null;
  answer: string | null;
  headline: string;
  domain: string;
  system_affected: string;
  clinical_intent: string;
  tags: string[];
}

export interface ChatMessage {
  role: 'Nurse' | 'Patient' | 'admin' | 'patient';
  message?: string;
  highlights?: string[];
  attachment?: string;
  object?: {
    formType?: 'emptyRequest' | 'filledResponse';
    firstName?: string;
    lastName?: string;
    dob?: string;
    email?: string;
    phone?: string;
    complaint?: string;
    medicalHistory?: string[];
    doctorName?: string;
    specialty?: string;
    availableSlots?: Array<{
      slotId: string;
      date: string;
      time: string;
      type?: string;
    }>;
    appointmentId?: string;
    status?: string;
    schedule?: {
      provider?: string;
      location?: string;
      date?: string;
      time?: string;
      instructions?: string;
    };
  };
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  category: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  status: 'asked' | null;
}

export interface EducationItem {
  headline: string;
  content: string;
  category: string;
  urgency: 'High' | 'Normal' | 'Low' | string;
  context_reference: string;
  reasoning?: string;
  status?: 'asked' | 'pending';
}

export interface AnalyticsMetric {
  score: number;
  reasoning: string;
  example_quote?: string;
  feedback?: string;
  turn_taking_ratio?: string;
  pros?: string;
  cons?: string;
}

export interface AnalyticsData {
  overall_score: number;
  metrics: {
    empathy: AnalyticsMetric;
    clarity: AnalyticsMetric;
    information_gathering: AnalyticsMetric;
    patient_engagement: AnalyticsMetric;
  };
  key_strengths: string[];
  improvement_areas: string[];
  sentiment_trend: string;
}

// API Response wrappers
export interface DiagnosisResponse {
  type: 'diagnosis';
  diagnosis: Diagnosis[];
  source: string;
}

export interface QuestionsResponse {
  type: 'questions';
  questions: Question[];
  source: string;
}

export interface ChatResponse {
  type: 'chat';
  data: ChatMessage[];
  source: string;
}

export interface EducationResponse {
  type: 'education';
  data: EducationItem[];
  source: string;
}

export interface AnalyticsResponse {
  type: 'analytics';
  data: AnalyticsData;
  source: string;
}

export interface ReportData {
  clinical_handover: {
    hpi_narrative: string;
    key_biomarkers_extracted: string[];
    clinical_impression_summary: string;
    suggested_doctor_actions: string[];
  };
  audit_summary: {
    performance_narrative: string;
    areas_for_improvement_summary: string;
  };
}

export interface ReportResponse {
  type: 'report';
  data: ReportData;
  source: string;
}
