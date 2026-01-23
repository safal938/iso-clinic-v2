import { GridConfig, Patient, PatientStatus } from './types';

export const CELL_SIZE = 60;
export const CELL_GAP = 12;
export const GRID_PADDING = 32;
export const HEADER_HEIGHT = 60;

export const INITIAL_VIEWPORT = {
  scale: 0.65,
  x: 50,
  y: 50
};

export const GRIDS: GridConfig[] = [
  // Inputs
  { id: 'direct-referral', title: 'Direct Patient Self-Referral', description: 'Walk-ins', x: 0, y: 0, rows: 3, cols: 4, type: 'input' },
  { id: 'gp-referral', title: 'GP & Primary Care Referrals', description: 'Standard channel', x: 0, y: 300, rows: 3, cols: 4, type: 'input' },
  { id: 'local-trust', title: 'Local Trust Referral', description: 'Inter-department', x: 0, y: 600, rows: 3, cols: 4, type: 'input' },
  { id: 'icb-transfer', title: 'Integrated Care Board (ICB)', description: 'Transfers', x: 0, y: 900, rows: 3, cols: 4, type: 'input' },

  // Central Intake
  { id: 'intake', title: 'Referral Intake & Initial Review', description: 'Central processing', x: 500, y: 400, rows: 6, cols: 8, type: 'process' },

  // Triage & Management
  { id: 'gp-manage', title: 'GP Management & Discharge', description: 'Returned to GP', x: 1000, y: 100, rows: 4, cols: 4, type: 'output' },
  { id: 'clinical-triage', title: 'Clinical Triage Assessment', description: 'Assessment required', x: 1000, y: 450, rows: 5, cols: 4, type: 'process' },

  // Specialized Paths
  { id: 'urgent-hep', title: 'Urgent Hepatology Review', description: 'Priority 1', x: 1500, y: 300, rows: 3, cols: 4, type: 'process' },
  { id: 'routine-tier1', title: 'Routine Tier 1 Clinic', description: 'Standard care', x: 1500, y: 600, rows: 3, cols: 4, type: 'process' },
  { id: 'complex-tier2', title: 'Complex Tier 2 Clinic', description: 'Multidisciplinary', x: 1500, y: 900, rows: 3, cols: 4, type: 'process' },
  { id: 'external', title: 'External Specialist Referral', description: 'Out of network', x: 1500, y: 1200, rows: 3, cols: 4, type: 'output' },

  // Diagnostics (End nodes)
  { id: 'diag-1', title: 'Pre-Clinic Workup & Diagnostics', description: 'Lab panel A', x: 2000, y: 300, rows: 2, cols: 4, type: 'output' },
  { id: 'diag-2', title: 'Pre-Clinic Workup & Diagnostics', description: 'Lab panel B', x: 2000, y: 600, rows: 2, cols: 4, type: 'output' },
  { id: 'diag-3', title: 'Pre-Clinic Workup & Diagnostics', description: 'Imaging', x: 2000, y: 900, rows: 2, cols: 4, type: 'output' },
  { id: 'diag-4', title: 'Pre-Clinic Workup & Diagnostics', description: 'Specialized tests', x: 2000, y: 1200, rows: 2, cols: 4, type: 'output' },
];

export const CONNECTIONS = [
  // Inputs to Intake
  { from: 'direct-referral', to: 'intake' },
  { from: 'gp-referral', to: 'intake' },
  { from: 'local-trust', to: 'intake' },
  { from: 'icb-transfer', to: 'intake' },

  // Intake to Next Steps
  { from: 'intake', to: 'gp-manage' },
  { from: 'intake', to: 'clinical-triage' },

  // Triage to Clinics
  { from: 'clinical-triage', to: 'urgent-hep' },
  { from: 'clinical-triage', to: 'routine-tier1' },
  { from: 'clinical-triage', to: 'complex-tier2' },
  { from: 'clinical-triage', to: 'external' },

  // Clinics to Diagnostics
  { from: 'urgent-hep', to: 'diag-1' },
  { from: 'routine-tier1', to: 'diag-2' },
  { from: 'complex-tier2', to: 'diag-3' },
  { from: 'external', to: 'diag-4' },
];

const NAMES = ['John D.', 'Jane S.', 'Mike R.', 'Sarah L.', 'Tom H.', 'Emily B.', 'David W.', 'Alice C.', 'Robert M.', 'Lisa K.', 'Paul B.', 'Kevin N.', 'Laura F.', 'Emma W.', 'Olivia T.', 'Daniel S.', 'Sophia R.', 'James L.'];
const CONDITIONS = ['Viral Hepatitis', 'Liver Cirrhosis', 'Fatty Liver', 'Autoimmune', 'Alcohol-related', 'Metabolic Syndrome', 'Hemochromatosis', 'Wilson Disease', 'PSC', 'PBC'];

