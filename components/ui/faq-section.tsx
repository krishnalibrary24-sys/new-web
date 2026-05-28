"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle, Sparkles, MessageCircleQuestion } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "What are the library's operating hours?",
    answer:
      "Our main branches are open from 8:00 AM to 10:00 PM on weekdays, and 9:00 AM to 8:00 PM on weekends. During exam seasons, we extend our hours to 24/7 at select locations to support our students.",
  },
  {
    question: "How do I become a member?",
    answer:
      "You can easily become a member by clicking the 'Enroll Now' button in our navigation bar or visiting any of our branches. Membership requires a valid ID and a minimal monthly subscription fee.",
  },
  {
    question: "Is high-speed Wi-Fi available for visitors?",
    answer:
      "Yes! We provide complimentary high-speed internet access to all members. Guests can also enjoy up to 2 hours of free Wi-Fi per day after a quick registration at the front desk.",
  },
  {
    question: "Can I reserve a study cabin in advance?",
    answer:
      "Absolutely. Active members can reserve individual or group study cabins up to 48 hours in advance through our online staff portal or the library reception desk.",
  },
  {
    question: "Do you offer digital resources or only physical books?",
    answer:
      "We offer a hybrid learning experience. Alongside our vast collection of over 100,000 physical books, members get exclusive access to premium digital journals, e-books, and online course platforms.",
  },
];

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" className="py-24 px-4 bg-gradient-to-b from-v-surface-container-low to-v-surface relative overflow-hidden">
      {/* Background Floating Elements */}
      <motion.div
        className="absolute top-10 left-10 w-72 h-72 rounded-full bg-v-primary/5 blur-3xl"
        animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-v-secondary/5 blur-3xl"
        animate={{ y: [0, 40, 0], x: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/3 w-4 h-4 rounded-full bg-v-primary/30"
        animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-3 h-3 rounded-full bg-v-secondary/30"
        animate={{ y: [0, 20, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <div className="max-w-container-max mx-auto relative z-10 flex flex-col lg:flex-row gap-16 items-start">
        
        {/* Left Content - Sticky */}
        <div className="w-full lg:w-5/12 lg:sticky lg:top-32 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-v-primary/10 text-v-primary font-v-label-md text-sm uppercase tracking-wider mb-4 border border-v-primary/20">
              <HelpCircle className="w-4 h-4" />
              Have Questions?
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-v-display text-v-on-background mb-4 leading-tight">
              Frequently <br />
              <span className="text-v-primary relative">
                Asked Questions
                <Sparkles className="absolute -top-3 -right-6 text-v-secondary w-6 h-6 animate-pulse" />
              </span>
            </h2>
            <p className="text-v-on-surface-variant text-lg font-v-body-md leading-relaxed mb-8">
              Everything you need to know about joining Krishna Library, our facilities, and making the most of your study sessions.
            </p>
            
            <motion.div 
              className="glass-pane p-6 rounded-2xl flex items-center gap-5 border border-v-outline-variant/30 relative overflow-hidden"
              whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0,49,120,0.15)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-v-secondary/10 rounded-full blur-xl"></div>
              <div className="w-12 h-12 rounded-full bg-v-surface flex items-center justify-center text-v-primary shadow-sm shrink-0">
                <MessageCircleQuestion className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-v-on-surface mb-1 font-v-headline-sm">Still have questions?</h4>
                <p className="text-sm text-v-on-surface-variant">Our support team is here to help.</p>
                <a href="#contact" className="text-v-secondary text-sm font-bold hover:underline mt-1 inline-block">Contact Support &rarr;</a>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Content - Accordion */}
        <div className="w-full lg:w-7/12 space-y-4">
          {faqs.map((faq, index) => {
            const isActive = activeIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isActive 
                    ? "bg-white border-v-primary/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" 
                    : "bg-v-surface-container-lowest/50 border-v-outline-variant/20 hover:border-v-primary/20 hover:bg-white/80"
                }`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className={`font-bold font-v-headline-sm pr-8 transition-colors ${isActive ? "text-v-primary" : "text-v-on-background"}`}>
                    {faq.question}
                  </span>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isActive ? "bg-v-primary text-v-on-primary" : "bg-v-surface text-v-on-surface-variant group-hover:bg-v-surface-container"
                  }`}>
                    {isActive ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                      <div className="px-6 pb-6 text-v-on-surface-variant font-v-body-md leading-relaxed border-t border-v-outline-variant/10 pt-4 mt-2">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
        
      </div>
    </section>
  );
}
