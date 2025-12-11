import React, { useState, useRef, useEffect, useMemo } from 'react';
import BOARD_ITEMS from '../../data/boardItems.json';
import { TimelineAxis, EncounterTrack, MedicationTrack, LabTrack, KeyEventsTrack, RiskTrack, useTimelineScale, MasterGrid } from './timeline';
import { Sidebar } from './Sidebar';
import { MedicalData, PatientData, Encounter, Medication, LabMetric, KeyEvent, RiskPoint } from './types';

// Helper function to extract data from boardItems.json
const extractTimelineData = (boardItems: any[]) => {
  // Find the sidebar component for patient data
  const sidebarItem = boardItems.find(item => item.componentType === 'Sidebar');
  const patientData: PatientData | undefined = sidebarItem?.content?.props?.patientData;

  // Find encounter track
  const encounterTrack = boardItems.find(item => item.componentType === 'EncounterTrack');
  const encounters: Encounter[] = encounterTrack?.content?.props?.encounters || [];

  // Find medication track
  const medicationTrack = boardItems.find(item => item.componentType === 'MedicationTrack');
  const medications: Medication[] = (medicationTrack?.content?.props?.medications || []).map((med: any) => ({
    name: med.name,
    startDate: med.startDate,
    endDate: med.endDate,
    dose: med.dose,
    indication: med.indication
  }));

  // Find lab table for lab data
  const labTable = boardItems.find(item => item.componentType === 'LabTable');
  
  // Build lab timeline from LabTable data
  const labTimeline: LabMetric[] = [];
  if (labTable?.content?.props?.labResults) {
    labTable.content.props.labResults.forEach((lab: any) => {
      const rangeMatch = lab.normalRange?.match(/([0-9.]+)-([0-9.]+)/);
      labTimeline.push({
        biomarker: lab.name,
        unit: lab.unit,
        referenceRange: rangeMatch ? {
          min: parseFloat(rangeMatch[1]),
          max: parseFloat(rangeMatch[2])
        } : undefined,
        values: [{
          t: `${lab.date}T09:00:00`,
          value: lab.value
        }]
      });
    });
  }

  // Find key events track
  const keyEventsTrack = boardItems.find(item => item.componentType === 'KeyEventsTrack');
  const keyEvents: KeyEvent[] = keyEventsTrack?.content?.props?.events || [];

  // Find risk track
  const riskTrack = boardItems.find(item => item.componentType === 'RiskTrack');
  const riskTimeline: RiskPoint[] = riskTrack?.content?.props?.risks || [];

  return {
    patientData,
    props: {
      encounters,
      medicationTimeline: medications,
      labTimeline,
      keyEvents,
      riskTimeline
    }
  };
};

export const Dashboard: React.FC = () => {
  // Extract data from boardItems.json
  const timelineData = useMemo(() => extractTimelineData(BOARD_ITEMS as any[]), []);
  
  const [timelineProps] = useState<MedicalData['props']>(timelineData.props);
  const [patientData] = useState<PatientData | undefined>(timelineData.patientData);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use medications directly from the data
  const allMedications = timelineProps.medicationTimeline;

  // Debug: Log the imported data to verify chief_complaint is present
  useEffect(() => {
    console.log('Loaded encounters:', timelineProps.encounters.map(e => ({
      no: e.encounter_no,
      has_chief_complaint: !!e.chief_complaint,
      chief_complaint: e.chief_complaint
    })));
  }, [timelineProps]);

  // Use the polylinear scale based on encounters
  // The hook now returns the calculated width based on variable spacing
  // paddingLeft needs to be at least half the card width (130px) + buffer to prevent sidebar overlap
  const { scale, width } = useTimelineScale(timelineProps.encounters, 150, 160);

  if (loading) {
      return (
          <div className="flex items-center justify-center h-screen bg-gray-50">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-medium">Loading Patient Timeline...</p>
              </div>
          </div>
      );
  }

  if (error) {
      return (
          <div className="flex items-center justify-center h-screen bg-gray-50">
              <div className="p-6 bg-white rounded-lg shadow-sm border border-red-100 max-w-md text-center">
                  <div className="text-red-500 text-xl font-bold mb-2">Error</div>
                  <p className="text-slate-600">{error}</p>
              </div>
          </div>
      );
  }

  return (
    <div className="flex bg-gray-100 text-slate-800 font-sans min-h-full" style={{ width: width + 300 }}>
      {/* Left Sidebar */}
      {patientData && <Sidebar patientData={patientData} />}

      {/* Main Content */}
      <div className="flex flex-col min-h-full" style={{ width: width }}>
        
        {/* Simple Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between shrink-0 z-20" style={{ width: width }}>
            <div className="flex items-center gap-2">
                <span className="text-blue-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </span>
                <h1 className="font-bold text-slate-800 text-lg tracking-tight">Master Timeline</h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>Patient Timeline</span>
            </div>
        </header>

        {/* Timeline Area */}
        <main className="bg-slate-50/50 relative" ref={containerRef} style={{ width: width }}>
            <div style={{ width: width }} className="bg-white shadow-sm relative">
                <MasterGrid encounters={timelineProps.encounters} scale={scale} height="100%" />
                
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200">
                    <TimelineAxis encounters={timelineProps.encounters} scale={scale} />
                </div>
                
                {/* Reduced gap for compact view */}
                <div className="relative z-20 pt-2 flex flex-col gap-1">
                    <EncounterTrack encounters={timelineProps.encounters} scale={scale} />
                    <MedicationTrack medications={allMedications} scale={scale} />
                    <LabTrack labs={timelineProps.labTimeline} scale={scale} />
                    {/* Risk Track Component */}
                    {timelineProps.riskTimeline && timelineProps.riskTimeline.length > 0 && (
                         <RiskTrack data={timelineProps.riskTimeline} scale={scale} />
                    )}
                    <KeyEventsTrack events={timelineProps.keyEvents} scale={scale} />
                </div>
            </div>
        </main>
      </div>
      
    </div>
  );
};
