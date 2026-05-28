'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Battery,
  Sliders,
  ChevronRight,
  Zap,
  Bluetooth,
  Wifi,
  Music,
  LucideIcon,
  Users,
  MapPin,
  Clock,
  Sparkles,
  Headphones,
  BookOpen
} from 'lucide-react';
import Image from 'next/image';

// =========================================
// 1. CONFIGURATION & DATA TYPES
// =========================================

export type BranchId = 'bengali-chowk' | 'namnakala';

export interface FeatureMetric {
  label: string;
  value: number; // 0-100
  icon: LucideIcon;
}

export interface BranchData {
  id: BranchId;
  label: string; // Display name for the switcher
  title: string;
  description: string;
  image: string;
  address: string;
  colors: {
    gradient: string; // Tailwind gradient classes
    glow: string;     // Tailwind color class for accents
    ring: string;     // Tailwind border color for rings
  };
  features: FeatureMetric[];
}

const getBranchData = (occupancy: Record<string, number>): Record<BranchId, BranchData> => ({
  'bengali-chowk': {
    id: 'bengali-chowk',
    label: 'Bengali Chowk',
    title: 'Flagship Hub',
    description: 'Our premier intellectual sanctuary at Bengali Chowk. Engineered for absolute silence, unmatched connectivity, and the pursuit of excellence.',
    image: '/assets/exterior.jpg',
    address: 'Plot 12, Bengali Chowk Area, Ambikapur.',
    colors: {
      gradient: 'from-blue-600 to-indigo-900',
      glow: 'bg-blue-500',
      ring: '',
    },
    features: [
      { label: 'Occupancy', value: occupancy['bengali-chowk'] || 0, icon: Users },
      { label: 'Ambience', value: 98, icon: Sparkles },
      { label: 'Connectivity', value: 100, icon: Wifi },
    ],
  },
  'namnakala': {
    id: 'namnakala',
    label: 'Namnakala',
    title: 'Central Wing',
    description: 'Modern workspace on the 2nd Floor of Zenith Plaza. A dedicated space for deep focus and collaborative academic growth.',
    image: '/assets/exterior.jpg',
    address: '2nd Floor, Zenith Plaza, Namnakala, Ambikapur.',
    colors: {
      gradient: 'from-orange-600 to-amber-900',
      glow: 'bg-orange-500',
      ring: '',
    },
    features: [
      { label: 'Occupancy', value: occupancy['namnakala'] || 0, icon: Users },
      { label: 'Quietude', value: 95, icon: Zap },
      { label: 'Resources', value: 92, icon: BookOpen },
    ],
  },
});

// =========================================
// 2. ANIMATION VARIANTS
// =========================================

const ANIMATIONS = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
    exit: { opacity: 0, y: -10, filter: 'blur(5px)' },
  },
  image: (isLeft: boolean): Variants => ({
    initial: {
      opacity: 0,
      scale: 1.2,
      filter: 'blur(15px)',
      rotate: isLeft ? -10 : 10,
      x: isLeft ? -40 : 40,
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      rotate: 0,
      x: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      filter: 'blur(20px)',
      transition: { duration: 0.25 },
    },
  }),
};

// =========================================
// 3. SUB-COMPONENTS
// =========================================

