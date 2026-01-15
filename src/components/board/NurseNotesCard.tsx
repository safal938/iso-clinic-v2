import React from 'react';
import assessmentData from '../../data/completed-assessment.json';

interface NurseNotesCardProps {
  width?: number;
  height?: number;
}

const NurseNotesCard: React.FC<NurseNotesCardProps> = ({ width = 350, height = 900 }) => {
  const { assessment } = assessmentData;

  return (
    <div 
      className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col font-sans"
      style={{ width, height }}
    >
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-800">Clinical Consultation Report</h3>
          <span className="text-[10px] text-gray-400">1/15/2026</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3 text-xs">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">History of Present Illness</p>
            <p className="text-gray-700 leading-relaxed">
              The patient presents with a chief complaint of <mark className="bg-orange-100 text-neutral-900 px-0.5 rounded font-medium">yellowing of the skin and eyes</mark>, accompanied by significant fatigue and a heavy sensation in the stomach. They report taking approximately <mark className="bg-orange-100 text-neutral-900 px-0.5 rounded font-medium">six to eight Extra Strength Tylenol pills daily</mark> for jaw pain over the past few weeks. The patient also describes intense itching with a 'pins and needles' sensation, <mark className="bg-orange-100 text-neutral-900 px-0.5 rounded font-medium">dark cola-colored urine</mark> for several days, and recent <mark className="bg-orange-100 text-neutral-900 px-0.5 rounded font-medium">pale, almost white stools</mark>. They endorse a dull, heavy ache under the right ribs, decreased appetite, and nausea, but deny fever, vomiting, confusion, or recent travel. The symptoms began around the time of finishing an Augmentin prescription.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Key Biomarkers</p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="bg-red-50 px-2 py-1.5 rounded">
                <span className="text-gray-600">AST:</span> <span className="text-red-700 font-semibold">450 U/L</span>
              </div>
              <div className="bg-red-50 px-2 py-1.5 rounded">
                <span className="text-gray-600">ALT:</span> <span className="text-red-700 font-semibold">620 U/L</span>
              </div>
              <div className="bg-amber-50 px-2 py-1.5 rounded">
                <span className="text-gray-600">T.Bili:</span> <span className="text-amber-700 font-semibold">5.2 mg/dL</span>
              </div>
              <div className="bg-amber-50 px-2 py-1.5 rounded">
                <span className="text-gray-600">Alk Phos:</span> <span className="text-amber-700 font-semibold">180 U/L</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Clinical Impression</p>
            <p className="text-gray-700 leading-relaxed">
              The primary concern is <mark className="bg-orange-100 text-neutral-900 px-0.5 rounded font-medium">Drug-Induced Liver Injury (DILI)</mark> secondary to <mark className="bg-orange-100 text-neutral-900 px-0.5 rounded font-medium">acetaminophen overdose</mark>, presenting with acute jaundice and cholestasis. Differential diagnoses include biliary obstruction. Severity is high due to potential liver damage.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Suggested Doctor Actions</p>
            <ul className="text-gray-700 space-y-1.5 list-none">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 text-[10px] mt-0.5">•</span>
                <span>Review patient's exact Tylenol and Augmentin dosing history.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 text-[10px] mt-0.5">•</span>
                <span>Assess for signs of hepatic encephalopathy.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 text-[10px] mt-0.5">•</span>
                <span>Order comprehensive liver function panel, including INR.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 text-[10px] mt-0.5">•</span>
                <span>Consider abdominal ultrasound to evaluate for biliary obstruction.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 text-[10px] mt-0.5">•</span>
                <span>Assess for signs of pruritus management.</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-50">
            <p className="text-[10px] text-gray-400">
              — {assessment.nurseName}<br/>
              {new Date(assessment.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseNotesCard;
