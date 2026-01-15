import { Patient, PatientStatus } from '../types/nurse-sim';

const BASE_PATIENTS: Patient[] = [
  {
    id: 'P0001',
    firstName: 'Marcus',
    middleName: 'Mark Elias',
    lastName: 'Thorne',
    age: 46,
    gender: 'Male',
    diagnosis: 'Jaundice & Severe Itching',
    status: PatientStatus.Critical,
    lastUpdate: '2023-10-24'
  },
  {
    id: 'P0002',
    firstName: 'Elena',
    middleName: 'Maria',
    lastName: 'Rosales',
    age: 32,
    gender: 'Female',
    diagnosis: 'Constant Nausea',
    status: PatientStatus.Critical,
    lastUpdate: '2023-10-22'
  },
  {
    id: 'P0003',
    firstName: 'Margaret',
    middleName: 'Peggy Louise',
    lastName: "O'Neil",
    age: 68,
    gender: 'Female',
    diagnosis: 'General Fatigue',
    status: PatientStatus.Recovering,
    lastUpdate: '2023-10-20'
  },
  {
    id: 'P0004',
    firstName: 'David',
    lastName: 'Chen',
    age: 55,
    gender: 'Male',
    diagnosis: 'Hypertension',
    status: PatientStatus.Stable,
    lastUpdate: '2023-10-19'
  },
  {
    id: 'P0005',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    age: 29,
    gender: 'Female',
    diagnosis: 'Migraine with Aura',
    status: PatientStatus.Stable,
    lastUpdate: '2023-10-18'
  },
  {
    id: 'P0006',
    firstName: 'Robert',
    lastName: 'Fox',
    age: 71,
    gender: 'Male',
    diagnosis: 'Arrhythmia',
    status: PatientStatus.Critical,
    lastUpdate: '2023-10-24'
  },
  {
    id: 'P0007',
    firstName: 'Emily',
    lastName: 'Watson',
    age: 41,
    gender: 'Female',
    diagnosis: 'Type 2 Diabetes',
    status: PatientStatus.Stable,
    lastUpdate: '2023-10-17'
  },
  {
    id: 'P0008',
    firstName: 'James',
    lastName: 'Kowalski',
    age: 63,
    gender: 'Male',
    diagnosis: 'Chronic Bronchitis',
    status: PatientStatus.Recovering,
    lastUpdate: '2023-10-16'
  },
  {
    id: 'P0009',
    firstName: 'Anita',
    lastName: 'Patel',
    age: 52,
    gender: 'Female',
    diagnosis: 'Rheumatoid Arthritis',
    status: PatientStatus.Stable,
    lastUpdate: '2023-10-15'
  },
  {
    id: 'P0010',
    firstName: 'William',
    lastName: 'Hau',
    age: 24,
    gender: 'Male',
    diagnosis: 'Appendicitis Post-Op',
    status: PatientStatus.Discharged,
    lastUpdate: '2023-10-14'
  },
  {
    id: 'P0011',
    firstName: 'Patricia',
    lastName: 'Lomm',
    age: 81,
    gender: 'Female',
    diagnosis: 'Fractured Hip',
    status: PatientStatus.Critical,
    lastUpdate: '2023-10-24'
  },
  {
    id: 'P0012',
    firstName: 'Michael',
    lastName: 'Jordan',
    age: 45,
    gender: 'Male',
    diagnosis: 'Flu Symptoms',
    status: PatientStatus.Stable,
    lastUpdate: '2023-10-23'
  },
  {
    id: 'P0013',
    firstName: 'Linda',
    lastName: 'Garret',
    age: 36,
    gender: 'Female',
    diagnosis: 'Anemia',
    status: PatientStatus.Recovering,
    lastUpdate: '2023-10-21'
  },
  {
    id: 'P0014',
    firstName: 'Thomas',
    lastName: 'Shelby',
    age: 39,
    gender: 'Male',
    diagnosis: 'Insomnia',
    status: PatientStatus.Stable,
    lastUpdate: '2023-10-20'
  },
  {
    id: 'P0015',
    firstName: 'Ada',
    lastName: 'Lovelace',
    age: 32,
    gender: 'Female',
    diagnosis: 'Carpal Tunnel',
    status: PatientStatus.Stable,
    lastUpdate: '2023-10-19'
  },
  {
    id: 'P0016',
    firstName: 'Grace',
    lastName: 'Hopper',
    age: 76,
    gender: 'Female',
    diagnosis: 'Glaucoma',
    status: PatientStatus.Stable,
    lastUpdate: '2023-10-18'
  },
  {
    id: 'P0017',
    firstName: 'Alan',
    lastName: 'Turing',
    age: 41,
    gender: 'Male',
    diagnosis: 'Allergic Reaction',
    status: PatientStatus.Critical,
    lastUpdate: '2023-10-24'
  },
  {
    id: 'P0018',
    firstName: 'Katherine',
    lastName: 'Johnson',
    age: 98,
    gender: 'Female',
    diagnosis: 'Pneumonia',
    status: PatientStatus.Recovering,
    lastUpdate: '2023-10-22'
  }
];

export const MOCK_PATIENTS = BASE_PATIENTS;
