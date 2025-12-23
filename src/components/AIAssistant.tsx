import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, X, Bot, User, AlertCircle, Sparkles } from 'lucide-react';
import { processQuery, getSuggestedQuestions, type AIResponse } from '@/lib/ai-assistant';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: AIResponse['type'];
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your voting assistant. I can help you with procedural questions about the voting process, navigation, and accessibility. How can I assist you today?',
      type: 'answer',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate processing delay for offline AI
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    const response = processQuery(userMessage.content);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.message,
      type: response.type,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl h-[80vh] mx-4 flex flex-col rounded-xl border border-border bg-card shadow-electoral-lg animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-header">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Voting Assistant</h3>
              <div className="flex items-center gap-2">
                <span className="status-indicator online" />
                <span className="text-xs text-muted-foreground">Offline AI • No data transmitted</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-electoral">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}
            >
              {/* Avatar */}
              <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              {/* Message Content */}
              <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.type === 'blocked'
                    ? 'bg-destructive/10 border border-destructive/30 text-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {message.type === 'blocked' && (
                    <div className="flex items-center gap-2 mb-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Political Content Blocked</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 animate-slide-up">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <Bot className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="flex items-center gap-1 bg-secondary rounded-lg px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 2 && (
          <div className="px-6 py-3 border-t border-border bg-secondary/30">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Suggested Questions
            </p>
            <div className="flex flex-wrap gap-2">
              {getSuggestedQuestions().slice(0, 3).map((question, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about voting..."
              className="secure-input flex-1"
              disabled={isTyping}
            />
            <Button
              type="submit"
              variant="electoral"
              size="icon"
              disabled={!input.trim() || isTyping}
              className="h-12 w-12 flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Floating trigger button
export function AIAssistantTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 transition-all hover:scale-105 z-40"
      aria-label="Open AI Assistant"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
