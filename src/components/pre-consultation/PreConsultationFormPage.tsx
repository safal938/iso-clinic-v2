import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, Stethoscope, Paperclip, X, Image as ImageIcon, FileText, Check } from 'lucide-react';

interface Message {
  id: string;
  role: 'admin' | 'user';
  message: string;
  timestamp: Date;
  attachment?: {
    type: 'image' | 'document';
    name: string;
    url: string;
  };
}

interface CollectedData {
  fullName?: string;
  symptoms?: string;
  duration?: string;
  allergies?: string;
  medications?: string;
  additionalInfo?: string;
  attachments: Array<{ type: string; name: string; url: string }>;
}

interface FilePreview {
  type: 'image' | 'document';
  name: string;
  url: string;
  file: File;
}

export const PreConsultationFormPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'admin',
      message: 'Hello! Welcome to the pre-consultation form. I\'ll help you gather some information before your appointment. Let\'s start with your full name.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [collectedData, setCollectedData] = useState<CollectedData>({ attachments: [] });
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const questions = [
    { key: 'fullName', question: 'Thank you! Now, can you describe your main symptoms or concerns?' },
    { key: 'symptoms', question: 'I understand. How long have you been experiencing these symptoms?' },
    { key: 'duration', question: 'That\'s helpful. Do you have any known allergies?' },
    { key: 'allergies', question: 'Good to know. Are you currently taking any medications?' },
    { key: 'medications', question: 'Thank you. Is there anything else you\'d like to share about your medical history?' },
    { key: 'additionalInfo', question: 'Would you like to upload any medical documents or images (lab results, prescriptions, etc.)? You can use the attachment button below.' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileType = file.type.startsWith('image/') ? 'image' : 'document';
    const fileUrl = URL.createObjectURL(file);

    // Add to preview area instead of sending immediately
    setFilePreviews(prev => [...prev, {
      type: fileType,
      name: file.name,
      url: fileUrl,
      file
    }]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFilePreview = (index: number) => {
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const sendFilesAsMessages = () => {
    if (filePreviews.length === 0) return;

    filePreviews.forEach((preview, index) => {
      setTimeout(() => {
        const userMessage: Message = {
          id: `${Date.now()}-${index}`,
          role: 'user',
          message: `Uploaded: ${preview.name}`,
          timestamp: new Date(),
          attachment: {
            type: preview.type,
            name: preview.name,
            url: preview.url
          }
        };

        setMessages(prev => [...prev, userMessage]);
        setCollectedData(prev => ({
          ...prev,
          attachments: [...prev.attachments, { type: preview.type, name: preview.name, url: preview.url }]
        }));
      }, index * 100);
    });

    // Admin response after all files
    setTimeout(() => {
      const adminMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'admin',
        message: 'Thank you for uploading those files. You can upload more or type "done" when you\'re finished.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, adminMessage]);
    }, filePreviews.length * 100 + 500);

    setFilePreviews([]);
  };

  const handleSend = () => {
    // Send files first if any
    if (filePreviews.length > 0) {
      sendFilesAsMessages();
    }

    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      message: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Store the data
    const currentQuestion = questions[questionIndex];
    if (currentQuestion && questionIndex < questions.length) {
      setCollectedData(prev => ({
        ...prev,
        [currentQuestion.key]: inputValue
      }));
    }

    setInputValue('');
    setIsTyping(true);

    // Check if user is done with attachments
    if (inputValue.toLowerCase() === 'done' && questionIndex === questions.length - 1) {
      setTimeout(() => {
        const adminMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'admin',
          message: 'Perfect! Your form has been submitted successfully. Thank you!',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, adminMessage]);
        setIsTyping(false);
        
        // Show success modal without auto-redirect
        setTimeout(() => {
          setShowSubmitSuccess(true);
        }, 1000);
      }, 1000);
      return;
    }

    // Move to next question
    setTimeout(() => {
      if (questionIndex < questions.length - 1) {
        const nextQuestion = questions[questionIndex + 1];
        const adminMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'admin',
          message: nextQuestion.question,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, adminMessage]);
        setQuestionIndex(prev => prev + 1);
      } else {
        // All questions answered
        const adminMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'admin',
          message: 'Thank you for providing all this information. Type "done" when you\'re ready to review and submit.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, adminMessage]);
      }
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/clinic-triage')}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Pre-Consultation</h1>
            <p className="text-xs text-slate-500">ID: {patientId}</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'admin' && (
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <Stethoscope size={16} className="text-blue-600" />
                </div>
              )}

              <div
                className={`max-w-[70%] rounded-2xl ${
                  msg.role === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-800 border border-slate-200'
                }`}
              >
                <div className="px-4 py-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  {msg.attachment && (
                    <div className={`mt-2 p-2 rounded-lg ${msg.role === 'admin' ? 'bg-blue-500' : 'bg-slate-50'} flex items-center gap-2`}>
                      {msg.attachment.type === 'image' ? (
                        <>
                          <ImageIcon size={16} className={msg.role === 'admin' ? 'text-blue-200' : 'text-slate-400'} />
                          <img src={msg.attachment.url} alt={msg.attachment.name} className="max-w-full h-24 object-contain rounded" />
                        </>
                      ) : (
                        <>
                          <FileText size={16} className={msg.role === 'admin' ? 'text-blue-200' : 'text-slate-400'} />
                          <span className="text-xs">{msg.attachment.name}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                  <User size={16} className="text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                <Stethoscope size={16} className="text-blue-600" />
              </div>
              <div className="bg-blue-600 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* File Previews */}
          {filePreviews.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {filePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  {preview.type === 'image' ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-200">
                      <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeFilePreview(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-20 h-20 rounded-lg border-2 border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-2">
                      <FileText size={24} className="text-slate-400" />
                      <span className="text-[8px] text-slate-500 mt-1 truncate w-full text-center">{preview.name}</span>
                      <button
                        onClick={() => removeFilePreview(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input Row */}
          <div className="flex gap-2 items-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
              title="Attach file"
            >
              <Paperclip size={20} />
            </button>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              rows={1}
              className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm resize-none max-h-[120px]"
            />
            <button
              onClick={handleSend}
              disabled={(!inputValue.trim() && filePreviews.length === 0) || isTyping}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSubmitSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Submitted</h2>
            <p className="text-sm text-slate-500 mb-6">Your form has been submitted successfully</p>
            <button
              onClick={() => navigate('/clinic-triage')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Back to Triage
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
