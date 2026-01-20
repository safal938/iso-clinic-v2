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
          {patientSummaryData.biomarkers.map((biomarker, idx) => (
            <ElevatedCard
              key={idx}
              title={biomarker.title}
              value={biomarker.value}
              unit={biomarker.unit}
              date={biomarker.date}
              ranges={biomarker.ranges}
              normalRange={biomarker.normalRange}
              chartData={biomarker.chartData}
            />
          ))}
        </div>
        
        {/* Additional Findings */}
        <div className="pt-4 border-t border-neutral-100">
          <h4 className="text-sm font-semibold text-neutral-700 mb-3">Imaging Findings</h4>
          <ul className="space-y-2">
            {patientSummaryData.imagingFindings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-neutral-400 mt-2 shrink-0"></span>
                <span className="text-sm text-neutral-800 leading-relaxed">
                  {highlightText(finding.text, finding.highlights)}
                </span>
              </li>
            ))}
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
