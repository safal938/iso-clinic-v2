import React from 'react';
import monitoringData from '../../data/monitoring-data';

const ActionCard: React.FC = () => {
  const { clinicalActions } = monitoringData;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col h-full">
      
      {/* Recommended Immediate Clinical Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">
          Recommended Immediate Clinical Actions:
        </h3>
        
        <div className="space-y-5">
          {clinicalActions.immediate.map((action, idx) => (
            <div key={idx} className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-slate-900">{action.title}</span>
                <span className="text-sm text-slate-600 leading-relaxed">{action.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Triage Note - Clean text */}
      <div className="mb-8">
         <p className="text-sm text-slate-800 leading-relaxed bg-orange-50/50 p-4 -mx-4 rounded-xl border border-orange-100/50">
            <span className="font-bold text-orange-800">Triage Note: </span>
            {clinicalActions.triageNote.replace(/^Urgent:\s*/i, "")}
         </p>
      </div>

      {/* Patient communication action */}
      <div className="mt-auto">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
            Patient communication action:
        </h3>
        
        <div className="bg-gray-100 rounded-xl p-6">
            <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-900 mb-1">Communication plan</h4>
                <p className="text-sm text-slate-700">{clinicalActions.communication.plan}</p>
            </div>
            
            <div className="space-y-3">
            {clinicalActions.communication.items.map((item, idx) => (
                <div key={idx}>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-0.5">{item.label}</span>
                    <span className="text-sm text-slate-800 block italic leading-relaxed">{item.value}</span>
                </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ActionCard;
