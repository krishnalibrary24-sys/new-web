'use client';

import {
  Facebook,
  Instagram,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

// ── All anchor IDs come from the actual sections on the page ──
// #hero          → HeroSlider
// #about         → AboutUsSection
// #services      → Services section
// #achievers     → Achievers section
// #membership    → SquishyPricing
// #contact       → ReservationForm / Enquiry
// #locations     → Find Us Here / Maps
// #faq           → FaqSection
// /gallery       → Gallery page (separate route)

const data = {
  facebookLink: 'https://www.facebook.com/people/krishna-library/61561184510964/#',
  instaLink: 'https://www.instagram.com/library_krishna/',
  company: {
    name: 'Krishna Library',
    description:
      'Empowering curious minds in Ambikapur. Transforming curiosity into confident, lifelong learning with traditional and digital resources.',
    logo: 'local_library',
  },
};

const exploreLinks = [
  { text: 'About Us', id: 'about' },
  { text: 'Our Services', id: 'services' },
  { text: 'Achievers', id: 'achievers' },
  { text: 'Gallery', route: '/gallery' },
];

const serviceLinks = [
  { text: 'Reading Rooms', id: 'services' },
  { text: 'Membership Plans', id: 'membership' },
  { text: 'Enquiry / Booking', id: 'contact' },
  { text: 'Find Our Branches', id: 'locations' },
];

const helpfulLinks = [
  { text: 'FAQs', id: 'faq' },
  { text: 'Contact Us', id: 'contact' },
  { text: 'Feedback', id: 'contact', hasIndicator: true },
];

const socialLinks = [
  { icon: Facebook, label: 'Facebook', href: data.facebookLink },
  { icon: Instagram, label: 'Instagram', href: data.instaLink },
];

/** Smooth-scroll to a section by ID, works even when already on the page */
function scrollToSection(id: string, e: React.MouseEvent) {
  e.preventDefault();
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function Footer4Col() {
  return (
    <footer className="bg-[#050505] border-t border-white/10 text-white w-full mt-auto">
      <div className="mx-auto max-w-container-max px-4 pt-16 pb-6 sm:px-gutter lg:pt-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ── Brand Column ── */}
          <div>
            <div className="text-white flex justify-center gap-2 sm:justify-start items-center">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                {data.company.logo}
              </span>
              <span className="font-v-display text-v-headline-sm font-bold">
                {data.company.name}
              </span>
            </div>

            <p className="text-white/60 mt-6 max-w-md text-center leading-relaxed sm:max-w-xs sm:text-left font-v-body-sm text-v-body-sm">
              {data.company.description}
            </p>

            <ul className="mt-8 flex justify-center gap-6 sm:justify-start md:gap-8">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-white/60 hover:text-white transition">
                    <span className="sr-only">{label}</span>
                    <Icon className="size-6" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Links Grid ── */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:col-span-2">

            {/* Explore */}
            <div className="text-center sm:text-left">
              <p className="font-v-headline-sm text-v-headline-sm font-bold text-white">Explore</p>
              <ul className="mt-8 space-y-4 font-v-body-sm text-v-body-sm">
                {exploreLinks.map((link) => (
                  <li key={link.text}>
                    {'route' in link ? (
                      <Link href={link.route!} className="text-white/60 hover:text-white transition">
                        {link.text}
                      </Link>
                    ) : (
                      <a
                        href={`#${link.id}`}
                        onClick={(e) => scrollToSection(link.id!, e)}
                        className="text-white/60 hover:text-white transition"
                      >
                        {link.text}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div className="text-center sm:text-left">
              <p className="font-v-headline-sm text-v-headline-sm font-bold text-white">Our Services</p>
              <ul className="mt-8 space-y-4 font-v-body-sm text-v-body-sm">
                {serviceLinks.map(({ text, id }) => (
                  <li key={text}>
                    <a
                      href={`#${id}`}
                      onClick={(e) => scrollToSection(id, e)}
                      className="text-white/60 hover:text-white transition"
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Helpful Links */}
            <div className="text-center sm:text-left">
              <p className="font-v-headline-sm text-v-headline-sm font-bold text-white">Helpful Links</p>
              <ul className="mt-8 space-y-4 font-v-body-sm text-v-body-sm">
                {helpfulLinks.map(({ text, id, hasIndicator }) => (
                  <li key={text}>
                    <a
                      href={`#${id}`}
                      onClick={(e) => scrollToSection(id, e)}
                      className={`text-white/60 hover:text-white transition ${
                        hasIndicator
                          ? 'group flex justify-center gap-1.5 sm:justify-start items-center'
                          : ''
                      }`}
                    >
                      <span>{text}</span>
                      {hasIndicator && (
                        <span className="relative flex size-2 ml-1">
                          <span className="bg-v-secondary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                          <span className="bg-v-secondary relative inline-flex size-2 rounded-full" />
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact — both branches */}
            <div className="text-center sm:text-left">
              <p className="font-v-headline-sm text-v-headline-sm font-bold text-white">Contact Us</p>
              <ul className="mt-8 space-y-5 font-v-body-sm text-v-body-sm">

                {/* Email */}
                <li>
                  <a
                    href="mailto:krishnalibrary24@gmail.com"
                    className="flex items-center justify-center gap-2 sm:justify-start text-white/60 hover:text-white transition group"
                  >
                    <Mail className="size-4 shrink-0 text-white/60 group-hover:text-white transition" />
                    <span className="flex-1 text-left">krishnalibrary24@gmail.com</span>
                  </a>
                </li>

                {/* Phone */}
                <li>
                  <a
                    href="tel:+918269144748"
                    className="flex items-center justify-center gap-2 sm:justify-start text-white/60 hover:text-white transition group"
                  >
                    <Phone className="size-4 shrink-0 text-white/60 group-hover:text-white transition" />
                    <span className="flex-1 text-left">+91 8269144748</span>
                  </a>
                </li>

                {/* Bangali Chowk Address */}
                <li>
                  <a
                    href="https://maps.app.goo.gl/qe5inarf97yZfRvG9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-center gap-2 sm:justify-start text-white/60 hover:text-white transition group"
                  >
                    <MapPin className="size-4 shrink-0 mt-0.5 text-white/60 group-hover:text-white transition" />
                    <address className="not-italic flex-1 text-left">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Bangali Chowk</span>
                      Plot 12, Bengali Chowk Area, Ambikapur, C.G.
                    </address>
                  </a>
                </li>

                {/* Namnakala Address */}
                <li>
                  <a
                    href="https://maps.app.goo.gl/QMnULNxGCoyZbeyj9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-center gap-2 sm:justify-start text-white/60 hover:text-white transition group"
                  >
                    <MapPin className="size-4 shrink-0 mt-0.5 text-orange-400/70 group-hover:text-orange-400 transition" />
                    <address className="not-italic flex-1 text-left">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-orange-400/50 mb-0.5">Namnakala</span>
                      2nd Floor, Zenith Plaza, Namnakala, Ambikapur, C.G.
                    </address>
                  </a>
                </li>

              </ul>
            </div>

          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="text-center sm:flex sm:justify-between sm:text-left font-v-body-sm text-v-body-sm text-white/40">
            <p>
              <span className="block sm:inline">All rights reserved.</span>
            </p>
            <p className="mt-4 transition sm:order-first sm:mt-0">
              &copy; {new Date().getFullYear()} {data.company.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
