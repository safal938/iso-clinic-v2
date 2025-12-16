export interface ChatObject {
  formType?: 'emptyRequest' | 'filledResponse';
  firstName?: string;
  lastName?: string;
  dob?: string;
  email?: string;
  phone?: string;
  complaint?: string;
  medicalHistory?: string[];
  contact?: any;
  doctorName?: string;
  specialty?: string;
  availableSlots?: Array<{
    slotId: string;
    date: string;
    time: string;
    type: string;
  }>;
  appointmentId?: string;
  status?: string;
  schedule?: {
    date: string;
    time: string;
    provider: string;
    location: string;
    instructions: string;
  };
}

export interface ChatMessage {
  role: 'admin' | 'patient';
  message?: string;
  attachment?: string;
  object?: ChatObject;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Non-binary';
  diagnosis: string;
  status: 'Critical' | 'Stable' | 'Recovering' | 'Discharged';
  lastVisit: string;
  roomNumber?: string;
  image: string;
  symptoms: string[];
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
    documents: string[];
    chat: ChatMessage[];
  };
}
