import React from 'react';
import { FileText, AlertCircle, ImageIcon, History, Calendar, Paperclip } from 'lucide-react';
import medicalHistoryData from '../../../data/nurse-sim/medical_history.json';
import patientInfoData from '../../../data/nurse-sim/patient_info_data.json';
import { highlightText } from './utils';
import { DocumentThumbnail } from './SharedComponents';

interface HistoryTabProps {
  onDocumentClick: (index: number) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ onDocumentClick }) => {
  return (
    <div className="xl:max-w-[70%] mx-auto space-y-5">


       <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Previous Encounters</span>
        </div>
        <div className="space-y-3">
          {medicalHistoryData.previousEncounters.map((encounter, idx) => (
            <div key={idx} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-base font-bold text-neutral-900">{encounter.reason}</h4>
                  <p className="text-sm text-neutral-600 mt-1">{encounter.location} • {encounter.provider}</p>
                </div>
                <span className="text-xs text-neutral-500 font-medium">{encounter.date}</span>
              </div>
              <p className="text-sm text-neutral-800 mb-3 leading-relaxed">{highlightText(encounter.summary.text, encounter.summary.highlights)}</p>
              <button
                onClick={() => onDocumentClick(patientInfoData.documents.findIndex(d => d.id === encounter.document.id))}
                className="text-sm text-neutral-700 hover:text-neutral-900 font-medium underline"
              >
                View Clinical Note →
              </button>
            </div>
          ))}
        </div>
      </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <History size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Past Medical History</span>
        </div>
        <div className="space-y-3">
          {medicalHistoryData.pastMedicalHistory.map((item, idx) => (
            <div key={idx} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-base font-bold text-neutral-900">{item.condition}</h4>
                <span className="text-xs text-neutral-500 font-medium">{item.date || item.status}</span>
              </div>
              {item.treatment && (
                <p className="text-sm text-neutral-700 mb-2">
                  <span className="font-medium">Treatment:</span> {highlightText(item.treatment.text, item.treatment.highlights)}
                </p>
              )}
              {item.details && (
                <p className="text-sm text-neutral-700 mb-2">{highlightText(item.details.text, item.details.highlights)}</p>
              )}
              <p className="text-sm text-neutral-600 italic bg-white p-2 rounded border border-neutral-200 mt-2">
                <span className="font-medium not-italic">Relevance:</span> {highlightText(item.relevance.text, item.relevance.highlights)}
              </p>
            </div>
          ))}
        </div>
      </div>
      {/* Laboratory Findings - Critical Data */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Laboratory Findings</span>
        </div>
        
        {/* Liver Function - Most Critical */}
        <div className="mb-5 pb-5 border-b-2 border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold text-neutral-900">Liver Function Tests</h4>
            <span className="text-xs text-neutral-500">{medicalHistoryData.laboratoryFindings.liverFunction.date}</span>
          </div>
          <p className="text-sm text-neutral-600 mb-3">{medicalHistoryData.laboratoryFindings.liverFunction.source}</p>
          <ul className="space-y-2 mb-3">
            {medicalHistoryData.laboratoryFindings.liverFunction.keyResults.map((result, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-neutral-400 mt-1.5 shrink-0"></span>
                <span className="text-base text-neutral-800 leading-relaxed">
                  {highlightText(result.text, result.highlights)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-neutral-800 font-medium bg-neutral-50 p-3 rounded border border-neutral-200">
            <span className="font-bold">Interpretation:</span> {highlightText(medicalHistoryData.laboratoryFindings.liverFunction.interpretation.text, medicalHistoryData.laboratoryFindings.liverFunction.interpretation.highlights)}
          </p>
          <button
            onClick={() => onDocumentClick(patientInfoData.documents.findIndex(d => d.id === medicalHistoryData.laboratoryFindings.liverFunction.document.id))}
            className="mt-3 text-sm text-neutral-700 hover:text-neutral-900 font-medium underline"
          >
            View Full Lab Report →
          </button>
        </div>

        {/* Hematology */}
        <div className="mb-5 pb-5 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-bold text-neutral-900">Hematology (CBC)</h4>
            <span className="text-xs text-neutral-500">{medicalHistoryData.laboratoryFindings.hematology.date}</span>
          </div>
          <p className="text-sm text-neutral-600 mb-3">{medicalHistoryData.laboratoryFindings.hematology.source}</p>
          <ul className="space-y-2 mb-3">
            {medicalHistoryData.laboratoryFindings.hematology.keyResults.map((result, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-neutral-400 mt-1.5 shrink-0"></span>
                <span className="text-base text-neutral-800 leading-relaxed">
                  {highlightText(result.text, result.highlights)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-neutral-800 font-medium bg-neutral-50 p-3 rounded border border-neutral-200">
            <span className="font-bold">Interpretation:</span> {highlightText(medicalHistoryData.laboratoryFindings.hematology.interpretation.text, medicalHistoryData.laboratoryFindings.hematology.interpretation.highlights)}
          </p>
          <button
            onClick={() => onDocumentClick(patientInfoData.documents.findIndex(d => d.id === medicalHistoryData.laboratoryFindings.hematology.document.id))}
            className="mt-3 text-sm text-neutral-700 hover:text-neutral-900 font-medium underline"
          >
            View Full Lab Report →
          </button>
        </div>

        {/* Toxicology */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-bold text-neutral-900">Toxicology Screen</h4>
            <span className="text-xs text-neutral-500">{medicalHistoryData.laboratoryFindings.toxicology.date}</span>
          </div>
          <ul className="space-y-2 mb-3">
            {medicalHistoryData.laboratoryFindings.toxicology.results.map((result, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-neutral-400 mt-1.5 shrink-0"></span>
                <span className="text-base text-neutral-800 leading-relaxed">
                  {highlightText(result.text, result.highlights)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-neutral-800 font-medium bg-neutral-50 p-3 rounded border border-neutral-200">
            {highlightText(medicalHistoryData.laboratoryFindings.toxicology.interpretation.text, medicalHistoryData.laboratoryFindings.toxicology.interpretation.highlights)}
          </p>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Risk Factors</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {medicalHistoryData.riskFactors.map((factor, idx) => (
            <span key={idx} className="text-sm font-medium text-neutral-900 bg-neutral-50 px-3 py-2 rounded border border-neutral-200">
              {highlightText(factor.text, factor.highlights)}
            </span>
          ))}
        </div>
      </div>

      {/* Imaging Studies */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon size={16} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Imaging Studies</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-bold text-neutral-900">Abdominal Ultrasound</h4>
          <span className="text-xs text-neutral-500">{medicalHistoryData.imagingStudies.abdominalUltrasound.date}</span>
        </div>
        <p className="text-sm text-neutral-600 mb-4">{medicalHistoryData.imagingStudies.abdominalUltrasound.source}</p>
        <div className="mb-4">
          <div className="text-sm font-bold text-neutral-700 mb-2">Findings:</div>
          <ul className="space-y-2">
            {medicalHistoryData.imagingStudies.abdominalUltrasound.findings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-neutral-400 mt-1.5 shrink-0"></span>
                <span className="text-base text-neutral-800 leading-relaxed">
                  {highlightText(finding.text, finding.highlights)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-neutral-800 font-medium bg-neutral-50 p-3 rounded border border-neutral-200 mb-3">
          <span className="font-bold">Impression:</span> {highlightText(medicalHistoryData.imagingStudies.abdominalUltrasound.impression.text, medicalHistoryData.imagingStudies.abdominalUltrasound.impression.highlights)}
        </p>
        <button
          onClick={() => onDocumentClick(patientInfoData.documents.findIndex(d => d.id === medicalHistoryData.imagingStudies.abdominalUltrasound.document.id))}
          className="text-sm text-neutral-700 hover:text-neutral-900 font-medium underline"
        >
          View Imaging Report →
        </button>
      </div>

      {/* Past Medical History */}
    

      {/* Previous Encounters */}
     

      {/* All Documents Gallery */}
      <div className="bg-white rounded-lg border border-neutral-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Paperclip size={14} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">All Documents ({medicalHistoryData.allDocuments.length})</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {medicalHistoryData.allDocuments.map((doc) => {
            const fullDoc = patientInfoData.documents.find(d => d.id === doc.id);
            if (!fullDoc) return null;
            return (
              <div 
                key={doc.id}
                onClick={() => onDocumentClick(patientInfoData.documents.findIndex(d => d.id === doc.id))}
                className="cursor-pointer group"
              >
                <div className="aspect-[1/1.41] bg-white rounded border border-neutral-200 overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all">
                  <DocumentThumbnail doc={fullDoc} />
                </div>
                <div className="mt-2 text-center">
                  <h4 className="text-xs font-medium text-neutral-700 truncate">{doc.title}</h4>
                  <p className="text-[10px] text-neutral-500">{doc.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
