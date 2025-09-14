import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  initialMessage: string;
  firstName: string;
}

export function AIChat({ initialMessage, firstName }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: initialMessage,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "Thanks for your message! I'm still learning about you to provide better opportunity recommendations.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg">
        {/* Messages */}
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 items-start ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.type === 'ai' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-neutral-600">AI</span>
                </div>
              )}
              <div className={`max-w-[70%] ${message.type === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line relative ${
                  message.type === 'ai' 
                    ? 'bg-neutral-100 text-neutral-700' 
                    : 'bg-blue-600 text-white'
                }`}>
                  {message.content}
                  {message.type === 'ai' && (
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-neutral-100 rotate-45"></div>
                  )}
                  {message.type === 'user' && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 rotate-45"></div>
                  )}
                </div>
              </div>
              {message.type === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">{firstName.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 items-start justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                <span className="text-sm font-medium text-neutral-600">AI</span>
              </div>
              <div className="bg-neutral-100 rounded-2xl px-4 py-3 relative">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-neutral-100 rotate-45"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4">
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about opportunities..."
              className="flex-1 resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
            />
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}