"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([
    { role: 'bot', content: "Hello! Welcome to Krishna Library. How can I help you today? \n\nI can help you with membership plans, facilities, and seat bookings." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking on the floating button (which toggles it)
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node) && !(event.target as Element).closest('button[aria-label="Open Chat"]')) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessages(prev => [...prev, { role: 'user', content: `[Uploaded File: ${file.name}]` }]);
      setIsLoading(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', content: "File upload feature is currently in beta. I've noted the file, but I cannot process it yet!" }]);
        setIsLoading(false);
      }, 1000);
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history })
      });

      if (!res.ok) throw new Error('Network response was not ok');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I am facing some issues. Please contact us on WhatsApp: https://wa.me/0000000000" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: [0, -8, 0],
              boxShadow: [
                "0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)",
                "0px 20px 25px -5px rgba(0,0,0,0.15), 0px 8px 10px -6px rgba(0,0,0,0.1)",
                "0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)"
              ]
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ 
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-4 sm:right-6 z-50 flex items-center justify-center w-14 h-14 bg-v-primary text-v-on-primary rounded-full hover:bg-v-primary-fixed-variant"
            aria-label="Open Chat"
            style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
          >
            <MessageCircle className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: 10, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 30, scale: 0.9, rotateX: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            data-lenis-prevent="true"
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] h-[75vh] max-h-[600px] bg-v-surface-container-lowest rounded-2xl shadow-2xl border border-v-outline-variant/20 flex flex-col overflow-hidden"
            style={{ perspective: "1000px" }}
          >
            {/* Header */}
            <div className="bg-v-primary text-v-on-primary p-4 flex items-center justify-between shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-v-on-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="font-v-headline-sm text-sm font-bold">Library Assistant</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-v-on-primary/20 p-1.5 rounded-full transition focus:outline-none focus:ring-2 focus:ring-v-on-primary/50"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto overscroll-contain min-h-0 bg-v-surface flex flex-col gap-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-v-outline-variant/30 [&::-webkit-scrollbar-thumb]:rounded-full">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                  <div className={`p-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-v-primary text-v-on-primary rounded-tr-sm' : 'bg-v-surface-container-high text-v-on-surface rounded-tl-sm border border-v-outline-variant/10'}`}>
                    <p className="text-sm font-v-body-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="self-start max-w-[85%] flex items-center gap-2 text-v-primary p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-v-label-sm">Typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input & Tags */}
            <div className="flex flex-col p-4 bg-v-surface-container-lowest border-t border-v-outline-variant/20 shrink-0">
              <div className="flex flex-col items-center mx-auto w-full">
                <div className="relative flex flex-col rounded-2xl p-[2px] overflow-hidden w-full">
                  {/* Glow effect */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-v-primary/30 via-v-primary/10 to-transparent blur-sm"></div>

                  {/* Chat Box */}
                  <form onSubmit={handleSend} className="flex flex-col bg-white dark:bg-black/50 rounded-xl w-full overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative z-10">
                    <div className="relative flex">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Type your creative idea here...✨"
                        className="bg-transparent rounded-xl w-full h-14 text-gray-900 dark:text-white font-sans text-sm font-medium p-3 resize-none outline-none placeholder-gray-600 dark:placeholder-gray-400 scrollbar-thin scrollbar-thumb-gray-500 dark:scrollbar-thumb-gray-700 scrollbar-thumb-rounded hover:scrollbar-thumb-gray-700 transition-all"
                      />
                    </div>

                    {/* Options */}
                    <div className="flex justify-between items-end p-3 pt-0">
                      <div className="flex gap-3">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex text-gray-400 dark:text-white/20 bg-transparent border-none cursor-pointer transition-all duration-300 hover:text-gray-900 dark:hover:text-white hover:-translate-y-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex text-gray-400 dark:text-white/20 bg-transparent border-none cursor-pointer transition-all duration-300 hover:text-gray-900 dark:hover:text-white hover:-translate-y-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-2"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
                        </button>
                        <button type="button" onClick={() => alert("More options coming soon!")} className="flex text-gray-400 dark:text-white/20 bg-transparent border-none cursor-pointer transition-all duration-300 hover:text-gray-900 dark:hover:text-white hover:-translate-y-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-horizontal"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                        </button>
                      </div>

                      {/* Submit */}
                      <button 
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="flex p-[2px] bg-gradient-to-t dark:from-gray-800 dark:via-gray-600 dark:to-gray-800 from-gray-300 via-gray-200 to-gray-400 rounded-lg shadow-inner border-none outline-none cursor-pointer transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                      >
                        <i className="w-8 h-8 dark:bg-black/10 bg-white/50 rounded-lg backdrop-blur-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                          <Send size={18} className="transition-all duration-300 hover:text-gray-900 dark:hover:text-white hover:drop-shadow-[0_0_5px_#fff]" />
                        </i>
                      </button>
                    </div>
                  </form>
                  
                  {/* Tags */}
                  <AnimatePresence>
                    {messages.length === 1 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2 text-gray-900 dark:text-white text-xs py-3 overflow-hidden"
                      >
                        {["Generate Image", "Analyze Data", "Explore More"].map((tag, idx) => (
                          <span
                            key={idx}
                            onClick={() => setInput(tag)}
                            className="px-2 py-1 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg cursor-pointer select-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-900"
                          >
                            {tag}
                          </span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
