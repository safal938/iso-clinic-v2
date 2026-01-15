import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, ChevronDown, Info } from 'lucide-react';
import { EducationItem } from '../../types/nurse-sim';

interface EducationCardProps {
  item: EducationItem;
}

// Education Card Component
const EducationCard: React.FC<EducationCardProps> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isHighUrgency = item.urgency === 'High';
  const isDelivered = item.status === 'asked';
  
  const containerClasses = (isHighUrgency && !isDelivered)
    ? "bg-red-50 border-red-200 shadow-[0_0_0_1px_rgba(254,202,202,0.4)]"
    : "bg-neutral-50 border-neutral-200 hover:border-neutral-300";

  const innerCardClasses = (isHighUrgency && !isDelivered) ? "border-red-100 shadow-sm" : "border-neutral-100 shadow-sm";
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ 
        layout: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.2 }
      }}
      onClick={() => setIsOpen(!isOpen)}
      className={`rounded-xl p-2 border cursor-pointer group select-none relative overflow-hidden ${containerClasses}`}
    >
      <div className={`bg-white rounded-lg p-3 border relative z-10 transition-colors ${innerCardClasses}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[8px] font-medium uppercase tracking-wide ${
            (isHighUrgency && !isDelivered) ? 'text-red-400' : 'text-neutral-400'
          }`}>
            {item.category}
          </span>
          {item.reasoning && (
            <div>
              <ChevronDown size={14} className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          )}
        </div>
        <h3 className={`font-semibold mb-2 ${
          (isHighUrgency && !isDelivered) ? 'text-black' : 'text-neutral-900'
        } ${
          isDelivered ? 'text-[10px]' : 'text-[15px]'
        }`}>
          {item.headline}
        </h3>
        <p className={`leading-relaxed ${
          (isHighUrgency && !isDelivered) ? 'text-red-800' : 'text-neutral-600'
        } ${
          isDelivered ? 'text-[9px]' : 'text-xs'
        }`}>
          {item.content}
        </p>
      </div>
      {isHighUrgency && !isDelivered && (
        <div className="px-3 py-0.5">
          <span className="text-[7px] text-red-400 font-semibold uppercase tracking-wide">
            High Priority
          </span>
        </div>
      )}
      {item.reasoning && (
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <div className="px-3 pb-2 pt-3">
              <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Info size={12} className="text-neutral-500" />
                  </div>
                  <p className="text-[9px]  text-neutral-600 leading-relaxed py-0.5">{item.reasoning}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const PatientEducationInterface: React.FC<{ educationItems?: EducationItem[] }> = ({ educationItems: externalItems = [] }) => {
  // Start with empty array, only use backend data when it arrives
  const [items, setItems] = useState<EducationItem[]>([]);

  // Update when external items change
  useEffect(() => {
    if (externalItems.length > 0) {
      setItems(externalItems);
    }
  }, [externalItems]);

  const pendingItems = items.filter(item => item.status === 'pending' || item.status === null);
  const deliveredItems = items.filter(item => item.status === 'asked');
  const highPriorityItems = pendingItems.filter(item => item.urgency === 'High');
  const otherPendingItems = pendingItems.filter(item => item.urgency !== 'High');

  return (
    <div className="h-full flex gap-4">
      {/* Left Column - Things to Say (66%) */}
      <div className="flex-[2] flex flex-col bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-5 py-2.5 border-b border-neutral-200 bg-neutral-50 shrink-0">
        <div className="flex items-center gap-2">
  <h2 className="text-[10px] text-neutral-800">Remaining Education</h2>
  <div className="h-3 w-px bg-neutral-300"></div>
  <p className="text-[10px] text-neutral-500">{pendingItems.length} pending</p>
</div>

        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* High Urgency Items - Full Width */}
          {highPriorityItems.length > 0 && (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3 mb-4">
                {highPriorityItems.map((item, index) => (
                  <EducationCard key={`${item.headline}-${index}`} item={item} />
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* Other Pending Items - 2 Column Grid */}
          {otherPendingItems.length > 0 && (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-2 gap-3">
                {otherPendingItems.map((item, index) => (
                  <EducationCard key={`${item.headline}-${index}`} item={item} />
                ))}
              </div>
            </AnimatePresence>
          )}

          {pendingItems.length === 0 && (
            <div className="flex items-center justify-center h-full text-center py-12">
              <div>
                <Circle size={48} className="text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">All information delivered</p>
                <p className="text-xs text-neutral-400 mt-1">Great job!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Things Already Said (33%) */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-5 py-2.5 border-b border-neutral-200 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2">
  <h2 className="text-[10px] text-neutral-800">Educated Content</h2>
  <div className="h-3 w-px bg-neutral-300"></div>
  <p className="text-[10px] text-neutral-500">{deliveredItems.length} delivered</p>
</div>

        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {deliveredItems.map((item, index) => (
              <EducationCard key={`${item.headline}-${index}`} item={item} />
            ))}
          </AnimatePresence>

          {deliveredItems.length === 0 && (
            <div className="flex items-center justify-center h-full text-center py-12">
              <div>
                <Circle size={48} className="text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">Nothing delivered yet</p>
                <p className="text-xs text-neutral-400 mt-1">Start educating the patient</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