const REFERRAL_SOURCES = ['GP: Dr. Smith', 'GP: Dr. Jones', 'City General Hospital', 'Self-Referral Portal', 'Community Health Center'];
const REFERRAL_SUMMARIES = [
  'Patient presents with persistent RUQ pain and elevated LFTs (ALT 150, AST 120). No history of alcohol abuse.',
  'Routine screening detected positive Hep C antibody. PCR confirmation pending. Asymptomatic.',
  'Known cirrhosis patient, reporting increased abdominal distension and fatigue over 2 weeks.',
  'Abnormal ultrasound findings suggestive of fatty liver. BMI 32. Requesting specialist review.',
  'Transfer request for specialized fibroscan assessment. Previous history of autoimmune hepatitis.'
];
const TRIAGE_NOTES = [
  'Requires urgent fibroscan. Prioritize for hepatology clinic.',
  'Standard referral. Route to Tier 1 for lifestyle intervention.',
  'Complex case with multiple comorbidities. Assign to MDT review.',
  'Insufficient data. Request repeat bloods before clinic assignment.'
];
const CLINICIANS = ['Dr. P. Chen', 'Dr. A. Gupta', 'Dr. S. Williams', 'Prof. M. Rossi'];
const DISCHARGE_REASONS = [
  'Liver function tests normalized. Monitor in primary care.',
  'Condition stable. No specialist intervention required at this time.',
  'Incidental finding benign. Routine GP follow-up recommended.',
  'Referral criteria for specialist hepatology not met.',
  'Alcohol-related fatty liver. Advise lifestyle modification and community support.'
];

function generateMockPatients(targetTotal: number): Patient[] {
  const patients: Patient[] = [];
  let patientCounter = 0;

  const unitVolume = Math.floor(targetTotal / 4.5);
  
  const createPatient = (gridId: string) => {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const initials = name.split(' ').map(n => n[0]).join('');
    let status = PatientStatus.POOL;
    const sRand = Math.random();
    if (sRand > 0.9) status = PatientStatus.CRITICAL;
    else if (sRand > 0.75) status = PatientStatus.MODERATE;
    else if (sRand > 0.5) status = PatientStatus.STABLE;

    const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
    
    const isIntakeOrLater = gridId === 'intake' || (gridId !== 'direct-referral' && !gridId.includes('input'));
    const isTriageOrLater = ['clinical-triage', 'urgent-hep', 'routine-tier1', 'complex-tier2', 'external', 'diag-1', 'diag-2', 'diag-3', 'diag-4'].includes(gridId);
    const isClinicOrLater = ['urgent-hep', 'routine-tier1', 'complex-tier2', 'external', 'diag-1', 'diag-2', 'diag-3', 'diag-4'].includes(gridId);
    const isDiag = gridId.includes('diag');
    const isGPManage = gridId === 'gp-manage';

    const p: Patient = {
      id: `p-${patientCounter++}`,
      name: `${name} (${patientCounter})`,
      initials,
      status,
      gridId,
      age: 20 + Math.floor(Math.random() * 60),
      condition
    };

    if (isIntakeOrLater) {
      p.referralSource = REFERRAL_SOURCES[Math.floor(Math.random() * REFERRAL_SOURCES.length)];
      p.referralDate = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toLocaleDateString();
      p.referralSummary = REFERRAL_SUMMARIES[Math.floor(Math.random() * REFERRAL_SUMMARIES.length)];
    }

    if (isTriageOrLater) {
      p.triageNotes = TRIAGE_NOTES[Math.floor(Math.random() * TRIAGE_NOTES.length)];
      p.priorityScore = Math.floor(Math.random() * 10) + 1;
    }

    if (isClinicOrLater) {
      p.assignedClinician = CLINICIANS[Math.floor(Math.random() * CLINICIANS.length)];
      p.clinicPlan = "Proceed to diagnostics.";
    }

    if (isGPManage) {
      p.dischargeReason = DISCHARGE_REASONS[Math.floor(Math.random() * DISCHARGE_REASONS.length)];
    }

    if (isDiag) {
      if (gridId === 'diag-1') p.requestedTests = ['Full Liver Panel', 'Viral Load', 'INR'];
      else if (gridId === 'diag-2') p.requestedTests = ['Standard Bloods', 'Lipid Profile'];
      else if (gridId === 'diag-3') p.requestedTests = ['Ultrasound Abdomen', 'Fibroscan'];
      else p.requestedTests = ['MRI Liver', 'Biopsy'];
    }

    patients.push(p);
  };

  const inputGrids = ['direct-referral', 'gp-referral', 'local-trust', 'icb-transfer'];
  for (let i = 0; i < unitVolume; i++) {
    const gridId = inputGrids[Math.floor(Math.random() * inputGrids.length)];
    createPatient(gridId);
  }

  for (let i = 0; i < unitVolume; i++) {
    createPatient('intake');
  }

  let triageCount = 0;
  for (let i = 0; i < unitVolume; i++) {
    if (Math.random() < 0.7) {
      createPatient('clinical-triage');
      triageCount++;
    } else {
      createPatient('gp-manage');
    }
  }

  const clinicCounts = {
    'urgent-hep': 0,
    'routine-tier1': 0,
    'complex-tier2': 0,
    'external': 0
  };
  const clinicIds = Object.keys(clinicCounts) as (keyof typeof clinicCounts)[];

  for (let i = 0; i < triageCount; i++) {
    const gridId = clinicIds[Math.floor(Math.random() * clinicIds.length)];
    createPatient(gridId);
    clinicCounts[gridId]++;
  }

  const diag1Count = Math.floor(clinicCounts['urgent-hep'] * 0.85);
  for (let i = 0; i < diag1Count; i++) createPatient('diag-1');
  
  const diag2Count = Math.floor(clinicCounts['routine-tier1'] * 0.80);
  for (let i = 0; i < diag2Count; i++) createPatient('diag-2');
  
  const diag3Count = Math.floor(clinicCounts['complex-tier2'] * 0.90);
  for (let i = 0; i < diag3Count; i++) createPatient('diag-3');
  
  const diag4Count = Math.floor(clinicCounts['external'] * 0.70);
  for (let i = 0; i < diag4Count; i++) createPatient('diag-4');

  return patients;
}

export const MOCK_PATIENTS = generateMockPatients(150);
