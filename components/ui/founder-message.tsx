"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote, Sparkles, Trophy, ShieldCheck, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function FounderMessageSection() {
  const [founderImg, setFounderImg] = useState("/assets/founder.png");

  useEffect(() => {
    async function loadFounderImg() {
      try {
        const { data, error } = await supabase
          .from("library_settings")
          .select("value")
          .eq("id", "founder_image_url")
          .maybeSingle();
        if (error) throw error;
        if (data?.value) {
          setFounderImg(data.value);
        }
      } catch (err) {
        console.warn("Failed to load founder image", err);
      }
    }
    loadFounderImg();
  }, []);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section
      id="founder-message"
      className="py-20 md:py-28 bg-transparent relative overflow-hidden text-v-on-surface"
    >
      {/* Decorative background blurs */}
      <div className="absolute top-1/2 left-10 w-72 h-72 rounded-full bg-v-primary/5 blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-v-secondary/5 blur-3xl pointer-events-none" />

      <div className="max-w-[1100px] mx-auto px-6 relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {/* Left Column: Founder Photo Card */}
          <motion.div
            className="lg:col-span-5 flex justify-center"
            variants={itemVariants}
          >
            <div className="relative group max-w-xs sm:max-w-sm w-full">
              {/* Outer Glow / Glass Frame */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-v-primary/10 via-v-secondary/5 to-transparent rounded-[2.5rem] blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative bg-white/70 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-4 border border-v-outline-variant/15 shadow-[0_20px_50px_-20px_rgba(0,49,120,0.15)] group-hover:border-v-primary/20 transition-all duration-500 hover:-translate-y-1">
                {/* Image Wrapper */}
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-5 bg-slate-100 dark:bg-slate-800">
                  <img
                    src={founderImg}
                    alt="Shivendra - Founder"
                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-v-primary/30 to-transparent mix-blend-multiply opacity-60 group-hover:opacity-30 transition-opacity duration-500" />
                </div>

                {/* Founder Details */}
                <div className="text-center pb-2">
                  <h3 className="font-montserrat text-lg font-extrabold text-v-on-background tracking-wide">
                    Shivendra
                  </h3>
                  <p className="font-montserrat text-xs font-semibold text-v-primary uppercase tracking-widest mt-0.5">
                    Founder, Krishna Library
                  </p>
                  
                  {/* Badge */}
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-v-primary/10 text-v-primary rounded-full">
                    <Sparkles className="w-3 h-3 text-v-primary animate-pulse" />
                    <span className="font-montserrat text-[9px] font-bold tracking-wider uppercase">
                      Vision 2026
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Founder Message text */}
          <motion.div
            className="lg:col-span-7 flex flex-col justify-center space-y-6"
            variants={itemVariants}
          >
            {/* Title / Badge */}
            <div className="flex flex-col gap-2">
              <span className="text-v-primary font-montserrat font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2">
                <span className="w-6 h-0.5 bg-v-primary rounded-full inline-block" />
                FOUNDER'S NOTE
              </span>
              <h2 className="font-montserrat text-3xl md:text-4xl font-extrabold text-v-on-background tracking-tight leading-tight">
                Nurturing Focus, <br />
                <span className="bg-gradient-to-r from-v-primary to-v-secondary bg-clip-text text-transparent">
                  Enabling Dreams
                </span>
              </h2>
            </div>

            {/* Stylized Quote Icon and Paragraphs */}
            <div className="relative">
              <Quote className="absolute -top-6 -left-6 w-12 h-12 text-v-primary/10 -z-10 transform -rotate-180" />
              
              <div className="space-y-4 font-lexend text-sm md:text-[15px] text-v-on-surface-variant leading-relaxed font-light">
                <p>
                  When I began my own academic and professional journey, I quickly realized that the greatest barrier to success isn't a lack of study resources—it is the challenge of finding a quiet, dedicated, and comfortable place to focus.
                </p>
                <p>
                  <strong>Krishna Library</strong> was founded to bridge this gap. We set out to design a premium study sanctuary in Ambikapur where students can leave the distractions of the outside world behind. From our dual-theme silent cabins and full climate control to our separate discussion zones, every single detail is engineered to support deep focus.
                </p>
                <p>
                  Our goal has always been to provide a space where your dedication meets the perfect ecosystem. We are honored to be a part of your journey toward achieving your dreams.
                </p>
              </div>
            </div>

            {/* Digital Signature representation */}
            <div className="pt-4 border-t border-v-outline-variant/10 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex flex-col">
                <span className="font-montserrat text-[15px] font-extrabold text-v-on-background">
                  Shivendra
                </span>
                <span className="text-[11px] text-v-on-surface-variant/80 font-lexend font-medium">
                  Founder & Director
                </span>
              </div>
              
              {/* Signature look font block */}
              <div className="font-serif italic text-v-primary/70 text-2xl tracking-wide select-none pr-4">
                Shivendra
              </div>
            </div>

            {/* Core Values Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { icon: <Trophy className="w-3.5 h-3.5" />, label: "Distraction-Free" },
                { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Student-Centric" },
                { icon: <Heart className="w-3.5 h-3.5" />, label: "Premium Comfort" },
              ].map((value, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-900 border border-v-outline-variant/10 rounded-xl text-xs font-semibold text-v-on-surface-variant"
                >
                  <span className="text-v-primary">{value.icon}</span>
                  <span>{value.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
