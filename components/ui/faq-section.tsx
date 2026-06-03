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
    question: "What are the operational shift timings for both branches?",
    answer:
      "Our branches operate in three flexible shifts to fit your study routine:\n\n• Bangali Chowk:\n  - Morning: 07:00 AM – 03:00 PM\n  - Evening: 03:00 PM – 10:00 PM\n  - Full Day: 07:00 AM – 10:00 PM\n\n• Namnakala:\n  - Morning: 07:30 AM – 02:30 PM\n  - Evening: 02:30 PM – 09:30 PM\n  - Full Day: 07:30 AM – 09:30 PM",
  },
  {
    question: "What are the membership subscription fees?",
    answer:
      "We offer highly affordable and premium pricing for all students:\n\n• Morning Slot: ₹600/month\n• Evening Slot: ₹600/month\n• Full Day Slot: ₹1,000/month\n\nThese rates include full access to high-speed internet, reserved seating, air conditioning, and all standard amenities without any hidden charges.",
  },
  {
    question: "Where are the library branches located in Ambikapur?",
    answer:
      "We have two premier, quiet learning hubs situated in central locations:\n\n• Bangali Chowk Branch:\n  Plot 12, Bangali Chowk Area, Ambikapur, C.G.\n\n• Namnakala Branch:\n  2nd Floor, Zenith Plaza, Namnakala, Ambikapur, C.G.",
  },
  {
    question: "Does the library provide high-speed Wi-Fi?",
    answer:
      "Absolutely. We provide ultra-high-speed, redundant fiber optic Wi-Fi connectivity across all study cabins. Our network is fully optimized for streaming high-definition video lectures, online research, and handling heavy digital downloads smoothly.",
  },
  {
    question: "Are secure storage facilities available for my books?",
    answer:
      "Yes! We feature dedicated personal locker storage units. Members can safely secure their textbooks, notes, and personal laptops inside their assigned lockers, eliminating the need to carry heavy bags back and forth every day.",
  },
  {
    question: "What happens during power outages?",
    answer:
      "Our branches are backed by high-capacity heavy-duty industrial power inverters. This ensures 100% uninterrupted power supply (UPS) so that lighting, high-speed Wi-Fi networks, and individual charging points remain active without even a millisecond of lag.",
  },
  {
    question: "Can I experience the library before purchasing a membership?",
    answer:
      "Yes, we welcome all prospective scholars with a 1-day complimentary free trial. You can visit either branch, experience the pin-drop silent environment, test the premium seats, and explore our facilities first-hand before subscribing.",
  },
  {
    question: "What is the difference between Reserved and Unreserved seats?",
    answer:
      "Reserved members are allocated a specific study cabin desk number which is exclusively theirs for the duration of their shift. Unreserved members can access the library facilities, Wi-Fi, lockers, and other common areas, but do not have a dedicated seat assigned.",
  },
];

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" className="py-24 px-4 bg-transparent relative overflow-hidden">
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
                      <div className="px-6 pb-6 text-v-on-surface-variant font-v-body-md leading-relaxed border-t border-v-outline-variant/10 pt-4 mt-2 whitespace-pre-line">
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
