import { Patient } from './types';

const getLocalImg = (filename: string) => `/images/${filename}`;

export const MOCK_PATIENTS: Patient[] = [
  {
    id: "P0001",
    name: "Marcus Mark Elias Thorne",
    age: 46,
    gender: "Male",
    diagnosis: "Jaundice & Severe Itching",
    status: "Critical",
    lastVisit: "2023-10-24",
    roomNumber: "Waitlist",
    image: "",
    symptoms: ["Jaundice", "Yellow eyes", "Severe itching", "Dark urine"],
    notes: "Mr. Thorne is a 46-year-old construction foreman presenting with a 3-day history of progressive jaundice, scleral icterus, and intense generalized pruritus. History significant for recent dental abscess treated with Amoxicillin-Clavulanate and high-dose acetaminophen.",
    occupation: "Site Foreman",
    maritalStatus: "Married",
    contact: {
      phone: "+44 7700 900555",
      email: "m.thorne78@example.com",
      address: {
        street: "22 Brick Lane, Flat 4B",
        city: "London",
        state: "Greater London",
        zipCode: "E1 6RF"
      },
      emergency: {
        name: "Janice Thorne",
        relation: "Sister",
        phone: "+44 7700 900199"
      }
    },
    medical_history: ["Dental Abscess (Recent)"],
    allergies: [],
    description: "46-year-old male presenting with acute onset jaundice.",
    severity: "High",
    pre_consultation: {
      documents: [
        getLocalImg("lab1.png"), 
        getLocalImg("lab2.png"),
        getLocalImg("nhs_screenshot.png"),
        getLocalImg("radiology.png"),
        "/referal_letter.png",
        getLocalImg("clinicnote2.png"),
      ],
      chat: [
        { role: "admin", message: "Good morning! This is Linda at the Hepatology Clinic admin desk. How can I help you today?" },
        { role: "patient", message: "Yeah, hi. I need to schedule a clinic visit. Something's wrong—my eyes are turning yellow and I'm itching like crazy. It feels like there are ants under my skin." },
        { role: "admin", message: "I'm sorry to hear you're uncomfortable, Mr. Thorne. Have you already booked an appointment request through the NHS app?" },
        { role: "patient", message: "Yes, I did that this morning." },
        { role: "admin", message: "Great. Could you please send a screenshot of the booking reference from the app so I can locate your request in our system?" },
        { role: "patient", attachment: getLocalImg("nhs_screenshot.png") },
        { role: "admin", message: "Thank you, I found your request. Since this is your first time visiting the Hepatology department specifically, I need you to confirm your current details and complete a brief intake form." },
        { role: "admin", object: { formType: "emptyRequest" } },
        {
          role: "patient",
          message: "Done. I filled out the form.",
          object: {
            formType: "filledResponse",
            firstName: "Marcus",
            lastName: "Thorne Elias",
            dob: "1978-08-14",
            email: "m.thorne78@example.com",
            phone: "+44 7700 900555",
            complaint: "Jaundice (yellow eyes) and severe itching",
            medicalHistory: ["Dental Abscess (Recent)"]
          }
        },
        { role: "admin", message: "Thanks, Marcus. Your profile is updated. Based on your request, Dr. A. Gupta has the following slots available for an urgent consultation:" },
        {
          role: "admin",
          object: {
            doctorName: "Dr. A. Gupta",
            specialty: "Hepatology",
            availableSlots: [
              { slotId: "SLOT_10_AM", date: "2025-12-10", time: "09:30 AM", type: "In-Person" },
              { slotId: "SLOT_11_PM", date: "2025-12-11", time: "02:00 PM", type: "In-Person" },
              { slotId: "SLOT_12_AM", date: "2025-12-12", time: "10:00 AM", type: "In-Person" }
            ]
          }
        },
        { role: "patient", message: "I'll take the first one. Wednesday the 10th at 9:30. I need to get this sorted out fast." },
        { role: "admin", message: "Understood. That is confirmed. Here are your appointment details:" },
        {
          role: "admin",
          object: {
            appointmentId: "APT-HEP-2025-9901",
            status: "Confirmed",
            schedule: {
              date: "2025-12-10",
              time: "09:30 AM",
              provider: "Dr. A. Gupta",
              location: "Royal London Hospital – Hepatology Department, Whitechapel",
              instructions: "Arrive 10 minutes early. Fast for 8 hours."
            }
          }
        },
        { role: "admin", message: "To help Dr. Gupta understand your condition before you arrive, please upload the screenshots of your most recent lab results (Blood work)." },
        { role: "patient", attachment: getLocalImg("lab1.png") },
        { role: "patient", attachment: getLocalImg("lab2.png") },
        { role: "admin", message: "Received. Do you have any recent radiology reports? Specifically the Ultrasound mentioned in your intake?" },
        { role: "patient", attachment: getLocalImg("radiology.png") },
        { role: "admin", message: "Got it. Do you have the digital copy of the referral letter from the Urgent Care center you visited?" },
        { role: "patient", attachment: "/referal_letter.png" },
        { role: "admin", message: "Thank you. Lastly, to build a complete timeline, do you have the encounter report or screenshot from your previous dental visit 3 weeks ago where the antibiotics were prescribed?" },
        { role: "patient", message: "Yeah, I have the discharge summary from the dental clinic. Here." },
        { role: "patient", attachment: getLocalImg("clinicnote2.png") },
        { role: "admin", message: "Perfect. I have uploaded all documents to your file. Dr. Gupta will review these before you come in on Wednesday the 10th. Please try to stay hydrated. Goodbye!" }
      ]
    }
  },
  {
    id: "P0002",
    name: "Elena Maria Rosales",
    age: 32,
    gender: "Female",
    diagnosis: "Constant Nausea",
    status: "Critical",
    lastVisit: "2023-10-22",
    image: "",
    symptoms: ["Nausea", "Jaundice"],
    severity: "High"
  },
  {
    id: "P0003",
    name: "Margaret Peggy Louise O'Neil",
    age: 68,
    gender: "Female",
    diagnosis: "General Fatigue",
    status: "Recovering",
    lastVisit: "2023-10-20",
    image: "",
    symptoms: ["Fatigue", "Aches"],
    severity: "Medium",
    medical_history: ["Hypertension", "UTIs", "Osteoarthritis"]
  }
];

export const STATUS_COLORS: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  Stable: "bg-green-100 text-green-700 border-green-200",
  Recovering: "bg-blue-100 text-blue-700 border-blue-200",
  Discharged: "bg-gray-100 text-gray-700 border-gray-200",
};
