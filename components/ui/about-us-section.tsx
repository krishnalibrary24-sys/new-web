"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  BookOpen,
  Coffee,
  Sofa,
  Users,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  Star,
  ArrowRight,
  Zap,
} from "lucide-react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"

export default function AboutUsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 })
  const isStatsInView = useInView(sectionRef, { once: true, amount: 0.1 })

  // Parallax effect for decorative elements
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 50])
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 20])
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -20])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const services = [
    {
      icon: <Sofa className="w-6 h-6" />,
      secondaryIcon: <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-v-secondary" />,
      title: "Dual-Theme Cabins",
      description:
        "Premium study rooms available in both Dark Theme and Light Theme styles to suit your personal concentration preferences.",
      position: "left",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      secondaryIcon: <CheckCircle className="w-4 h-4 absolute -top-1 -right-1 text-v-secondary" />,
      title: "Full Air Conditioning",
      description:
        "Completely climate-controlled and temperature-regulated rooms to ensure seamless, comfortable study sessions.",
      position: "left",
    },
    {
      icon: <Coffee className="w-6 h-6" />,
      secondaryIcon: <Star className="w-4 h-4 absolute -top-1 -right-1 text-v-secondary" />,
      title: "Clean RO Drinking Water",
      description:
        "100% pure, safe, and cold RO water available round the clock to keep you refreshed and hydrated.",
      position: "left",
    },
    {
      icon: <Users className="w-6 h-6" />,
      secondaryIcon: <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-v-secondary" />,
      title: "Discussion & Lunch Areas",
      description:
        "Dedicated separate sections for group discussion and lunching, ensuring the reading rooms remain strictly quiet.",
      position: "right",
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      secondaryIcon: <CheckCircle className="w-4 h-4 absolute -top-1 -right-1 text-v-secondary" />,
      title: "Clean Separate Washrooms",
      description:
        "Hygiene-first separate rest rooms for girls and boys, cleaned regularly for absolute convenience.",
      position: "right",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      secondaryIcon: <Star className="w-4 h-4 absolute -top-1 -right-1 text-v-secondary" />,
      title: "Quiet Study Environment",
      description:
        "High-standard acoustic control and pin-drop silence environment optimized specifically for deep focus and competitive preparation.",
      position: "right",
    },
  ]



  return (
    <section
      id="about"
      ref={sectionRef}
      className="w-full pt-24 pb-12 px-4 bg-transparent text-v-on-surface overflow-hidden relative"
    >
      {/* Decorative background elements */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 rounded-full bg-v-primary/5 blur-3xl"
      />
      <motion.div
        className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-v-secondary/5 blur-3xl"
      />
      <motion.div
        className="absolute top-1/2 left-1/4 w-4 h-4 rounded-full bg-v-primary/30"
        animate={{
          y: [0, -15, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-6 h-6 rounded-full bg-v-secondary/30"
        animate={{
          y: [0, 20, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <motion.div
        className="container mx-auto max-w-6xl relative z-10"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <motion.div className="flex flex-col items-center mb-6" variants={itemVariants}>
          <motion.span
            className="text-v-primary font-medium mb-2 flex items-center gap-2 tracking-wider text-sm uppercase"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Zap className="w-4 h-4" />
            DISCOVER US
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-light mb-4 text-center font-v-display text-v-on-background">About Krishna Library</h2>
          <motion.div
            className="w-24 h-1 bg-v-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 1, delay: 0.5 }}
          ></motion.div>
        </motion.div>

        <motion.div 
          className="text-center max-w-3xl mx-auto mb-6 text-3xl md:text-4xl font-black font-montserrat uppercase tracking-wider leading-relaxed flex flex-wrap items-center justify-center gap-y-1" 
          variants={itemVariants}
        >
          <span className="text-v-primary">A&nbsp;</span>
          <span className="text-[#fdac29] drop-shadow-[0_0_12px_rgba(253,172,41,0.55)] inline-flex items-center gap-1.5 font-black">
            HEAVEN
            <Sparkles className="w-6 h-6 text-[#fdac29] animate-pulse shrink-0" />
          </span>
          <span className="text-v-primary">&nbsp;FOR CURIOUS&nbsp;</span>
          <span className="bg-gradient-to-r from-v-primary via-blue-600 to-[#60a5fa] bg-clip-text text-transparent font-black">
            MINDS
          </span>
        </motion.div>

        {/* Dynamic Curiosity Subheader - Short & Crisp */}
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          variants={itemVariants}
        >
          <span className="block text-xs font-bold text-v-primary tracking-[0.2em] uppercase mb-2 font-montserrat">
            What Lies Within?
          </span>
          <p className="text-v-on-surface-variant text-base md:text-lg leading-relaxed font-light font-lexend">
            A premium study sanctuary engineered for quiet focus, elite concentration, and unmatched breakthroughs.
          </p>
        </motion.div>

        <div id="services" className="grid grid-cols-1 md:grid-cols-3 gap-8 relative scroll-mt-28">
          {/* Left Column */}
          <div className="space-y-16">
            {services
              .filter((service) => service.position === "left")
              .map((service, index) => (
                <ServiceItem
                  key={`left-${index}`}
                  icon={service.icon}
                  secondaryIcon={service.secondaryIcon}
                  title={service.title}
                  description={service.description}
                  variants={itemVariants}
                  delay={index * 0.2}
                  direction="left"
                />
              ))}
          </div>

          {/* Center Image */}
          <div className="flex justify-center items-center order-first md:order-none mb-8 md:mb-0">
            <motion.div className="relative w-full max-w-xs" variants={itemVariants}>
              <motion.div
                className="rounded-2xl overflow-hidden shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
              >
                <img
                  src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop"
                  alt="Modern Library Space"
                  className="w-full h-full object-cover aspect-[3/4]"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                >
                  <motion.button
                    className="bg-white text-v-primary px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-shadow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Explore Facilities <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              </motion.div>
              <motion.div
                className="absolute inset-0 border-4 border-v-secondary/30 rounded-2xl -m-4 z-[-1]"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              ></motion.div>

              {/* Floating accent elements */}
              <motion.div
                className="absolute -top-4 -right-8 w-16 h-16 rounded-full bg-v-primary/20 backdrop-blur-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.9 }}
              ></motion.div>
              <motion.div
                className="absolute -bottom-6 -left-10 w-20 h-20 rounded-full bg-v-secondary/20 backdrop-blur-md"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.1 }}
              ></motion.div>

              {/* Additional decorative elements */}
              <motion.div
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-v-primary"
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              ></motion.div>
              <motion.div
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-v-secondary"
                animate={{
                  y: [0, 10, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              ></motion.div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-16">
            {services
              .filter((service) => service.position === "right")
              .map((service, index) => (
                <ServiceItem
                  key={`right-${index}`}
                  icon={service.icon}
                  secondaryIcon={service.secondaryIcon}
                  title={service.title}
                  description={service.description}
                  variants={itemVariants}
                  delay={index * 0.2}
                  direction="right"
                />
              ))}
          </div>
        </div>



        {/* CTA Section */}
        <motion.div
          className="mt-12 bg-v-primary text-v-on-primary p-8 md:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="flex-1 relative z-10">
            <h3 className="text-3xl font-medium mb-3 font-v-headline-lg text-white">Ready to upgrade your study experience?</h3>
            <p className="text-v-on-primary/90 text-lg">Join Krishna Library today and unlock your full potential.</p>
          </div>
          <motion.button
            className="bg-v-on-primary text-v-primary px-8 py-4 rounded-full flex items-center gap-3 font-bold transition-transform shadow-lg relative z-10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Become a Member <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  )
}

interface ServiceItemProps {
  icon: React.ReactNode
  secondaryIcon?: React.ReactNode
  title: string
  description: string
  variants: {
    hidden: { opacity: number; y?: number }
    visible: { opacity: number; y?: number; transition: { duration: number; ease: string } }
  }
  delay: number
  direction: "left" | "right"
}

function ServiceItem({ icon, secondaryIcon, title, description, variants, delay, direction }: ServiceItemProps) {
  return (
    <motion.div
      className="flex flex-col group"
      variants={variants}
      transition={{ delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="flex items-center gap-4 mb-4"
        initial={{ x: direction === "left" ? -20 : 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.2 }}
      >
        <motion.div
          className="text-v-primary bg-v-primary/10 p-3.5 rounded-xl transition-colors duration-300 group-hover:bg-v-primary/20 relative"
          whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
        >
          {icon}
          {secondaryIcon}
        </motion.div>
        <h3 className="text-xl font-bold text-v-on-surface group-hover:text-v-primary transition-colors duration-300">
          {title}
        </h3>
      </motion.div>
      <motion.p
        className="text-sm text-v-on-surface-variant leading-relaxed pl-14"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.4 }}
      >
        {description}
      </motion.p>
      <motion.div
        className="mt-4 pl-14 flex items-center text-v-primary text-xs font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
      >
        <span className="flex items-center gap-1 cursor-pointer">
          Learn more <ArrowRight className="w-3 h-3" />
        </span>
      </motion.div>
    </motion.div>
  )
}
