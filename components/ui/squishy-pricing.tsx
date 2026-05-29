"use client";

import { motion } from 'framer-motion';

export const SquishyPricing = () => {
  return (
    <section id="membership" className="bg-transparent px-4 py-xl transition-colors">
      <div className="max-w-container-max mx-auto px-gutter mb-12 text-center">
        <span className="inline-block bg-v-primary-fixed px-3 py-1 rounded-full text-v-primary font-v-label-md text-v-label-md uppercase tracking-wider mb-2">Pricing</span>
        <h2 className="font-v-display text-v-display text-v-display-mobile md:text-headline-lg text-v-on-background">Membership <span className="text-v-secondary border-b-4 border-v-secondary pb-1">Slots</span></h2>
        <p className="font-v-body-md text-v-body-md text-v-on-surface-variant mt-4">Choose a study slot that fits your schedule. Premium amenities included in all slots.</p>
      </div>

      <div className="mx-auto flex w-fit flex-wrap justify-center gap-8">
          <PricingCard
            label="Morning Slot"
            monthlyPrice="₹600"
            suffix="/month"
            timeSlotBC="7:00 AM to 3:00 PM"
            timeSlotNK="7:30 AM to 2:30 PM"
            description="Perfect for early birds, college students, and morning study sessions. Includes high-speed Wi-Fi, reserved seating, and a peaceful environment."
            cta="Book Morning Slot"
            background="bg-v-primary/80 dark:bg-v-primary"
            BGComponent={BGComponent1}
          />
          <PricingCard
            label="Full Day Slot"
            monthlyPrice="₹1,000"
            suffix="/month"
            timeSlotBC="7:00 AM to 10:00 PM"
            timeSlotNK="7:30 AM to 9:30 PM"
            description="Our most popular slot for dedicated aspirants. Unlimited study hours to maximize your productivity. Ideal for UPSC, CA, and competitive exams."
            cta="Book Full Day"
            background="bg-v-secondary/90 dark:bg-v-secondary"
            isPopular={true}
            BGComponent={BGComponent2}
          />
          <PricingCard
            label="Evening Slot"
            monthlyPrice="₹600"
            suffix="/month"
            timeSlotBC="3:00 PM to 10:00 PM"
            timeSlotNK="2:30 PM to 9:30 PM"
            description="Great for school students, working professionals, and late-day learners. Enjoy a distraction-free space for evening deep-focus sessions."
            cta="Book Evening Slot"
            background="bg-v-tertiary/90 dark:bg-v-tertiary"
            BGComponent={BGComponent3}
          />
        </div>
      </section>
  );
};

const PricingCard = ({ label, monthlyPrice, suffix, timeSlotBC, timeSlotNK, description, cta, background, isPopular, BGComponent }: any) => {
  return (
    <motion.div
      whileHover="hover"
      transition={{ duration: 1, ease: "backInOut" }}
      variants={{ hover: { scale: 1.05 } }}
      className={`relative h-[440px] w-80 shrink-0 overflow-hidden rounded-2xl p-8 ${background} shadow-lg hover:shadow-xl transition-shadow`}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-neutral-900 font-bold px-4 py-1 rounded-bl-xl text-xs uppercase tracking-wider z-20">
          Most Popular
        </div>
      )}
      <div className="relative z-10 text-white flex flex-col h-full justify-between">
        <div>
          <span className="mb-3 block w-fit rounded-full bg-white/20 backdrop-blur-sm px-3 py-0.5 text-sm font-medium text-white border border-white/20 uppercase tracking-wider font-v-label-md">
            {label}
          </span>
          <motion.span
            initial={{ scale: 0.85 }}
            variants={{ hover: { scale: 1 } }}
            transition={{ duration: 1, ease: "backInOut" }}
            className="my-2 block origin-top-left font-v-display text-5xl font-black leading-[1.2]"
          >
            {monthlyPrice}
            <span className="text-xl font-normal font-v-body-md text-white/80">{suffix}</span>
          </motion.span>
          <div className="mt-2 text-xs font-bold bg-black/25 w-fit px-3 py-1.5 rounded-lg border border-white/10 font-mono leading-relaxed">
            <div>🕒 Bangali: {timeSlotBC}</div>
            <div className="mt-0.5">🕒 Namnakala: {timeSlotNK}</div>
          </div>
          <p className="text-sm text-white/95 font-v-body-sm leading-relaxed mt-4">{description}</p>
        </div>
        
        <button className="w-full rounded-xl border-2 border-white bg-white py-3 text-center font-v-label-lg font-bold uppercase text-neutral-900 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:text-white hover:border-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent mt-4">
          {cta}
        </button>
      </div>
      <BGComponent />
    </motion.div>
  );
};

