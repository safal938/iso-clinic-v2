import React from 'react';
import { Stethoscope, AlertCircle, CheckCircle, MessageSquare, FileText, Paperclip, Maximize2 } from 'lucide-react';
import { highlightText } from './utils';
import { DocumentThumbnail } from './SharedComponents';
import referralInfoData from '../../../data/nurse-sim/referral_info.json';
import patientInfoData from '../../../data/nurse-sim/patient_info_data.json';

interface ReferralTabProps {
  onDocumentClick: (docId: number) => void;
}

export const ReferralTab: React.FC<ReferralTabProps> = ({ onDocumentClick }) => {
  return (
    <div className="xl:max-w-[70%] mx-auto space-y-5">
      {/* Clinical Context */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Clinical Context</span>
        </div>
        <p className="text-base text-neutral-800 leading-relaxed">
          {highlightText(referralInfoData.referralSummary.clinicalContext.text, referralInfoData.referralSummary.clinicalContext.highlights)}
        </p>
      </div>

      {/* Concerning Features */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Concerning Features</span>
        </div>
        <ul className="space-y-3">
          {referralInfoData.referralSummary.concerningFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-neutral-400 mt-2 shrink-0"></span>
              <span className="text-base text-neutral-800 leading-relaxed">
                {highlightText(feature.text, feature.highlights)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions Already Taken */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Actions Already Taken</span>
        </div>
        <ul className="space-y-3">
          {referralInfoData.referralSummary.actionsTaken.map((action, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-neutral-400 mt-2 shrink-0"></span>
              <span className="text-base text-neutral-800 leading-relaxed">
                {highlightText(action.text, action.highlights)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Questions for Specialist */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Questions for Specialist</span>
        </div>
        <ul className="space-y-3">
          {referralInfoData.referralSummary.questionsForSpecialist.map((question, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="text-sm font-bold text-neutral-500 shrink-0 pt-0.5">{idx + 1}.</span>
              <span className="text-base text-neutral-800 leading-relaxed">
                {highlightText(question.text, question.highlights)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Referral Details */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Referral Details</span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1">Referred By</div>
            <div className="text-base font-semibold text-neutral-900">{referralInfoData.referralDetails.referredBy}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1">Referring Physician</div>
            <div className="text-base font-semibold text-neutral-900">{referralInfoData.referralDetails.referringPhysician}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1">Referral Date</div>
            <div className="text-base font-semibold text-neutral-900">{referralInfoData.referralDetails.referralDate}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1">Urgency</div>
            <div className="text-base font-semibold text-neutral-900">{referralInfoData.referralDetails.urgency}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1">Referred To</div>
            <div className="text-base font-semibold text-neutral-900">{referralInfoData.referralDetails.referredTo}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1">Consulting Physician</div>
            <div className="text-base font-semibold text-neutral-900">{referralInfoData.referralDetails.consultingPhysician}</div>
          </div>
        </div>
      </div>

      {/* Referral Letter Document */}
      <div className="bg-white rounded-lg border border-neutral-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Paperclip size={14} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Referral Letter</span>
        </div>
        {referralInfoData.attachedDocuments.map((doc) => (
          <div 
            key={doc.id}
            onClick={() => onDocumentClick(patientInfoData.documents.findIndex(d => d.id === doc.id))}
            className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="w-12 h-16 bg-white rounded shadow-sm border border-neutral-200 overflow-hidden flex-shrink-0">
              <DocumentThumbnail doc={patientInfoData.documents.find(d => d.id === doc.id)!} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-neutral-900">{doc.title}</h4>
              <p className="text-xs text-neutral-500 mt-0.5">{doc.date} • {doc.source}</p>
              <p className="text-xs text-neutral-700 mt-1">{doc.description}</p>
            </div>
            <Maximize2 size={16} className="text-neutral-400" />
          </div>
        ))}
      </div>
    </div>
  );
};
