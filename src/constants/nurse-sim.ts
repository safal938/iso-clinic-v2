import { PatientData, ChecklistItem } from '../types/nurse-sim';

// Initial checklist - backend will provide questions dynamically
export const INITIAL_CHECKLIST: ChecklistItem[] = [];

export const SCENARIOS: PatientData[] = [
  {
    id: "P0001",
    scenarioSecret: "",
    patient: {
      name: "Marcus Mark Elias Thorne",
      date_of_birth: "1979-03-15",
      age: 46,
      sex: "Male",
      age_at_first_encounter: 46,
      identifiers: {
        mrn: "MRN-0001"
      }
    },
    riskLevel: "high",
    primaryDiagnosis: "Jaundice (yellow eyes) and severe itching",
    problem_list: [
      { name: "Dental Abscess (Recent)", status: "active" }
    ]
  },
  {
    id: "P0002",
    scenarioSecret: "",
    patient: {
      name: "Elena Maria Rosales",
      date_of_birth: "1993-07-22",
      age: 32,
      sex: "Female",
      age_at_first_encounter: 32,
      identifiers: {
        mrn: "MRN-0002"
      }
    },
    riskLevel: "high",
    primaryDiagnosis: "Constant nausea and jaundice (looking orange)",
    problem_list: []
  },
  {
    id: "P0003",
    scenarioSecret: "",
    patient: {
      name: "Margaret Peggy Louise O'Neil",
      date_of_birth: "1957-11-08",
      age: 68,
      sex: "Female",
      age_at_first_encounter: 68,
      identifiers: {
        mrn: "MRN-0003"
      }
    },
    riskLevel: "medium",
    primaryDiagnosis: "Fatigue and generalized aches (flu-like symptoms)",
    problem_list: [
      { name: "Hypertension", status: "active" },
      { name: "Recurrent Urinary Tract Infections (UTIs)", status: "active" },
      { name: "Osteoarthritis", status: "active" }
    ]
  }
];

export const INITIAL_PATIENT_DATA: PatientData = SCENARIOS[0];
