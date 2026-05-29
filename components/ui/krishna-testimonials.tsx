"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Marquee } from "@/components/ui/marquee"


const FAQ_DATA = [
  {
    question: "Timings",
    fullQuestion: "What are the operational shift timings for both branches?",
    answer: "Our branches operate in three flexible shifts to fit your study routine:\n\n• Bangali Chowk:\n  Morning: 07:00 AM – 03:00 PM\n  Evening: 03:00 PM – 10:00 PM\n  Full Day: 07:00 AM – 10:00 PM\n\n• Namnakala:\n  Morning: 07:30 AM – 02:30 PM\n  Evening: 02:30 PM – 09:30 PM\n  Full Day: 07:30 AM – 09:30 PM",
    icon: "schedule",
    color: "text-blue-400"
  },
  {
    question: "Pricing & Plans",
    fullQuestion: "What are the membership subscription fees?",
    answer: "We offer highly affordable and premium pricing for all students:\n\n• Morning Slot: ₹600/month\n• Evening Slot: ₹600/month\n• Full Day Slot: ₹1,000/month\n\nThese rates include full access to high-speed internet, reserved seating, air conditioning, and all standard amenities without any hidden charges.",
    icon: "payments",
    color: "text-emerald-400"
  },
  {
    question: "Our Branches",
    fullQuestion: "Where are the library branches located in Ambikapur?",
    answer: "We have two premier, quiet learning hubs situated in central locations:\n\n• Bangali Chowk Branch:\n  Plot 12, Bangali Chowk Area, Ambikapur, C.G.\n\n• Namnakala Branch:\n  2nd Floor, Zenith Plaza, Namnakala, Ambikapur, C.G. (Right above Central Wing)",
    icon: "map",
    color: "text-red-400"
  },
  {
    question: "Internet Speed",
    fullQuestion: "Does the library provide high-speed Wi-Fi?",
    answer: "Absolutely. We provide ultra-high-speed, redundant fiber optic Wi-Fi connectivity across all study cabins. Our network is fully optimized for streaming high-definition video lectures, online research, and handling heavy digital downloads smoothly.",
    icon: "speed",
    color: "text-primary"
  },
  {
    question: "Book Lockers",
    fullQuestion: "Are secure storage facilities available for my books?",
    answer: "Yes! We feature dedicated personal locker storage units. Members can safely secure their textbooks, notes, and personal laptops inside their assigned lockers, eliminating the need to carry heavy bags back and forth every day.",
    icon: "lock",
    color: "text-tertiary"
  },
  {
    question: "Power Backup",
    fullQuestion: "What happens during power outages?",
    answer: "Our branches are backed by high-capacity heavy-duty industrial power inverters. This ensures 100% uninterrupted power supply (UPS) so that lighting, high-speed Wi-Fi networks, and individual charging points remain active without even a millisecond of lag.",
    icon: "bolt",
    color: "text-yellow-400"
  },
  {
    question: "Free Trial",
    fullQuestion: "Can I experience the library before purchasing a membership?",
    answer: "Yes, we welcome all prospective scholars with a 1-day complimentary free trial. You can visit either branch, experience the pin-drop silent environment, test the premium seats, and explore our facilities first-hand before subscribing.",
    icon: "model_training",
    color: "text-purple-400"
  }
];

const ALL_REVIEWS = [
  { name: "CA Siddharth Jaiswal", text: "I cleared my CA Final exam while studying at this library, and it truly deserves appreciation. provides wide study cabins...", rating: 5, time: "3 months ago" },
  { name: "Ravi Gupta", text: "An oasis of calm. With excellent lighting, comfortable seating, and a strictly quiet environment, this is hands-down the best.", rating: 5, time: "3 months ago" },
  { name: "Ankit Kashyap", text: "Much Better Than Others libraries in Ambikapur. The price is also very low. Chair and desk are very good.", rating: 5, time: "7 months ago" },
  { name: "Yogesh Sharma", text: "I had a great experience studying at Krishna Library. The environment is peaceful and perfect for focused study.", rating: 5, time: "9 months ago" },
  { name: "Ashish Kunj", text: "Excellent place for students and professionals looking for a peaceful environment. Well-organized seating.", rating: 5, time: "a year ago" },
  { name: "Rahul Gupta", text: "Welcoming and peaceful atmosphere. Separate dark and light rooms is a thoughtful touch. Knowledgeable staff.", rating: 5, time: "a year ago" },
  { name: "Khushi Goyal", text: "Serene and conducive to focused study. Modern amenities, including high-speed internet and digital access.", rating: 5, time: "a year ago" },
  { name: "Sakshi pandey", text: "Krishna library...best library in Ambikapur. where silence speaks and knowledge grows 📚 …", rating: 5, time: "3 months ago" },
  { name: "Kanishk Soni", text: "Best library I have visited till now; best ambience and very quiet, meaning you can focus on your study.", rating: 5, time: "a year ago" },
  { name: "Rashika Yadav", text: "The aura of this library is so soothing and create a positive environment for study. A1 facilities you can have here.", rating: 5, time: "a year ago" },
]

