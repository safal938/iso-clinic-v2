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
      <div className="px-5 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Nurse Notes</h3>
          <span className="text-xs text-gray-400">{assessment.duration}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="prose prose-sm max-w-none">
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            47 y/o male presenting with <span className="font-medium text-amber-700">jaundice</span> and <span className="font-medium text-amber-700">severe pruritus</span>. 
            Sister first noticed yellowing of eyes. Itching described as intense ("like ants crawling under skin"), rated 8-9/10, worse at night, affecting sleep.
          </p>
          
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            <span className="font-medium">Medication Hx:</span> Currently on <span className="font-medium text-blue-700">lisinopril</span> for HTN. 
            Reports Tylenol use (6-8 pills/day x 3 weeks) for dental pain - stopped yesterday. No known drug allergies.
          </p>

          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            <span className="font-medium">Associated Sx:</span> Dark urine ("like Coke"), pale/clay-colored stools, nausea, decreased appetite, possible unintentional weight loss (clothes looser). 
            Dull heavy feeling under right ribs. Denies fever/chills. Social EtOH use ("few beers with the guys").
          </p>

          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            <span className="font-medium">PMHx/FHx:</span> HTN on lisinopril. Recent dental abscess. No prior liver disease. No recent travel or sick contacts.
          </p>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm font-medium text-gray-800 mb-2">Impression:</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              Clinical picture highly suggestive of <span className="font-medium text-red-700">Drug Induced Liver Injury</span>. 
              Classic triad of jaundice, pruritus, and acholic stools with choluria. 
              Differential includes <span className="font-medium text-amber-700">cholangitis</span> and <span className="font-medium text-amber-700">biliary obstruction</span>. 
              RUQ discomfort supports hepatobiliary etiology.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm font-medium text-gray-800 mb-2">Plan:</p>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Hepatology/GI consult - urgent</li>
              <li>Comprehensive LFTs (AST, ALT, ALP, GGT, Bilirubin)</li>
              <li>Coagulation studies (PT/INR)</li>
              <li>Abdominal ultrasound with Doppler to evaluate biliary tree</li>
              <li>Viral hepatitis panel</li>
              <li>Symptomatic relief for pruritus</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
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
