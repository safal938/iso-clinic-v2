export const monitoringData = {
  "patientProfile": {
    "cc": "Pulmonary Problems",
    "details": "Shortness of breath and cough development",
    "protocol": "Chronic Viral Hepatitis Treatment",
    "medication": "Entecavir 40 ml"
  },
  "riskAnalysis": {
    "symptom": "New Onset Dyspnea",
    "correlation": "Ribavirin therapy carries a high risk of hemolytic anemia, manifesting as dyspnea due to reduced oxygen capacity.",
    "etiologies": [
      { "name": "Hemolytic Anemia", "indicators": "Rapid Hb drop, fatigue, tachycardia" },
      { "name": "Interstitial Pneumonitis", "indicators": "Dry cough, fever, hypoxia" },
      { "name": "Cardiovascular Strain", "indicators": "Pre-existing cardiac disease" }
    ]
  },
  "clinicalActions": {
    "immediate": [
      { "title": "CBC with differential", "description": "Check Hb nadir, Retic count, LDH." },
      { "title": "Pulse oximetry (SpO2)", "description": "Assess for desaturation." },
      { "title": "Imaging (CXR/HRCT)", "description": "Rule out pneumonitis vs anemia." }
    ],
    "triageNote": "Urgent: If Hb drops >2.5 g/dL or is <10 g/dL, reduce/stop Ribavirin.",
    "communication": {
      "plan": "Immediate Phone Call",
      "items": [
        { "label": "Goal", "value": "Assess stability & triage to ER/Clinic." },
        { "label": "Script", "value": "\"Ribavirin can lower red blood cells...\"" }
      ]
    }
  },
  "chatHistory": [
    {
      "id": "1",
      "role": "patient",
      "text": "I've been feeling really tired lately, and just walking up the stairs makes me winded.",
      "timestampOffset": 7200000
    },
    {
      "id": "2",
      "role": "doctor",
      "text": "I see. Have you noticed any changes in your skin color or eyes?",
      "timestampOffset": 6840000
    },
    {
      "id": "3",
      "role": "patient",
      "text": "I have shortness of breath and I cough since I started the new meds.",
      "highlights": ["shortness of breath"],
      "timestampOffset": 6480000
    },
    {
      "id": "4",
      "role": "doctor",
      "text": "Okay, that's important. Are you experiencing any chest pain or fever?",
      "timestampOffset": 6120000
    },
    {
      "id": "5",
      "role": "patient",
      "text": "No fever, but my chest feels tight when I try to breathe deep.",
      "timestampOffset": 5760000
    }
  ]
};

export default monitoringData;
