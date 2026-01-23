import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';
import { Message } from '../../types/monitoring';
import { generatePatientResponse } from '../../services/monitoring/geminiService';
import monitoringData from '../../data/monitoring-data';

const PatientChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load initial messages from JSON
  useEffect(() => {
    const loadedMessages: Message[] = monitoringData.chatHistory.map(msg => ({
      id: msg.id,
      role: msg.role as 'patient' | 'doctor',
      text: msg.text,
      highlights: msg.highlights,
      timestamp: new Date(Date.now() - msg.timestampOffset)
    }));
    setMessages(loadedMessages);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      // Show scroll buttons if content is scrollable
      setShowScrollButtons(scrollHeight > clientHeight + 10); // +10 for small buffer
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check scroll on mount and when messages change
    const checkScroll = () => {
      handleScroll();
    };
    
    // Use timeout to ensure DOM is updated
    const timer = setTimeout(checkScroll, 100);
    
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Also check on resize
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timer);
      };
    }
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'doctor',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await generatePatientResponse(
        messages.map(m => ({ role: m.role, text: m.text })),
        inputValue
      );

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'patient',
        text: responseText,
        timestamp: new Date(),
        highlights: responseText.includes('breath') ? ['breath', 'shortness'] : 
                    responseText.includes('pain') ? ['pain', 'chest'] : undefined
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTextWithHighlights = (text: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) return text;
    const pattern = new RegExp(`(${highlights.join('|')})`, 'gi');
    return text.split(pattern).map((part, i) => 
      pattern.test(part) ? (
        <span key={i} className="bg-orange-100 text-orange-800 px-1 rounded-md font-medium">{part}</span>
      ) : part
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col overflow-hidden relative" style={{ height: '100%', maxHeight: '100%' }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-md p-6 z-10 border-b border-slate-50 flex justify-between items-center">
        <div>
           <h2 className="text-lg font-bold text-slate-900">Patient chat</h2>
           <p className="text-xs text-slate-400">Online • Just now</p>
        </div>
        <div className="bg-slate-50 p-2 rounded-full">
            <MessageSquare className="w-4 h-4 text-blue-500" />
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-white"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent'
        }}
      >
        {messages.map((msg) => {
          const isDoctor = msg.role === 'doctor';
          return (
            <div key={msg.id} className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${isDoctor ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`
                  px-5 py-3 text-sm leading-relaxed rounded-2xl
                  ${isDoctor 
                    ? 'bg-blue-500 text-white rounded-br-none shadow-sm shadow-blue-200' 
                    : 'bg-slate-50 text-slate-700 rounded-bl-none border border-slate-100'}
                `}>
                  {renderTextWithHighlights(msg.text, msg.highlights)}
                </div>
                <span className="text-[10px] text-slate-300 px-1">
                  {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}
        {isLoading && (
            <div className="flex justify-start">
               <div className="bg-slate-50 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
               </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll Buttons - Always visible for testing */}
      <div className="absolute right-4 bottom-28 flex flex-col gap-2 z-20">
        <button
          onClick={scrollToTop}
          className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-110"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={scrollToBottom}
          className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-110"
          aria-label="Scroll to bottom"
          title="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 bg-white border-t border-slate-50">
        <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-1.5 pl-4 border border-slate-100 focus-within:ring-2 focus-within:ring-blue-100 transition-shadow">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your response..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-all shadow-sm shadow-blue-200/50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientChat;
