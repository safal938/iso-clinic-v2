import { PatientData, ChecklistItem } from '../types/nurse-sim';

export const INITIAL_CHECKLIST: ChecklistItem[] = [];

export const SCENARIOS: any[] = [
    {
        "patient_id": "P0001",
        "name": "Sarah Miller",
        "age": 43,
        "gender": "Female",
        "complaint": "Jaundice (yellow eyes) and severe itching",
        "medical_history": [
            "Rheumatoid Arthritis",
            "Type 2 Diabetes"
        ],
        "severity": "High",
        // Legacy fields for compatibility
        id: 'methotrexate_or_infection',
        scenarioSecret: "Patient initially presents with symptoms that could be Methotrexate Toxicity OR a viral infection.",
        patient: {
            name: "Sarah Miller",
            date_of_birth: "1981-06-03",
            age: 43,
            sex: "Female",
            age_at_first_encounter: 43,
            identifiers: { mrn: "P0001" }
        },
        riskLevel: "high",
        primaryDiagnosis: "Undifferentiated Abdominal Pain",
        problem_list: [
            { name: "Rheumatoid Arthritis", status: "active" },
            { name: "Type 2 Diabetes", status: "active" }
        ]
    },
    {
        "patient_id": "P0002",
        "name": "David Chen",
        "age": 24,
        "gender": "Male",
        "complaint": "Constant nausea and jaundice (looking orange)",
        "medical_history": [
            "Chronic Back Pain"
        ],
        "severity": "High",
        // Legacy fields for compatibility
        id: 'overdose_or_gastritis',
        scenarioSecret: "Patient presents with nausea and abdominal pain.",
        patient: {
            name: "David Chen",
            date_of_birth: "1999-11-12",
            age: 24,
            sex: "Male",
            age_at_first_encounter: 24,
            identifiers: { mrn: "P0002" }
        },
        riskLevel: "high",
        primaryDiagnosis: "Acute Abdominal Pain",
        problem_list: [
            { name: "Chronic Back Pain", status: "active" }
        ]
    },
    {
        "patient_id": "P0003",
        "name": "Maria Garcia",
        "age": 52,
        "gender": "Female",
        "complaint": "Fatigue and generalized aches (flu-like symptoms)",
        "medical_history": [
            "Hypertension",
            "Recurrent UTIs",
            "Osteoarthritis"
        ],
        "severity": "Medium",
        // Legacy fields for compatibility
        id: 'alcohol_or_medication',
        scenarioSecret: "Patient presents with jaundice and liver symptoms.",
        patient: {
            name: "Maria Garcia",
            date_of_birth: "1972-04-15",
            age: 52,
            sex: "Female",
            age_at_first_encounter: 52,
            identifiers: { mrn: "P0003" }
        },
        riskLevel: "medium",
        primaryDiagnosis: "Jaundice / Hyperbilirubinemia",
        problem_list: [
            { name: "Hypertension", status: "active" },
            { name: "Recurrent UTIs", status: "active" },
            { name: "Osteoarthritis", status: "active" }
        ]
    }
];

export const INITIAL_PATIENT_DATA: PatientData = SCENARIOS[0];
