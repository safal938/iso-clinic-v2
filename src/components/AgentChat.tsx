import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Send, X, MessageCircle } from 'lucide-react';

const MessageContent = styled.div`
  margin: 0;
  font-family: inherit;
  font-size: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;

  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
  }
`;

// Simple markdown parser component
const MarkdownText: React.FC<{ content: string }> = ({ content }) => {
  const parseMarkdown = (text: string) => {
    // Replace **bold** with <strong>
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Replace *italic* with <em> (but not if it's part of **)
    text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    
    return text;
  };

  return <MessageContent dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />;
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface AgentChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = styled.div<{ isOpen: boolean }>`
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 30vw;
  min-width: 380px;
  max-width: 500px;
  background: #ffffff;
  border-right: 1px solid #e0e0e0;
  transform: translateX(${props => props.isOpen ? '0' : '-100%'});
  transition: transform 0.3s ease;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  box-shadow: ${props => props.isOpen ? '2px 0 12px rgba(0, 0, 0, 0.08)' : 'none'};
`;

const ChatHeader = styled.div`
  padding: 18px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #0288d1 0%, #03a9f4 100%);
  color: white;
  flex-shrink: 0;
`;

const ChatTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f5f7f9;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
`;

const MessageBubble = styled.div<{ role: 'user' | 'assistant' }>`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: ${props => props.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
  font-size: 14px;
  line-height: 1.6;
  align-self: ${props => props.role === 'user' ? 'flex-end' : 'flex-start'};
  background: ${props => props.role === 'user' 
    ? 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)' 
    : 'white'};
  color: ${props => props.role === 'user' ? 'white' : '#2d3748'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: ${props => props.role === 'assistant' ? '1px solid #e2e8f0' : 'none'};
`;

const LoadingBubble = styled.div`
  max-width: 85%;
  padding: 14px 18px;
  border-radius: 16px 16px 16px 4px;
  align-self: flex-start;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 6px;
  align-items: center;
`;

const LoadingDot = styled.div<{ delay: number }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0288d1;
  animation: bounce 1.4s infinite ease-in-out;
  animation-delay: ${props => props.delay}s;

  @keyframes bounce {
    0%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
  }
`;

const InputContainer = styled.div`
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 10px;
  align-items: flex-end;
  flex-shrink: 0;
`;

const InputWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Input = styled.textarea`
  width: 100%;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  font-family: inherit;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: #0288d1;
    box-shadow: 0 0 0 3px rgba(2, 136, 209, 0.1);
  }

  &::placeholder {
    color: #999;
  }
`;

const SendButton = styled.button<{ disabled: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${props => props.disabled ? '#e0e0e0' : 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)'};
  color: white;
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-shadow: ${props => props.disabled ? 'none' : '0 2px 8px rgba(2, 136, 209, 0.3)'};

  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 4px 12px rgba(2, 136, 209, 0.4)'};
  }

  &:active {
    transform: ${props => props.disabled ? 'none' : 'translateY(0)'};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #a0aec0;
  text-align: center;
  padding: 40px 20px;

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    opacity: 0.3;
  }

  p {
    font-size: 14px;
    margin: 0;
    line-height: 1.5;
  }
`;

const MessageWrapper = styled.div<{ role: 'user' | 'assistant' }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.role === 'user' ? 'flex-end' : 'flex-start'};
  gap: 4px;
`;

const MessageTime = styled.div`
  font-size: 10px;
  color: #a0aec0;
  padding: 0 4px;
  margin-top: 2px;
`;

const AgentChat: React.FC<AgentChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.medforce-ai.com/send-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMessages),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();

      // Convert escaped newlines to actual newlines
      let formattedText = responseText.replace(/\\n/g, '\n');
      
      // Remove leading and trailing quotes
      formattedText = formattedText.replace(/^["']|["']$/g, '');

      const assistantMessage: Message = {
        role: 'assistant',
        content: formattedText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <Sidebar isOpen={isOpen}>
        <ChatHeader>
          <ChatTitle>MedForce Clinical Agent</ChatTitle>
          <CloseButton onClick={onClose}>
            <X />
          </CloseButton>
        </ChatHeader>

        <MessagesContainer>
          {messages.length === 0 ? (
            <EmptyState>
              <MessageCircle />
              <p>Ask me anything about patient data,<br />create tasks, or navigate the canvas.</p>
            </EmptyState>
          ) : (
            <>
              {messages.map((message, index) => (
                <MessageWrapper key={index} role={message.role}>
                  <MessageBubble role={message.role}>
                    {message.role === 'assistant' ? (
                      <MarkdownText content={message.content} />
                    ) : (
                      <MessageContent>{message.content}</MessageContent>
                    )}
                  </MessageBubble>
                  {message.timestamp && <MessageTime>{message.timestamp}</MessageTime>}
                </MessageWrapper>
              ))}
              {isLoading && (
                <LoadingBubble>
                  <LoadingDot delay={0} />
                  <LoadingDot delay={0.2} />
                  <LoadingDot delay={0.4} />
                </LoadingBubble>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </MessagesContainer>

        <InputContainer>
          <InputWrapper>
            <Input
              ref={inputRef}
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              rows={1}
            />
          </InputWrapper>
          <SendButton onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
            <Send />
          </SendButton>
        </InputContainer>
      </Sidebar>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default AgentChat;
