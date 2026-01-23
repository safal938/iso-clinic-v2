export interface Message {
  id: string;
  role: 'patient' | 'system' | 'doctor';
  text: string;
  highlights?: string[]; // Substrings to highlight
  timestamp: Date;
}

export interface ClinicalAction {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RiskAnalysis {
  symptom: string;
  correlation: string;
  etiologies: {
    name: string;
    indicators: string;
  }[];
}
