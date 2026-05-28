"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import VisitorNav from '@/components/visitor-nav';
import HeroSlider from '@/components/hero-slider';
import Footer4Col from '@/components/ui/footer-column';
import AboutUsSection from '@/components/ui/about-us-section';
import FaqSection from '@/components/ui/faq-section';
import { GalleryDemo } from '@/components/blocks/gallery-demo';
import { SquishyPricing } from '@/components/ui/squishy-pricing';
import ReservationForm from '@/components/ui/reservation-form';
import ScrollReveal, { StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import SectionHeading from '@/components/ui/section-heading';
import { motion, useScroll, useTransform } from 'framer-motion';

/* ── Counter animation hook ── */
function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  return (
    <motion.span
      className="font-montserrat text-[clamp(1.5rem,3.5vw,2.5rem)] font-extrabold text-v-on-primary-container tabular-nums"
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 100, damping: 12 }}
    >
      {value}{suffix}
    </motion.span>
  );
}

export default function Home() {
  return (
    <div className="bg-white text-v-on-background font-lexend antialiased selection:bg-v-primary/10 selection:text-v-primary visitor-page">

      <VisitorNav />
      <main>
        {/* ═══ 1. HERO ═══ */}
        <HeroSlider />

        {/* ═══ STATS BANNER ═══ */}
        <section className="relative bg-v-primary-container">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
              {[
                { val: "2", suf: "+", label: "Years of Trust" },
                { val: "1200", suf: "+", label: "Students Served" },
                { val: "2", suf: "", label: "City Branches" },
                { val: "99", suf: "%", label: "Satisfaction Rate" },
              ].map((stat, i) => (
                <ScrollReveal key={i} delay={i * 0.1} className="py-6 md:py-8 flex flex-col items-center text-center gap-1">
                  <AnimatedCounter value={stat.val} suffix={stat.suf} />
                  <span className="font-montserrat text-[10px] md:text-[11px] font-bold text-v-on-primary-container/70 uppercase tracking-[0.1em]">
                    {stat.label}
                  </span>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 2. ABOUT US ═══ */}
        <AboutUsSection />

        {/* ═══ 3. ACHIEVERS ═══ */}
        <section id="achievers" className="py-20 md:py-28 bg-white relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-v-primary/[0.02] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

          <div className="max-w-[1280px] mx-auto px-6">
            <SectionHeading
              tag="Success Stories"
              title="Our"
              highlight="Achievers"
              description="Hear from members whose journeys were shaped by the spaces, resources, and community at Krishna Library."
            />

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" stagger={0.15}>
              {[
                {
                  img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXIyldosztmi8fNPYHddI3Ddsv7gSvYSw5EolHH-DQnTg4GfkF2Ng-ZPSCTwr1eUIHeVcVllJJbD17V6s1Ydd6_rAfMZFs6Qounf8a9P-WhPdR34KrWk0I6a6JlF6RnvzRlapPaiica1iWLhhRQBg5EMN_cPIml1df-in3jeIPiDj1OgKWBX6KyOZ5sFhvdBRUH9eNVvUoQ7itGs22Fm46XyOFDb3whdrbuxA_9pCBIqxqO5XbMUlmPbLgcmIo4IEnewxsmwYl-rIS",
                  name: "Sarah Jenkins",
                  role: "University Scholar",
                  quote: "The quiet study rooms and access to premium academic databases at Krishna Library were crucial for my final year thesis. I couldn't have done it without this resource!",
                },
                {
                  img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB92wRJryR1hxdOU_xyKytgYaOMN0ksIkUqwf7KH_UbthE8L1d-7yZhnbSenN90WxMcrTGvXvgwIz5bkQq_9P-1gK12khzdGzwdW8Rw_Nh1QyPf5mk815rFYHp21OsoQaehunSP369cj5fczztRNGJDOCRehOwbL_IxZTvdMeLP1rv6DBlgf2NbWSaRfT-c_JFx0004hev3cHEbyxTS_ZEEfyIF0FBvn4InRGgNhNT7SmMkX3SO0gyaPc1ZDMDRLrLo6IvrhuPXf0Ng",
                  name: "David Chen",
                  role: "Self-Taught Developer",
                  quote: "I learned to code using the library's free internet and tech workshop materials. The supportive environment here completely changed my career trajectory.",
                },
                {
                  img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVCmcTA0DQW06Gn1_OIIDGJB_yFZ4EZWZhx4Q5QKlp0PrZBGBUwWtBC4zcoQYzjZ_7ow_yuVIzlWpMMMjKPiK0_8DLUr737mXshjJUGSabVlIK6mlNZAqTehs_NQ2Rsy4TyUjyAq5g519hNI24ugz_zIU44RHLPp0KnL_v9GpO1KS2ivq2fCGINOnwSfajgoM8tFCWoHQNH3sbSV4PEQKx5r3nqIwSeFmtFT4dU1-tqo307Me9kY4hlCPxw7TpQkEN9H2XEm4eGI52",
                  name: "Maria Garcia",
                  role: "Small Business Owner",
                  quote: "Attending the adult literacy and business networking events here gave me the confidence and skills to launch my own local bakery. It's truly a community hub.",
                },
              ].map((person, i) => (
                <StaggerItem key={i}>
                  <div className="group bg-white p-7 rounded-2xl border border-v-outline-variant/15 hover:border-v-primary/15 hover:shadow-[0_12px_40px_rgba(0,49,120,0.05)] transition-all duration-500 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-5">
                      <img
                        alt={person.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-v-primary/10 group-hover:ring-v-primary/25 transition-all duration-300"
                        src={person.img}
                      />
                      <div>
                        <h4 className="font-montserrat text-[15px] font-bold text-v-on-background">{person.name}</h4>
                        <p className="font-montserrat text-[11px] font-semibold text-v-primary uppercase tracking-wide">{person.role}</p>
                      </div>
                    </div>
                    {/* Stars */}
                    <div className="flex gap-0.5 text-[#fdac29] mb-4">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                      ))}
                    </div>
                    <p className="font-lexend text-[13.5px] text-v-on-surface-variant leading-relaxed italic flex-1">
                      &quot;{person.quote}&quot;
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ═══ 5. REVIEW MARQUEE ═══ */}
        <section className="py-14 bg-[#f8f9ff] border-y border-v-outline-variant/10 overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-6 mb-8 text-center">
            <ScrollReveal>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-montserrat text-xl font-bold text-v-on-background">
                    Loved by Our Community
                  </h3>
                  <span className="material-symbols-outlined text-[#fdac29]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-[12px] text-v-on-surface-variant font-lexend">Real reviews from Google</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
          <div className="marquee-container">
            <div className="marquee-content">
              {[
                { initials: "CS", name: "CA Siddharth Jaiswal", time: "4 months ago", text: "I cleared my CA Final exam while studying at this library, and it truly deserves appreciation. This library provides wide study cabins, which are extremely suitable for CA students as we need sufficient space to use calculators, books...", color: "bg-v-primary/8 text-v-primary" },
                { initials: "RG", name: "Ravi Gupta", time: "4 months ago", text: "An oasis of calm. With excellent lighting, comfortable seating, and a strictly quiet environment, this is hands-down the best place in the area for deep work. It turned the stress of exam season into a productive and manageable journey.", color: "bg-v-secondary/8 text-v-secondary" },
                { initials: "YS", name: "Yogesh Sharma", time: "10 months ago", text: "I had a great experience studying at Krishna Library. The environment is peaceful and perfect for focused study. The staff is cooperative, and all the necessary facilities are available. I would definitely recommend it to others looking for a good study place.", color: "bg-[#6b4400]/8 text-[#6b4400]" },
                { initials: "KG", name: "Khushi Goyal", time: "A year ago", text: "The ambiance of the Krishna library is serene and conducive to focused study, complemented by thoughtfully designed seating arrangements that balance comfort and functionality. The staff, ever courteous and knowledgeable...", color: "bg-v-primary/8 text-v-primary" },
                { initials: "SP", name: "Sakshi Pandey", time: "4 months ago", text: "Krishna library...best library in Ambikapur. Where silence speaks and knowledge grows.", color: "bg-v-secondary/8 text-v-secondary" },
              ].map((review, i) => (
                <ReviewCard key={i} {...review} />
              ))}
            </div>
            <div aria-hidden="true" className="marquee-content">
              {[
                { initials: "CS", name: "CA Siddharth Jaiswal", time: "4 months ago", text: "I cleared my CA Final exam while studying at this library, and it truly deserves appreciation. This library provides wide study cabins, which are extremely suitable for CA students as we need sufficient space to use calculators, books...", color: "bg-v-primary/8 text-v-primary" },
                { initials: "RG", name: "Ravi Gupta", time: "4 months ago", text: "An oasis of calm. With excellent lighting, comfortable seating, and a strictly quiet environment, this is hands-down the best place in the area for deep work. It turned the stress of exam season into a productive and manageable journey.", color: "bg-v-secondary/8 text-v-secondary" },
                { initials: "YS", name: "Yogesh Sharma", time: "10 months ago", text: "I had a great experience studying at Krishna Library. The environment is peaceful and perfect for focused study. The staff is cooperative, and all the necessary facilities are available. I would definitely recommend it to others looking for a good study place.", color: "bg-[#6b4400]/8 text-[#6b4400]" },
                { initials: "KG", name: "Khushi Goyal", time: "A year ago", text: "The ambiance of the Krishna library is serene and conducive to focused study, complemented by thoughtfully designed seating arrangements that balance comfort and functionality. The staff, ever courteous and knowledgeable...", color: "bg-v-primary/8 text-v-primary" },
                { initials: "SP", name: "Sakshi Pandey", time: "4 months ago", text: "Krishna library...best library in Ambikapur. Where silence speaks and knowledge grows.", color: "bg-v-secondary/8 text-v-secondary" },
              ].map((review, i) => (
                <ReviewCard key={`dup-${i}`} {...review} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 7. PRICING ═══ */}
        <SquishyPricing />

        {/* ═══ 8. ENQUIRY / CONTACT ═══ */}
        <section id="contact" className="py-20 md:py-28 bg-[#f8f9ff] px-4">
          <ScrollReveal>
            <ReservationForm />
          </ScrollReveal>
        </section>

        {/* ═══ 9. LOCATIONS ═══ */}
        <section id="locations" className="py-20 md:py-28 bg-white">
          <div className="max-w-[1280px] mx-auto px-6">
            <SectionHeading
              tag="Our Branches"
              title="Find"
              highlight="Us Here"
              description="Two convenient locations across Ambikapur — click the map or the button to open in Google Maps."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
              {/* ── Bangali Chowk ── */}
              <ScrollReveal delay={0}>
                <div className="rounded-2xl overflow-hidden border border-v-outline-variant/15 shadow-md hover:shadow-xl transition-all duration-500 group">
                  {/* Map Embed */}
                  <div className="relative w-full h-72 bg-gray-100">
                    <iframe
                      title="Krishna Library — Bangali Chowk Branch"
                      src="https://maps.google.com/maps?q=Krishna+Library+Bengali+Chowk+Ambikapur&output=embed&z=16"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                    />
                  </div>
                  {/* Info Card */}
                  <div className="p-6 bg-white">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-v-primary/10 text-v-primary rounded-full mb-2">Flagship Hub</span>
                        <h3 className="font-montserrat text-[18px] font-bold text-v-on-background mb-1">Bangali Chowk Branch</h3>
                        <p className="font-lexend text-[13px] text-v-on-surface-variant leading-relaxed">
                          Plot 12, Bangali Chowk Area, Ambikapur, C.G.
                        </p>
                        <p className="font-lexend text-[13px] text-v-primary mt-1">📞 +91 8269144748</p>
                      </div>
                      <a
                        href="https://maps.app.goo.gl/qe5inarf97yZfRvG9"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-v-primary text-white text-[12px] font-bold rounded-full hover:bg-v-primary/90 transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>open_in_new</span>
                        Open in Maps
                      </a>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* ── Namnakala ── */}
              <ScrollReveal delay={0.12}>
                <div className="rounded-2xl overflow-hidden border border-v-outline-variant/15 shadow-md hover:shadow-xl transition-all duration-500 group">
                  {/* Map Embed */}
                  <div className="relative w-full h-72 bg-gray-100">
                    <iframe
                      title="Krishna Library — Namnakala Branch"
                      src="https://maps.google.com/maps?q=Krishna+Library+Namnakala+Ambikapur&output=embed&z=16"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                    />
                  </div>
                  {/* Info Card */}
                  <div className="p-6 bg-white">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-orange-500/10 text-orange-600 rounded-full mb-2">Central Wing</span>
                        <h3 className="font-montserrat text-[18px] font-bold text-v-on-background mb-1">Namnakala Branch</h3>
                        <p className="font-lexend text-[13px] text-v-on-surface-variant leading-relaxed">
                          2nd Floor, Zenith Plaza, Namnakala, Ambikapur, C.G.
                        </p>
                        <p className="font-lexend text-[13px] text-v-primary mt-1">📞 +91 8269144748</p>
                      </div>
                      <a
                        href="https://maps.app.goo.gl/QMnULNxGCoyZbeyj9"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-[12px] font-bold rounded-full hover:bg-orange-600 transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>open_in_new</span>
                        Open in Maps
                      </a>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ═══ 10. GALLERY ═══ */}
        <GalleryDemo />

        {/* ═══ 11. FAQ ═══ */}
        <FaqSection />

        <Footer4Col />
      </main>
      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/918269144748"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300"
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}

/* ── Review Card Component ── */
function ReviewCard({ initials, name, time, text, color }: {
  initials: string; name: string; time: string; text: string; color: string;
}) {
  return (
    <div className="review-card bg-white p-5 rounded-2xl border border-v-outline-variant/10 min-w-[300px] max-w-[340px] flex flex-col shadow-[0_2px_12px_rgba(0,49,120,0.03)] cursor-default select-none"
      style={{ borderLeft: '3px solid rgba(0,49,120,0.08)' }}
    >
      {/* Header: avatar + name + Google logo */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center font-montserrat font-bold text-xs shrink-0`}>
            {initials}
          </div>
          <div>
            <p className="font-montserrat text-[12.5px] font-bold text-v-on-background line-clamp-1">{name}</p>
            <p className="text-[10.5px] text-v-on-surface-variant">{time}</p>
          </div>
        </div>
        {/* Google logo */}
        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      </div>

      {/* Stars */}
      <div className="flex gap-0.5 text-[#fdac29] mb-2.5">
        {[...Array(5)].map((_, j) => (
          <span key={j} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
        ))}
      </div>

      {/* Review text */}
      <p className="font-lexend text-[12.5px] text-v-on-surface-variant leading-relaxed line-clamp-4 flex-1">
        &quot;{text}&quot;
      </p>

      {/* Footer: subtle "Google Review" label */}
      <div className="mt-3 pt-3 border-t border-v-outline-variant/8 flex items-center gap-1.5">
        <span className="text-[10px] text-v-on-surface-variant/50 font-lexend tracking-wide">Google Review</span>
      </div>
    </div>
  );
}
