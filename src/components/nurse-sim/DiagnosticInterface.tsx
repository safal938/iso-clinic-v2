import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle2, Play, X } from 'lucide-react';
import { Diagnosis } from '../../types/nurse-sim';

// Helper to generate short names from diagnosis
const getShortName = (headline: string): string => {
  return headline;
};

export const DiagnosticInterface: React.FC<{ diagnoses?: Diagnosis[] }> = ({ diagnoses: externalDiagnoses = [] }) => {
  // Start with empty array, only use backend data when it arrives
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null);

  // Update diagnoses when external data changes
  useEffect(() => {
    if (externalDiagnoses.length > 0) {
      setDiagnoses(externalDiagnoses);
      // Auto-select first diagnosis if none selected or current selection not in new list
      if (!selectedDiagnosis || !externalDiagnoses.find(d => d.did === selectedDiagnosis.did)) {
        setSelectedDiagnosis(externalDiagnoses[0]);
      }
    }
  }, [externalDiagnoses, selectedDiagnosis]);

  if (!selectedDiagnosis) {
    return null;
  }

  // Find the diagnosis with rank 1 (most likely)
  const primaryDiagnosis = diagnoses.find(d => d.rank === 1) || diagnoses[0];
  // Get all other diagnoses sorted by rank (excluding the exact primary diagnosis by rank)
  const otherDiagnoses = diagnoses
    .filter(d => d.rank !== primaryDiagnosis.rank)
    .sort((a, b) => a.rank - b.rank);

  const getConfidenceWidth = (rank: number) => {
    if (rank === 1) return 90;
    if (rank === 2) return 70;
    if (rank === 3) return 50;
    return 35;
  };

  return (
    <div className="h-full flex gap-4">
      {/* Left Column - Diagnosis List (40%) */}
      <div className="flex-[2] flex flex-col gap-4">
        {/* Most Likely */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
            <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wide">Most likely Diagnosis</h3>
          </div>
          <div className="p-4">
            <motion.div
              layoutId={`diagnosis-${primaryDiagnosis.did}-${primaryDiagnosis.rank}`}
              onClick={() => setSelectedDiagnosis(primaryDiagnosis)}
              className={`rounded-lg p-4 border cursor-pointer transition-all ${
                selectedDiagnosis.did === primaryDiagnosis.did && selectedDiagnosis.rank === primaryDiagnosis.rank
                  ? 'bg-sky-50 border-[#0EA5E9] shadow-[0_0_0_2px_rgba(14,165,233,0.3)] '
                  : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
               
                <span className="text-[10px] text-neutral-400">
                  {primaryDiagnosis.indicators_point.length} findings
                </span>
              </div>
              <h4 className="font-semibold text-neutral-900 text-sm mb-1">
                {primaryDiagnosis.headline}
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2 mb-3">
                {primaryDiagnosis.diagnosis}
              </p>
              <div className="w-full bg-neutral-100 rounded-full h-1.5 mb-2 overflow-hidden">
                <div 
                  className="bg-[#0EA5E9] h-full rounded-full transition-all" 
                  style={{ width: `${getConfidenceWidth(primaryDiagnosis.rank)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[#0EA5E9] font-semibold uppercase tracking-wide">High</span>
                <span className="text-neutral-400">confidence</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Other to Consider */}
        <div className="flex-1 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 shrink-0">
            <h3 className="text-xs text-neutral-800 tracking-wide">Other Diagnosis to consider</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {otherDiagnoses.map((diagnosis, index) => (
                <motion.div
                  key={`${diagnosis.did}-${diagnosis.rank}-${index}`}
                  layoutId={`diagnosis-${diagnosis.did}-${diagnosis.rank}`}
                  onClick={() => setSelectedDiagnosis(diagnosis)}
                  className={`rounded-lg p-3 border cursor-pointer transition-all ${
                    selectedDiagnosis.did === diagnosis.did && selectedDiagnosis.rank === diagnosis.rank
                      ? 'bg-sky-50 border-[#0EA5E9] shadow-[0_0_0_2px_rgba(14,165,233,0.3)] '
                      : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-neutral-900 text-sm">
                      {diagnosis.headline}
                    </h4>
                    <span className="text-[10px] text-neutral-400">
                      {diagnosis.indicators_point.length} findings
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-1 mb-2 overflow-hidden">
                    <div 
                      className="bg-neutral-400 h-full rounded-full transition-all" 
                      style={{ width: `${getConfidenceWidth(diagnosis.rank)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-600 font-medium uppercase tracking-wide">
                      {diagnosis.rank === 2 ? 'Moderate' : 'Low'}
                    </span>
                    <span className="text-neutral-400">confidence</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Column - Detail View (60%) */}
      <div className="flex-[3] bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-1.5 border-b border-neutral-200 bg-neutral-50 shrink-0 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-neutral-800 flex items-center gap-2">
            More Information on Diagnosis 
          </h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 rounded-lg text-[10px] font-medium transition-colors">
            <Play size={12} />
            Run Diagnostic
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <motion.div
            key={`${selectedDiagnosis.did}-${selectedDiagnosis.rank}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
               
              </div>
              <h2 className="text-base font-semibold text-neutral-900 mb-4">
                {selectedDiagnosis.diagnosis}
              </h2>
            </div>
 <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Brain size={14} className="text-[#0EA5E9]" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-neutral-900">Clinical Reasoning</h3>
                  <p className="text-[10px] text-neutral-500">AI-generated diagnostic rationale</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs text-neutral-700 leading-relaxed">{selectedDiagnosis.reasoning}</p>
              </div>
            </div>
            {/* Clinical Indicators */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-neutral-900">Clinical criteria for given diagnosis</h3>
                  <p className="text-[10px] text-neutral-500">
                    {selectedDiagnosis.indicators_point.filter(i => i.check).length} of {selectedDiagnosis.indicators_point.length} criteria met
                  </p>
                </div>
              </div>
             <div className="grid grid-cols-2 gap-2">
  {selectedDiagnosis.indicators_point.map((indicator, idx) => (
    <motion.div 
      key={idx}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
      className={`flex items-start gap-2 p-2.5 rounded-lg border ${
        indicator.check ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-50 border-neutral-200'
      }`}
    >
      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        indicator.check ? 'bg-emerald-500' : 'bg-neutral-300'
      }`}>
        {indicator.check ? (
          <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
        ) : (
          <X size={10} className="text-white" strokeWidth={3} />
        )}
      </div>
      <span className={`text-xs leading-relaxed ${
        indicator.check ? 'text-emerald-900 font-medium' : 'text-neutral-500'
      }`}>
        {indicator.criteria}
      </span>
    </motion.div>
  ))}
</div>

            </div>

            {/* Clinical Reasoning */}
           
          </motion.div>
        </div>
      </div>
    </div>
  );
};
