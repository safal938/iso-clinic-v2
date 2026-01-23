import React from 'react';
import monitoringData from '../../data/monitoring-data';

const MonitoringSummaryCard: React.FC = () => {
  const { patientProfile, riskAnalysis } = monitoringData;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">
          <span className="text-slate-400 font-normal mr-2 text-2xl">cc:</span>
          {patientProfile.cc}
        </h2>
        <p className="text-slate-600 mt-1">{patientProfile.details}</p>
      </div>

      {/* Protocol & Medication - Clean text lines */}
      <div className="mb-8 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline text-sm">
          <span className="text-slate-500 font-medium w-36 shrink-0">Current Protocol:</span>
          <span className="text-slate-900 font-medium">{patientProfile.protocol}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline text-sm">
          <span className="text-slate-500 font-medium w-36 shrink-0">Medication:</span>
          <span className="text-slate-900 font-medium">{patientProfile.medication}</span>
        </div>
      </div>

      {/* AI Risk Analysis */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          AI risk analysis:
        </h3>
        
        <div className="space-y-5">
          {/* Symptom */}
          <div>
            <div className="text-sm">
                <span className="font-semibold text-slate-900">Reported Symptom: </span>
                <span className="text-slate-700">{riskAnalysis.symptom}</span>
            </div>
          </div>

          {/* Correlation */}
          <div>
            <div className="text-sm font-semibold text-slate-900 mb-1">Clinical Correlation Required:</div>
            <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">
                {riskAnalysis.correlation}
            </p>
          </div>

          {/* Etiology List - Clean column look without table borders */}
          <div className="pt-2">
             {/* Header Row */}
             <div className="grid grid-cols-12 gap-4 mb-2 pb-2 border-b border-slate-100">
                <div className="col-span-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Potential Etiology</div>
                <div className="col-span-8 text-xs font-bold text-slate-500 uppercase tracking-wide">Clinical Indicators</div>
             </div>
             {/* Rows */}
             <div className="space-y-3">
                {riskAnalysis.etiologies.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-4">
                        <div className="col-span-4 text-sm font-semibold text-slate-900 leading-snug">{item.name}</div>
                        <div className="col-span-8 text-sm text-slate-600 leading-snug">{item.indicators}</div>
                    </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringSummaryCard;
