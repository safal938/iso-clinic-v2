import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, UserPlus, UserCheck } from 'lucide-react';
import { ChatMessage } from '../../types/nurse-sim';
import chatData from '../../data/nurse-sim/new_format/chat.json';

interface Message {
  id: number;
  text: string;
  sender: 'Nurse' | 'Patient';
  timestamp: Date;
  highlights?: string[];
}

interface ChatInterfaceProps {
  onConsultationTypeSelected?: (type: 'new' | 'followup') => void;
  chatMessages?: ChatMessage[];
  isSessionActive?: boolean;
  hasStarted?: boolean;
  showModal?: boolean;
  onMicClick?: () => void;
  onModalClose?: () => void;
  hideControls?: boolean; // New prop to hide controls when embedded
}

// Data from backend: dataobjects/new_format/chat.json
const BACKEND_CONVERSATION: ChatMessage[] = chatData as ChatMessage[];

// Helper function to highlight text
const highlightText = (text: string, highlights: string[]): React.ReactNode => {
  if (!highlights || highlights.length === 0) {
    return text;
  }

  // Create a regex pattern that matches any of the highlight terms (case insensitive)
  const pattern = highlights
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special regex characters
    .join('|');
  
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isHighlighted = highlights.some(
      term => part.toLowerCase() === term.toLowerCase()
    );
    
    if (isHighlighted) {
      return (
        <mark
          key={index}
          className="bg-orange-100 text-neutral-900 px-0.5 rounded font-medium"
        >
          {part}
        </mark>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onConsultationTypeSelected,
  chatMessages: externalChatMessages = [],
  isSessionActive = false,
  hasStarted: externalHasStarted = false,
  showModal: externalShowModal = false,
  onMicClick,
  onModalClose,
  hideControls = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping] = useState(false);
  
  // Use external state if provided, otherwise use local state (for backwards compatibility)
  const hasStarted = externalHasStarted;
  const showModal = externalShowModal;
  const isListening = isSessionActive && hasStarted;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with backend data immediately, update when external data changes
  useEffect(() => {
    console.log('[ChatInterface] External chat messages updated:', externalChatMessages);
    
    if (externalChatMessages.length > 0) {
      const formattedMessages = externalChatMessages.map((msg, idx) => {
        // Normalize role to capitalized format
        let sender: 'Nurse' | 'Patient' = 'Patient';
        if (msg.role === 'Nurse' || msg.role === 'admin') {
          sender = 'Nurse';
        } else if (msg.role === 'Patient' || msg.role === 'patient') {
          sender = 'Patient';
        }
        
        return {
          id: Date.now() + idx,
          text: msg.message || '',
          sender: sender,
          timestamp: new Date(),
          highlights: msg.highlights
        };
      });
      
      console.log('[ChatInterface] Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
    }
  }, [externalChatMessages]);

  const handleMicClick = () => {
    if (!hasStarted && onMicClick) {
      onMicClick();
    }
  };

  const handleConsultationTypeSelect = (type: 'new' | 'followup') => {
    if (onModalClose) {
      onModalClose();
    }
    
    // Notify parent component about the consultation type (this will start WebSocket)
    if (onConsultationTypeSelected) {
      onConsultationTypeSelected(type);
    }
  };



  if (!hasStarted) {
    return (
      <>
        {/* Consultation Type Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Select Consultation Type</h2>
                <button
                  onClick={onModalClose}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-3">
                <button
                  onClick={() => handleConsultationTypeSelect('new')}
                  className="w-full text-left rounded-lg border border-neutral-200 hover:border-cyan-500 hover:bg-cyan-50/50 p-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center">
                      <UserPlus size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-neutral-900">New Patient</h3>
                      <p className="text-sm text-neutral-500 mt-0.5">Duration: 20 minutes</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleConsultationTypeSelect('followup')}
                  className="w-full text-left rounded-lg border border-neutral-200 hover:border-cyan-500 hover:bg-cyan-50/50 p-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center">
                      <UserCheck size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-neutral-900">Follow Up</h3>
                      <p className="text-sm text-neutral-500 mt-0.5">Duration: 10 minutes</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-full flex items-center justify-center bg-white">
          <div className="text-center space-y-6">
            {!isListening ? (
              <>
                <div className="relative inline-block">
                  <button
                    onClick={handleMicClick}
                    className="w-20 h-20 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-500 shadow-lg transition-all duration-300 flex items-center justify-center"
                  >
                    <Mic size={32} />
                  </button>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-neutral-800">Start Voice Consultation</h3>
                  <p className="text-sm text-neutral-500">Click the microphone to begin</p>
                </div>
              </>
            ) : (
              <>
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full bg-[#0EA5E9] text-white shadow-lg flex items-center justify-center">
                    <Mic size={32} />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-[#0EA5E9]">Listening...</h3>
                  <p className="text-sm text-neutral-500">Speak now</p>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-neutral-50/30">
        {messages.length === 0 && hasStarted ? (
          // Show waiting message when no transcription yet
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-neutral-400">Waiting for transcription...</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="w-full max-w-3xl">
                {/* Speaker Badge */}
                <div className={`flex items-center gap-2 mb-1.5 ${message.sender === 'Patient' ? 'justify-start' : 'justify-end'}`}>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    message.sender === 'Nurse' 
                      ? 'bg-neutral-100 text-neutral-500' 
                      : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {message.sender === 'Nurse' ? 'Nurse' : 'Patient'}
                  </span>
                </div>
                
                {/* Message Bubble */}
                <div className={`flex ${message.sender === 'Patient' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                      message.sender === 'Nurse'
                        ? 'bg-white text-neutral-800 border border-neutral-200 rounded-tr-none shadow-sm'
                        : 'bg-blue-50 text-neutral-900 border border-blue-100 rounded-tl-none'
                    }`}
                  >
                    <p className={`leading-relaxed ${message.sender === 'Patient' ? 'text-[15px]' : 'text-[13px]'}`}>
                      {message.sender === 'Patient' 
                        ? highlightText(message.text, message.highlights || [])
                        : message.text
                      }
                    </p>
                    <span className="text-[9px] mt-1 block text-neutral-400">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-full max-w-3xl">
              <div className="flex items-center gap-2 mb-1.5 justify-start">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-500">
                  Patient
                </span>
              </div>
              <div className="flex justify-start">
                <div className="bg-blue-50 text-neutral-800 border border-blue-100 rounded-2xl rounded-tl-none px-3.5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Voice Control */}
      {!hideControls && (
        <div className="p-5 border-t border-neutral-200 bg-white">
          <div className="flex items-center justify-center gap-4">
             
            
            <div className="text-center">
              {isListening ? (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm font-medium text-[#0EA5E9]">Listening...</span>
                </div>
              ) : (
                <span className="text-sm text-neutral-500">Click microphone to speak</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