const BGComponent1 = () => (
  <motion.svg
    width="320"
    height="440"
    viewBox="0 0 320 440"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    variants={{ hover: { scale: 1.5 } }}
    transition={{ duration: 1, ease: "backInOut" }}
    className="absolute inset-0 z-0"
  >
    <motion.circle
      variants={{ hover: { scaleY: 0.5, y: -25 } }}
      transition={{ duration: 1, ease: "backInOut", delay: 0.2 }}
      cx="160.5"
      cy="114.5"
      r="101.5"
      fill="rgba(0, 0, 0, 0.15)"
      className="dark:fill-white/10"
    />
    <motion.ellipse
      variants={{ hover: { scaleY: 2.25, y: -25 } }}
      transition={{ duration: 1, ease: "backInOut", delay: 0.2 }}
      cx="160.5"
      cy="265.5"
      rx="101.5"
      ry="43.5"
      fill="rgba(0, 0, 0, 0.15)"
      className="dark:fill-white/10"
    />
  </motion.svg>
);

const BGComponent2 = () => (
  <motion.svg
    width="320"
    height="440"
    viewBox="0 0 320 440"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    variants={{ hover: { scale: 1.05 } }}
    transition={{ duration: 1, ease: "backInOut" }}
    className="absolute inset-0 z-0"
  >
    <motion.rect
      x="14"
      width="153"
      height="153"
      rx="15"
      fill="rgba(0, 0, 0, 0.15)"
      className="dark:fill-white/10"
      variants={{ hover: { y: 219, rotate: "90deg", scaleX: 2 } }}
      style={{ y: 12 }}
      transition={{ delay: 0.2, duration: 1, ease: "backInOut" }}
    />
    <motion.rect
      x="155"
      width="153"
      height="153"
      rx="15"
      fill="rgba(0, 0, 0, 0.15)"
      className="dark:fill-white/10"
      variants={{ hover: { y: 12, rotate: "90deg", scaleX: 2 } }}
      style={{ y: 219 }}
      transition={{ delay: 0.2, duration: 1, ease: "backInOut" }}
    />
  </motion.svg>
);

const BGComponent3 = () => (
  <motion.svg
    width="320"
    height="440"
    viewBox="0 0 320 440"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    variants={{ hover: { scale: 1.25 } }}
    transition={{ duration: 1, ease: "backInOut" }}
    className="absolute inset-0 z-0"
  >
    <motion.path
      variants={{ hover: { y: -50 } }}
      transition={{ delay: 0.3, duration: 1, ease: "backInOut" }}
      d="M148.893 157.531C154.751 151.673 164.249 151.673 170.107 157.531L267.393 254.818C273.251 260.676 273.251 270.173 267.393 276.031L218.75 324.674C186.027 357.397 132.973 357.397 100.25 324.674L51.6068 276.031C45.7489 270.173 45.7489 260.676 51.6068 254.818L148.893 157.531Z"
      fill="rgba(0, 0, 0, 0.15)"
      className="dark:fill-white/10"
    />
    <motion.path
      variants={{ hover: { y: -50 } }}
      transition={{ delay: 0.2, duration: 1, ease: "backInOut" }}
      d="M148.893 99.069C154.751 93.2111 164.249 93.2111 170.107 99.069L267.393 196.356C273.251 202.213 273.251 211.711 267.393 217.569L218.75 266.212C186.027 298.935 132.973 298.935 100.25 266.212L51.6068 217.569C45.7489 211.711 45.7489 202.213 51.6068 196.356L148.893 99.069Z"
      fill="rgba(0, 0, 0, 0.15)"
      className="dark:fill-white/10"
    />
    <motion.path
      variants={{ hover: { y: -50 } }}
      transition={{ delay: 0.1, duration: 1, ease: "backInOut" }}
      d="M148.893 40.6066C154.751 34.7487 164.249 34.7487 170.107 40.6066L267.393 137.893C273.251 143.751 273.251 153.249 267.393 159.106L218.75 207.75C186.027 240.473 132.973 240.473 100.25 207.75L51.6068 159.106C45.7489 153.249 45.7489 143.751 51.6068 137.893L148.893 40.6066Z"
      fill="rgba(0, 0, 0, 0.15)"
      className="dark:fill-white/10"
    />
  </motion.svg>
);
