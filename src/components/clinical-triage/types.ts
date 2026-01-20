export enum PatientStatus {
  POOL = 'POOL',
  CRITICAL = 'CRITICAL',
  MODERATE = 'MODERATE',
  STABLE = 'STABLE'
}

export interface Patient {
  id: string;
  initials: string;
  name: string;
  status: PatientStatus;
  gridId: string;
  age: number;
  condition: string;
  
  // Stage specific data
  referralSource?: string;     // For Intake stage
  referralDate?: string;       // For Intake stage
  referralSummary?: string;    // For Intake stage
  
  triageNotes?: string;        // For Triage stage
  priorityScore?: number;      // For Triage stage
  
  assignedClinician?: string;  // For Clinic stage
  clinicPlan?: string;         // For Clinic stage
  
  dischargeReason?: string;    // For GP Manage stage
  
  requestedTests?: string[];   // For Diagnostic stage
}

export interface GridConfig {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  rows: number;
  cols: number;
  type: 'input' | 'process' | 'output';
}

export interface ViewportState {
  scale: number;
  x: number;
  y: number;
}
