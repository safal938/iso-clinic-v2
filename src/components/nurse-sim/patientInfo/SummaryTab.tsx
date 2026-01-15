import React from 'react';
import { Activity, Stethoscope, User, Clock, Droplet } from 'lucide-react';
import { highlightText } from './utils';
import patientSummaryData from '../../../data/nurse-sim/patient_summary.json';
import { ElevatedCard } from './BiomarkerCards';

export const SummaryTab: React.FC = () => {
  return (
    <div className="xl:max-w-[70%] mx-auto space-y-5">
      {/* Chief Complaint */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Chief Complaint</span>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-4 leading-tight">
          {highlightText(patientSummaryData.chiefComplaint.text, patientSummaryData.chiefComplaint.highlights)}
        </h2>
        <p className="text-base text-neutral-700 leading-relaxed">
          {highlightText(patientSummaryData.reasonForVisit.text, patientSummaryData.reasonForVisit.highlights)}
        </p>
      </div>

      {/* Clinical Impression */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Clinical Impression</span>
        </div>
        <p className="text-xl font-bold text-neutral-900 mb-3 leading-tight">
          {highlightText(patientSummaryData.clinicalImpression.text, patientSummaryData.clinicalImpression.highlights)}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-neutral-500 font-medium">Working Diagnosis:</span>
          <span className="text-base text-neutral-900 font-semibold">
            {highlightText(patientSummaryData.workingDiagnosis.text, patientSummaryData.workingDiagnosis.highlights)}
          </span>
        </div>
      </div>

      {/* Presenting Symptoms */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Presenting Symptoms</span>
        </div>
        <ul className="space-y-3">
          {patientSummaryData.presentingSymptoms.map((symptom, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-neutral-400 mt-2 shrink-0"></span>
              <span className="text-base text-neutral-800 leading-relaxed">
                {highlightText(symptom.text, symptom.highlights)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Key Findings - Biomarker Cards */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Droplet size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Key Lab Findings</span>
        </div>
        
        {/* Biomarker Cards - Single Column */}
        <div className="space-y-4 mb-6">
          {/* ALT - Elevated */}
          <ElevatedCard
            title="ALT (Alanine Aminotransferase)"
            value={620}
            unit="U/L"
            date="2 days ago"
            ranges={[0, 10, 40, 800]}
            normalRange="10-40 U/L"
            chartData={[
              { date: '3 weeks ago', value: 28 },
              { date: '2 weeks ago', value: 35 },
              { date: '1 week ago', value: 180 },
              { date: '3 days ago', value: 420 },
              { date: 'Today', value: 620 }
            ]}
          />
          
          {/* AST - Elevated */}
          <ElevatedCard
            title="AST (Aspartate Aminotransferase)"
            value={450}
            unit="U/L"
            date="2 days ago"
            ranges={[0, 10, 35, 600]}
            normalRange="10-35 U/L"
            chartData={[
              { date: '3 weeks ago', value: 22 },
              { date: '2 weeks ago', value: 30 },
              { date: '1 week ago', value: 150 },
              { date: '3 days ago', value: 320 },
              { date: 'Today', value: 450 }
            ]}
          />
          
          {/* Total Bilirubin - Elevated */}
          <ElevatedCard
            title="Total Bilirubin"
            value={5.2}
            unit="mg/dL"
            date="2 days ago"
            ranges={[0, 0.3, 1.2, 10]}
            normalRange="0.3-1.2 mg/dL"
            chartData={[
              { date: '3 weeks ago', value: 0.8 },
              { date: '2 weeks ago', value: 0.9 },
              { date: '1 week ago', value: 1.8 },
              { date: '3 days ago', value: 3.5 },
              { date: 'Today', value: 5.2 }
            ]}
          />
          
          {/* Direct Bilirubin - Elevated */}
          <ElevatedCard
            title="Direct Bilirubin"
            value={3.8}
            unit="mg/dL"
            date="2 days ago"
            ranges={[0, 0, 0.3, 8]}
            normalRange="0-0.3 mg/dL"
            chartData={[
              { date: '3 weeks ago', value: 0.1 },
              { date: '2 weeks ago', value: 0.15 },
              { date: '1 week ago', value: 1.2 },
              { date: '3 days ago', value: 2.5 },
              { date: 'Today', value: 3.8 }
            ]}
          />
          
          {/* Eosinophils - Elevated */}
          <ElevatedCard
            title="Eosinophils"
            value={8.5}
            unit="%"
            date="2 days ago"
            ranges={[0, 1, 4, 15]}
            normalRange="1-4%"
            chartData={[
              { date: '3 weeks ago', value: 2.5 },
              { date: '2 weeks ago', value: 3.0 },
              { date: '1 week ago', value: 5.5 },
              { date: '3 days ago', value: 7.2 },
              { date: 'Today', value: 8.5 }
            ]}
          />
        </div>
        
        {/* Additional Findings */}
        <div className="pt-4 border-t border-neutral-100">
          <h4 className="text-sm font-semibold text-neutral-700 mb-3">Imaging Findings</h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-neutral-400 mt-2 shrink-0"></span>
              <span className="text-sm text-neutral-800 leading-relaxed">
                Moderate hepatic steatosis on ultrasound
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Timeline</span>
        </div>
        <div className="space-y-3">
          {Object.entries(patientSummaryData.timeline).map(([key, value], idx) => (
            <div key={idx} className="flex gap-4">
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide w-32 shrink-0 pt-0.5">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
              <div className="text-sm text-neutral-800 leading-relaxed">
                {highlightText(value.text, value.highlights)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