const MAPS_LINK = "https://maps.app.goo.gl/bsPCTMXGutRHnH8a9";
const WHATSAPP_LINK = "https://wa.me/917999808383?text=Hi%20Krishna%20Library,%20I%20have%20a%20question%20about%20your%20facilities.";
const GOOGLE_G_LOGO = "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png";

function GoogleReviewBlock({ review }: { review: any }) {
  return (
    <div className="bg-white text-black p-5 rounded-xl shadow-sm w-[300px] flex flex-col gap-3 shrink-0 select-none">
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f1f3f4] flex items-center justify-center font-bold text-[#5f6368] text-lg uppercase">
            {review.name[0]}
          </div>
          <div>
            <div className="font-bold text-sm text-[#202124]">{review.name}</div>
            <div className="text-[11px] text-[#70757a]">{review.time}</div>
          </div>
        </div>
        <img src={GOOGLE_G_LOGO} alt="Google" width={20} height={20} className="object-contain" />
      </div>
      <div className="flex gap-0.5">
        {[...Array(review.rating)].map((_, i) => (
          <span key={i} className="material-symbols-outlined text-[#fbbc04] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        ))}
      </div>
      <p className="text-[13px] leading-relaxed line-clamp-3 text-[#3c4043] font-sans">
        {review.text}
      </p>
    </div>
  );
}

export function KrishnaTestimonials() {
  return (
    <section className="relative overflow-hidden bg-transparent py-32 px-8">
      <div className="pointer-events-none absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/10 blur-[150px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-tertiary/5 blur-[150px] rounded-full" />

      <div className="relative z-10 text-center mb-24">
        <div className="flex flex-col items-center mb-8">
          <motion.span 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="material-symbols-outlined text-[#e9c400] text-6xl mb-4 drop-shadow-[0_0_20px_rgba(233,196,0,0.4)]"
          >
            crown
          </motion.span>
          <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-[-0.05em] font-manrope leading-[0.9]">
            Got <span className="text-primary italic">Questions?</span><br />
            We have <span className="text-white/40">Answers.</span>
          </h2>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FAQ_DATA.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group glass-pane p-8 rounded-[32px] transition-all duration-500 flex flex-col h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <span className={`material-symbols-outlined text-3xl ${item.color}`}>{item.icon}</span>
              </div>
              
              <h3 className="text-xl font-black text-white font-manrope uppercase tracking-tight mb-4 group-hover:text-primary transition-colors">
                {item.question}
              </h3>
              
              <div className="space-y-4 flex-grow">
                <p className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Detailed Query:</p>
                <p className="text-sm font-bold text-white/90 leading-snug">
                  {item.fullQuestion}
                </p>
                <div className="w-10 h-0.5 bg-white/10 group-hover:w-20 transition-all duration-500" />
                <p className="text-sm text-white/50 leading-relaxed font-medium">
                  {item.answer}
                </p>
              </div>
            </motion.div>
          ))}

          <motion.a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2 group bg-primary p-12 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 hover:scale-[1.02] transition-all shadow-[0_30px_100px_rgba(102,178,255,0.2)] cursor-pointer"
          >
            <div className="text-center md:text-left space-y-4">
              <h3 className="text-3xl md:text-4xl font-black text-on-primary font-manrope uppercase leading-none tracking-tighter">
                Still have a question?<br />
                <span className="text-on-primary/60">Chat with the owner.</span>
              </h3>
              <p className="text-on-primary/80 font-bold uppercase tracking-widest text-xs">Direct Support • Response in 5 mins</p>
            </div>
            <div className="bg-white text-primary px-10 py-6 rounded-[24px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-4 group-hover:gap-6 transition-all shrink-0">
              Contact Us
              <span className="material-symbols-outlined font-black">north_east</span>
            </div>
          </motion.a>
        </div>
      </div>

      <div className="relative z-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white/5">
            <div className="flex gap-0.5">
               {[...Array(5)].map((_, i) => (
                 <span key={i} className="material-symbols-outlined text-[#fbbc04] text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
               ))}
            </div>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Trusted by 200+ Scholars</span>
          </div>
        </div>
        
        <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-transparent to-transparent z-30 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-transparent to-transparent z-30 pointer-events-none"></div>
        
        <div className="space-y-8">
          <Marquee className="[--duration:50s] gap-8" pauseOnHover>
            {ALL_REVIEWS.map((review, idx) => (
              <a key={idx} href={MAPS_LINK} target="_blank" rel="noopener noreferrer">
                <GoogleReviewBlock review={review} />
              </a>
            ))}
          </Marquee>
          
          <Marquee className="[--duration:60s] gap-8" reverse pauseOnHover>
            {[...ALL_REVIEWS].reverse().map((review, idx) => (
              <a key={idx} href={MAPS_LINK} target="_blank" rel="noopener noreferrer">
                <GoogleReviewBlock review={review} />
              </a>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  )
}