const BackgroundGradient = ({ isLeft }: { isLeft: boolean }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <motion.div
      animate={{
        background: isLeft
          ? 'radial-gradient(circle at 0% 50%, rgba(59, 130, 246, 0.1), transparent 50%)'
          : 'radial-gradient(circle at 100% 50%, rgba(249, 115, 22, 0.1), transparent 50%)',
      }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0"
    />
  </div>
);

const ProductVisual = ({ data, isLeft }: { data: BranchData; isLeft: boolean }) => (
  <motion.div layout="position" className="relative group shrink-0">
    {/* Animated Rings */}
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      className={`absolute inset-[-10%] rounded-[40px] ${data.colors.ring}`}
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute inset-0 rounded-[40px] bg-gradient-to-br ${data.colors.gradient} blur-3xl opacity-20`}
    />

    {/* Image Container */}
    <div className="relative h-64 w-full md:h-[400px] md:w-[600px] rounded-[40px] shadow-2xl flex items-center justify-center overflow-hidden bg-black/20 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={data.id}
          variants={ANIMATIONS.image(isLeft)}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative w-full h-full"
        >
          <Image
            src={data.image}
            alt={`${data.title}`}
            fill
            className="object-cover opacity-80"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
        </motion.div>
      </AnimatePresence>
    </div>

    {/* Status Label */}
    <motion.div
      layout="position"
      className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-20"
    >
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 bg-surface-container/80 px-4 py-2 rounded-full backdrop-blur-xl">
        <span className={`h-1.5 w-1.5 rounded-full ${data.colors.glow} animate-pulse`} />
        Branch Active
      </div>
    </motion.div>
  </motion.div>
);

const ProductDetails = ({ data, isLeft }: { data: BranchData; isLeft: boolean }) => {
  const alignClass = isLeft ? 'items-start text-left' : 'items-end text-right';
  const flexDirClass = isLeft ? 'flex-row' : 'flex-row-reverse';
  const barColorClass = isLeft ? 'left-0 bg-blue-500' : 'right-0 bg-orange-500';
  const textColorClass = isLeft ? 'text-primary' : 'text-orange-500';
  const bgColorClass = isLeft ? 'bg-primary text-on-primary' : 'bg-orange-600 text-white';

  return (
    <motion.div
      variants={ANIMATIONS.container}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex flex-col ${alignClass}`}
    >
      <motion.h2 variants={ANIMATIONS.item} className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 italic ${textColorClass}`}>
        {data.label}
      </motion.h2>
      <motion.h1 variants={ANIMATIONS.item} className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-white uppercase font-manrope">
        {data.title}
      </motion.h1>
      <motion.p variants={ANIMATIONS.item} className={`text-white/40 mb-10 max-w-sm leading-relaxed text-sm ${isLeft ? 'mr-auto' : 'ml-auto'}`}>
        {data.description}
      </motion.p>

      {/* Feature Grid */}
      <motion.div variants={ANIMATIONS.item} className="w-full space-y-6 bg-white/[0.02] p-8 rounded-[32px] backdrop-blur-sm">
        {data.features.map((feature, idx) => (
          <div key={feature.label} className="group">
            <div className={`flex items-center justify-between mb-3 text-xs ${flexDirClass}`}>
              <div className={`flex items-center gap-3 ${feature.value > 50 ? 'text-white' : 'text-white/60'}`}>
                <feature.icon size={16} className={textColorClass} /> <span className="font-black uppercase tracking-widest">{feature.label}</span>
              </div>
              <span className="font-mono text-[10px] text-white/30 font-bold">{feature.value}%</span>
            </div>
            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${feature.value}%` }}
                transition={{ duration: 1.5, delay: 0.4 + idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute top-0 bottom-0 ${barColorClass} opacity-60 shadow-[0_0_10px_rgba(102,178,255,0.3)]`}
              />
            </div>
          </div>
        ))}

        <div className={`pt-4 flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group">
             <MapPin size={14} className={textColorClass} />
             {data.address}
          </div>
        </div>
      </motion.div>

      {/* Action */}
      <motion.div variants={ANIMATIONS.item} className={`mt-8 flex items-center gap-6 ${flexDirClass}`}>
        <a href="#enquiry" className={`${bgColorClass} px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl`}>
           Book My Seat
        </a>
        <a href="#gallery" className="text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
           View Gallery
        </a>
      </motion.div>
    </motion.div>
  );
};

const Switcher = ({ 
  activeId, 
  onToggle,
  data
}: { 
  activeId: BranchId; 
  onToggle: (id: BranchId) => void;
  data: Record<BranchId, BranchData>;
}) => {
  const options = Object.values(data).map(p => ({ id: p.id, label: p.label }));

  return (
    <div className="flex justify-center mt-20">
      <motion.div layout className="flex items-center gap-2 p-2 rounded-full bg-white/[0.03] backdrop-blur-2xl shadow-2xl">
        {options.map((opt) => (
          <motion.button
            key={opt.id}
            onClick={() => onToggle(opt.id as BranchId)}
            whileTap={{ scale: 0.96 }}
            className="relative px-8 h-12 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest focus:outline-none"
          >
            {activeId === opt.id && (
              <motion.div
                layoutId="island-surface"
                className={`absolute inset-0 rounded-full ${opt.id === 'namnakala' ? 'bg-orange-500/20' : 'bg-primary/20'}`}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              />
            )}
            <span className={`relative z-10 transition-colors duration-300 ${activeId === opt.id ? (opt.id === 'namnakala' ? 'text-orange-400' : 'text-white') : 'text-white/40 hover:text-white/60'}`}>
              {opt.label}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

// =========================================
// 4. MAIN COMPONENT
// =========================================

export default function BranchShowcase({ occupancy }: { occupancy: Record<string, number> }) {
  const [activeSide, setActiveSide] = useState<BranchId>('bengali-chowk');
  
  const PRODUCT_DATA = useMemo(() => getBranchData(occupancy), [occupancy]);
  const currentData = PRODUCT_DATA[activeSide];
  const isLeft = activeSide === 'bengali-chowk';

  return (
    <div className="relative w-full py-20 overflow-hidden selection:bg-primary/30 glass-pane-elevated rounded-[48px] max-w-[95vw] xl:max-w-7xl mx-auto shadow-2xl border border-white/5">
      
      <BackgroundGradient isLeft={isLeft} />

      <div className="relative z-10 w-full px-8 flex flex-col justify-center max-w-7xl mx-auto">
        <motion.div
          layout
          transition={{ type: 'spring', bounce: 0, duration: 0.9 }}
          className={`flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-32 w-full ${
            isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'
          }`}
        >
          {/* Visuals */}
          <ProductVisual data={currentData} isLeft={isLeft} />

          {/* Content */}
          <motion.div layout="position" className="w-full max-w-xl">
            <AnimatePresence mode="wait">
              <ProductDetails 
                key={activeSide} // Key forces re-render for animation
                data={currentData} 
                isLeft={isLeft} 
              />
            </AnimatePresence>
          </motion.div>
        </motion.div>

        <Switcher activeId={activeSide} onToggle={setActiveSide} data={PRODUCT_DATA} />
      </div>
    </div>
  );
}
