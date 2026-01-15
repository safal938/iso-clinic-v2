import React from 'react';
import { ChatInterface } from '../nurse-sim/ChatInterface';
import chatData from '../../data/nurse-sim/new_format/chat.json';

interface NurseAssessmentCardProps {
  width?: number;
  height?: number;
}

const NurseAssessmentCard: React.FC<NurseAssessmentCardProps> = ({ width = 800, height = 1300 }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const chatMessages = chatData as any[];

  const scrollChat = (direction: 'up' | 'down') => {
    // Find the scrollable element inside the ChatInterface
    const scrollableElement = containerRef.current?.querySelector('.overflow-y-auto');
    if (scrollableElement) {
      const scrollAmount = 400;
      scrollableElement.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-white font-sans text-gray-900 overflow-hidden rounded-xl shadow-lg" style={{ width, height }}>
      <div className="flex flex-col w-full h-full bg-white shadow-xl overflow-hidden relative">
        
        {/* Header with Scroll Controls */}
        <div className="bg-white border-b border-gray-200 shadow-sm z-10 flex-shrink-0 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Nurse Pre-Assessment</h2>
            <p className="text-xs text-gray-500">Completed Consultation Transcript</p>
          </div>
          {/* Scroll Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => scrollChat('up')} 
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors shadow-sm"
              title="Scroll Up"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button 
              onClick={() => scrollChat('down')} 
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors shadow-sm"
              title="Scroll Down"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        <div ref={containerRef} className="flex-1 overflow-hidden">
          <ChatInterface 
            chatMessages={chatMessages}
            hasStarted={true}
            isSessionActive={false}
            hideControls={true}
          />
        </div>
      </div>
    </div>
  );
};

export default NurseAssessmentCard;
