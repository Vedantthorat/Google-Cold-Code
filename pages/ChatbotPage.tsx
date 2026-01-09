
import React, { useState, useRef, useEffect } from 'react';
import { getChatInstance } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  sources?: any[];
}

const QUICK_PROMPTS = [
  "What are the top skills for SWE in 2025?",
  "How can I improve my LinkedIn profile?",
  "Tell me about latest trends in AI for PMs.",
  "Mock interview for React developer."
];

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hello! I'm your AI Career Coach. I can use Google Search to give you real-time industry insights. What's on your mind today?" },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInstanceRef = useRef<any>(null);

  useEffect(() => {
    chatInstanceRef.current = getChatInstance();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (textToSend.trim() === '') return;

    const userMessage: Message = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const result = await chatInstanceRef.current.sendMessageStream({ message: textToSend });
        let botResponse = '';
        setMessages(prev => [...prev, { sender: 'bot', text: '' }]);
        
        let sourcesFound: any[] = [];
        
        for await (const chunk of result) {
            const responseChunk = chunk as GenerateContentResponse;
            botResponse += responseChunk.text;
            
            // Check for grounding chunks/sources
            const chunks = responseChunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks) sourcesFound = chunks;

            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { 
                    sender: 'bot', 
                    text: botResponse,
                    sources: sourcesFound.length > 0 ? sourcesFound : undefined
                };
                return newMessages;
            });
        }

    } catch (error) {
      console.error('Gemini chat error:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I'm having trouble connecting to my brain right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto bg-white dark:bg-gray-950 rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="px-8 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-200">
                  <i data-lucide="bot" className="w-6 h-6 text-white"></i>
              </div>
              <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">AI Career Coach</h3>
                  <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-[10px] font-black text-gray-400 uppercase">Search Grounding Enabled</span>
                  </div>
              </div>
          </div>
          <button className="p-2 hover:bg-white rounded-xl transition-colors">
              <i data-lucide="more-vertical" className="w-5 h-5 text-gray-400"></i>
          </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto space-y-8 scroll-smooth">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.sender === 'bot' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <i data-lucide="bot" className="w-4 h-4 text-primary-500"></i>
                </div>
            )}
            <div className={`group space-y-2 max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-6 py-4 rounded-[28px] shadow-sm text-sm font-medium leading-relaxed ${
                    msg.sender === 'user' 
                    ? 'bg-primary-600 text-white rounded-tr-none' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-50 dark:border-gray-700'
                }`}>
                    <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></p>
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 px-2">
                        {msg.sources.map((src, i) => (
                            <a 
                                key={i} 
                                href={src.web?.uri || src.maps?.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full text-[10px] font-black text-primary-500 hover:bg-primary-50 transition-colors uppercase"
                            >
                                <i data-lucide="external-link" className="w-3 h-3"></i>
                                SOURCE {i + 1}
                            </a>
                        ))}
                    </div>
                )}
            </div>
          </div>
        ))}
        {isLoading && (
             <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <i data-lucide="bot" className="w-4 h-4 text-primary-500"></i>
                </div>
                <div className="px-6 py-4 rounded-[28px] bg-gray-100 dark:bg-gray-800 rounded-tl-none flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce ml-0.5" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce ml-0.5" style={{animationDelay: '0.2s'}}></div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
      </div>

      <div className="p-8 space-y-6 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
        {!isLoading && messages.length < 5 && (
            <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_PROMPTS.map((p, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleSend(p)}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-[10px] font-black text-gray-500 hover:text-primary-500 hover:border-primary-500 transition-all uppercase tracking-widest"
                    >
                        {p}
                    </button>
                ))}
            </div>
        )}
        <div className="flex items-center gap-4 bg-white dark:bg-gray-950 p-2 pl-6 rounded-[24px] shadow-lg border border-gray-100 dark:border-gray-800 focus-within:ring-2 focus-within:ring-primary-500 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder="Ask me about latest jobs, salaries, or trends..."
            className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0"
            disabled={isLoading}
          />
          <button 
            onClick={() => handleSend()} 
            disabled={isLoading || input.trim() === ''} 
            className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
          >
            <i data-lucide="send" className="w-5 h-5"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
