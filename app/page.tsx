"use client";
import React from 'react';
import Link from 'next/link';
import VisitorNav from '@/components/visitor-nav';
import HeroSlider from '@/components/hero-slider';

export default function Home() {
  return (
    <div className="bg-v-background text-v-on-background font-v-body-md text-v-body-md antialiased selection:bg-v-primary-container selection:text-v-on-primary-container visitor-page">
      <style dangerouslySetInnerHTML={{__html: `
        .bg-wash { background-color: #F5F7FF; }
        .marquee-container {
            display: flex;
            overflow: hidden;
            user-select: none;
            gap: 2rem;
        }
        .marquee-content {
            flex-shrink: 0;
            display: flex;
            justify-content: space-around;
            min-width: 100%;
            gap: 2rem;
            animation: scroll 40s linear infinite;
        }
        @keyframes scroll {
            from { transform: translateX(0); }
            to { transform: translateX(calc(-100% - 2rem)); }
        }
      `}} />
<VisitorNav />
<main>
{/*  1. Hero Section  */}
<HeroSlider />
<div className="bg-v-primary-container py-4 md:py-8 shadow-inner w-full">
<div className="max-w-container-max mx-auto px-4 md:px-gutter flex justify-between items-center">
<div className="flex flex-col items-center text-center">
<span className="font-v-display text-v-display text-v-headline-sm md:text-headline-lg text-v-on-tertiary-container">1M+</span>
<span className="text-[10px] md:font-label-md font-bold text-v-on-primary-container uppercase tracking-wide">Books &amp; Media</span>
</div>
<div className="w-px h-8 md:h-10 bg-v-primary-fixed/30"></div>
<div className="flex flex-col items-center text-center">
<span className="font-v-display text-v-display text-v-headline-sm md:text-headline-lg text-v-on-tertiary-container">200k+</span>
<span className="text-[10px] md:font-label-md font-bold text-v-on-primary-container uppercase tracking-wide">Active Members</span>
</div>
<div className="w-px h-8 md:h-10 bg-v-primary-fixed/30"></div>
<div className="flex flex-col items-center text-center">
<span className="font-v-display text-v-display text-v-headline-sm md:text-headline-lg text-v-on-tertiary-container">12</span>
<span className="text-[10px] md:font-label-md font-bold text-v-on-primary-container uppercase tracking-wide">City Branches</span>
</div>
<div className="w-px h-8 md:h-10 bg-v-primary-fixed/30"></div>
<div className="flex flex-col items-center text-center">
<span className="font-v-display text-v-display text-v-headline-sm md:text-headline-lg text-v-on-tertiary-container">500+</span>
<span className="text-[10px] md:font-label-md font-bold text-v-on-primary-container uppercase tracking-wide">Monthly Events</span>
</div>
</div>
</div>
{/*  2. About Us Section  */}
<section id="about" className="py-xl bg-v-surface">
<div className="max-w-container-max mx-auto px-gutter">
<div className="text-center mb-12">
<h2 className="font-v-headline-sm text-v-headline-sm text-v-primary uppercase tracking-wider mb-2 font-bold">About Us</h2>
<h3 className="font-v-display text-v-display text-v-display-mobile md:text-headline-lg text-v-on-background">More Than Just <span className="text-v-secondary border-b-4 border-v-secondary pb-1">Books</span></h3>
</div>
<div className="flex flex-col lg:flex-row gap-lg items-center">
<div className="w-full lg:w-1/2 relative rounded-xl overflow-hidden shadow-lg group">
<img alt="Community Workspace" className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500" data-alt="A brightly lit, modern community workspace inside a library. Diverse groups of people are collaborating at large wooden tables with laptops. The environment is energetic, organized, and welcoming. High-contrast elements, like a vivid orange accent wall, break up the pristine white and deep navy tones, emphasizing a vibrant community engine atmosphere." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1KKLVmUFWPPE4-o5rp5D8R2VnBE2Sp4iXZVH7JwL4csbPiPIKWIIN1_VYK_6K3TwmA35EYZYAIFSxK-JXIx7vKl-dDWeTvHQeSS1YJW4MmOcV9ZVlBui8-twpE64sf7vi3agO0J9GdhVEpOLeLZathhHs72shS-r44ib1DqjPNAe1MFA6V4tHr4YBvPwwUuKfjXbAVITpxPa2pgUTtU8gV9iy4_k4rp86UbQAW5Mf-V2oJAUi_KQDh36CKGqMbroIpSfvOiy8SWHk"/>
<div className="absolute bottom-4 right-4 bg-v-primary text-v-on-primary px-4 py-2 rounded-lg shadow-md font-v-label-lg text-v-label-lg flex items-center gap-2">
<span className="material-symbols-outlined">wifi</span> Free High-Speed Wi-Fi
                        </div>
</div>
<div className="w-full lg:w-1/2 flex flex-col gap-8">
<div>
<h4 className="font-v-headline-md text-v-headline-md text-v-on-background mb-4">Empowering <span className="text-v-primary">Curious Minds</span> in Our City</h4>
<p className="font-v-body-md text-v-body-md text-v-on-surface-variant">The Krishna Library is the city's most trusted public resource, dedicated to transforming curiosity into confident, lifelong learning. We combine extensive traditional collections with modern digital labs to bring out the best in every visitor.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="bg-v-surface-container-lowest p-6 rounded-lg shadow-sm border border-v-outline-variant/30 hover:shadow-md hover:-translate-y-1 transition-all">
<div className="w-12 h-12 bg-v-surface-variant rounded-full flex items-center justify-center mb-4 text-v-primary">
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>visibility</span>
</div>
<h5 className="font-v-headline-sm text-v-headline-sm text-v-on-background mb-2">Our Vision</h5>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant">Empowering every resident to reach their highest academic and personal potential.</p>
</div>
<div className="bg-v-surface-container-lowest p-6 rounded-lg shadow-sm border border-v-outline-variant/30 hover:shadow-md hover:-translate-y-1 transition-all">
<div className="w-12 h-12 bg-v-surface-variant rounded-full flex items-center justify-center mb-4 text-v-primary">
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>favorite</span>
</div>
<h5 className="font-v-headline-sm text-v-headline-sm text-v-on-background mb-2">Our Mission</h5>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant">Quality resources with accessible facilities, dedication, and deep community care.</p>
</div>
</div>
</div>
</div>
</div>
</section>
{/*  3. Services / Why Choose Us Section  */}
<section id="services" className="py-xl bg-v-surface-container-low">
<div className="max-w-container-max mx-auto px-gutter">
<div className="text-center mb-12">
<span className="inline-block bg-v-primary-fixed px-3 py-1 rounded-full text-v-primary font-v-label-md text-v-label-md uppercase tracking-wider mb-2">Why Us</span>
<h2 className="font-v-display text-v-display text-v-display-mobile md:text-headline-lg text-v-on-background">Why Choose <span className="text-v-secondary border-b-4 border-v-secondary pb-1">Krishna Library</span></h2>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
<div className="bg-v-surface-container-lowest p-6 rounded-xl shadow-sm border border-v-outline-variant/20 flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
<div className="w-16 h-16 bg-v-primary-fixed rounded-full flex items-center justify-center text-v-primary mb-4">
<span className="material-symbols-outlined text-3xl">library_books</span>
</div>
<h3 className="font-v-headline-sm text-v-headline-sm text-v-on-background mb-2">Extensive Collection</h3>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant">Over 1 million physical and digital resources available across all our branches.</p>
</div>
<div className="bg-v-surface-container-lowest p-6 rounded-xl shadow-sm border border-v-outline-variant/20 flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
<div className="w-16 h-16 bg-v-secondary-fixed rounded-full flex items-center justify-center text-v-secondary mb-4">
<span className="material-symbols-outlined text-3xl">devices</span>
</div>
<h3 className="font-v-headline-sm text-v-headline-sm text-v-on-background mb-2">24/7 Digital Library</h3>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant">Access e-books, audiobooks, and research databases anytime, anywhere.</p>
</div>
<div className="bg-v-surface-container-lowest p-6 rounded-xl shadow-sm border border-v-outline-variant/20 flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
<div className="w-16 h-16 bg-v-tertiary-fixed rounded-full flex items-center justify-center text-v-tertiary mb-4">
<span className="material-symbols-outlined text-3xl">support_agent</span>
</div>
<h3 className="font-v-headline-sm text-v-headline-sm text-v-on-background mb-2">Expert Support</h3>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant">Our dedicated librarians are here to help you research, learn, and discover.</p>
</div>
<div className="bg-v-surface-container-lowest p-6 rounded-xl shadow-sm border border-v-outline-variant/20 flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
<div className="w-16 h-16 bg-v-primary-fixed-dim rounded-full flex items-center justify-center text-v-primary mb-4">
<span className="material-symbols-outlined text-3xl">meeting_room</span>
</div>
<h3 className="font-v-headline-sm text-v-headline-sm text-v-on-background mb-2">Safe Community Spaces</h3>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant">Modern, clean, and welcoming environments for studying, collaborating, and reading.</p>
</div>
</div>
</div>
</section>
{/*  4. Achiever Students Section  */}
<section id="achievers" className="py-xl bg-wash">
<div className="max-w-container-max mx-auto px-gutter">
<div className="text-center mb-12">
<span className="inline-block bg-v-primary-fixed px-3 py-1 rounded-full text-v-primary font-v-label-md text-v-label-md uppercase tracking-wider mb-2">Success Stories</span>
<h2 className="font-v-display text-v-display text-v-display-mobile md:text-headline-lg text-v-on-background">Our <span className="text-v-secondary border-b-4 border-v-secondary pb-1">Achievers</span></h2>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
<div className="bg-v-surface-container-lowest p-6 rounded-2xl shadow-sm border border-v-outline-variant/20">
<div className="flex items-center gap-4 mb-4">
<img alt="Student" className="w-16 h-16 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXIyldosztmi8fNPYHddI3Ddsv7gSvYSw5EolHH-DQnTg4GfkF2Ng-ZPSCTwr1eUIHeVcVllJJbD17V6s1Ydd6_rAfMZFs6Qounf8a9P-WhPdR34KrWk0I6a6JlF6RnvzRlapPaiica1iWLhhRQBg5EMN_cPIml1df-in3jeIPiDj1OgKWBX6KyOZ5sFhvdBRUH9eNVvUoQ7itGs22Fm46XyOFDb3whdrbuxA_9pCBIqxqO5XbMUlmPbLgcmIo4IEnewxsmwYl-rIS"/>
<div>
<h4 className="font-v-headline-sm text-v-headline-sm text-v-on-background">Sarah Jenkins</h4>
<p className="font-v-label-md text-v-label-md text-v-primary">University Scholar</p>
</div>
</div>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant italic">"The quiet study rooms and access to premium academic databases at Krishna Library were crucial for my final year thesis. I couldn't have done it without this resource!"</p>
</div>
<div className="bg-v-surface-container-lowest p-6 rounded-2xl shadow-sm border border-v-outline-variant/20">
<div className="flex items-center gap-4 mb-4">
<img alt="Student" className="w-16 h-16 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB92wRJryR1hxdOU_xyKytgYaOMN0ksIkUqwf7KH_UbthE8L1d-7yZhnbSenN90WxMcrTGvXvgwIz5bkQq_9P-1gK12khzdGzwdW8Rw_Nh1QyPf5mk815rFYHp21OsoQaehunSP369cj5fczztRNGJDOCRehOwbL_IxZTvdMeLP1rv6DBlgf2NbWSaRfT-c_JFx0004hev3cHEbyxTS_ZEEfyIF0FBvn4InRGgNhNT7SmMkX3SO0gyaPc1ZDMDRLrLo6IvrhuPXf0Ng"/>
<div>
<h4 className="font-v-headline-sm text-v-headline-sm text-v-on-background">David Chen</h4>
<p className="font-v-label-md text-v-label-md text-v-primary">Self-Taught Developer</p>
</div>
</div>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant italic">"I learned to code using the library's free internet and tech workshop materials. The supportive environment here completely changed my career trajectory."</p>
</div>
<div className="bg-v-surface-container-lowest p-6 rounded-2xl shadow-sm border border-v-outline-variant/20">
<div className="flex items-center gap-4 mb-4">
<img alt="Student" className="w-16 h-16 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVCmcTA0DQW06Gn1_OIIDGJB_yFZ4EZWZhx4Q5QKlp0PrZBGBUwWtBC4zcoQYzjZ_7ow_yuVIzlWpMMMjKPiK0_8DLUr737mXshjJUGSabVlIK6mlNZAqTehs_NQ2Rsy4TyUjyAq5g519hNI24ugz_zIU44RHLPp0KnL_v9GpO1KS2ivq2fCGINOnwSfajgoM8tFCWoHQNH3sbSV4PEQKx5r3nqIwSeFmtFT4dU1-tqo307Me9kY4hlCPxw7TpQkEN9H2XEm4eGI52"/>
<div>
<h4 className="font-v-headline-sm text-v-headline-sm text-v-on-background">Maria Garcia</h4>
<p className="font-v-label-md text-v-label-md text-v-primary">Small Business Owner</p>
</div>
</div>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant italic">"Attending the adult literacy and business networking events here gave me the confidence and skills to launch my own local bakery. It's truly a community hub."</p>
</div>
</div>
</div>
</section>
{/*  5. Google Review Marquee  */}
<section className="py-12 bg-v-surface border-y border-v-outline-variant/20 overflow-hidden">
<div className="max-w-container-max mx-auto px-gutter mb-6 text-center">
<h3 className="font-v-headline-sm text-v-headline-sm text-v-on-background flex items-center justify-center gap-2">Loved by Our Community <span className="material-symbols-outlined text-v-secondary">star</span></h3>
</div>
<div className="marquee-container">
<div className="marquee-content">
{/*  Review 1  */}
<div className="bg-v-surface-container-lowest p-4 rounded-lg shadow-sm border border-v-outline-variant/10 min-w-[300px]">
<div className="flex text-v-on-tertiary-container mb-2 text-sm">
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
</div>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant mb-2">"Best public library in the city. The facilities are modern and the staff is incredibly helpful."</p>
<p className="font-label-sm text-v-primary font-bold">- Alex M.</p>
</div>
{/*  Review 2  */}
<div className="bg-v-surface-container-lowest p-4 rounded-lg shadow-sm border border-v-outline-variant/10 min-w-[300px]">
<div className="flex text-v-on-tertiary-container mb-2 text-sm">
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
</div>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant mb-2">"Great quiet spaces for studying. I come here every weekend to work on my projects."</p>
<p className="font-label-sm text-v-primary font-bold">- Jamie T.</p>
</div>
{/*  Review 3  */}
<div className="bg-v-surface-container-lowest p-4 rounded-lg shadow-sm border border-v-outline-variant/10 min-w-[300px]">
<div className="flex text-v-on-tertiary-container mb-2 text-sm">
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
</div>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant mb-2">"The children's programs are amazing! My kids look forward to the reading hour every week."</p>
<p className="font-label-sm text-v-primary font-bold">- Samantha R.</p>
</div>
{/*  Review 4  */}
<div className="bg-v-surface-container-lowest p-4 rounded-lg shadow-sm border border-v-outline-variant/10 min-w-[300px]">
<div className="flex text-v-on-tertiary-container mb-2 text-sm">
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
</div>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant mb-2">"An invaluable resource for the community. The digital collection is extensive and easy to use."</p>
<p className="font-label-sm text-v-primary font-bold">- Marcus B.</p>
</div>
</div>
{/*  Duplicate for seamless scrolling  */}
<div aria-hidden="true" className="marquee-content">
<div className="bg-v-surface-container-lowest p-4 rounded-lg shadow-sm border border-v-outline-variant/10 min-w-[300px]">
<div className="flex text-v-on-tertiary-container mb-2 text-sm">
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
</div>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant mb-2">"Best public library in the city. The facilities are modern and the staff is incredibly helpful."</p>
<p className="font-label-sm text-v-primary font-bold">- Alex M.</p>
</div>
<div className="bg-v-surface-container-lowest p-4 rounded-lg shadow-sm border border-v-outline-variant/10 min-w-[300px]">
<div className="flex text-v-on-tertiary-container mb-2 text-sm">
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
</div>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant mb-2">"Great quiet spaces for studying. I come here every weekend to work on my projects."</p>
<p className="font-label-sm text-v-primary font-bold">- Jamie T.</p>
</div>
<div className="bg-v-surface-container-lowest p-4 rounded-lg shadow-sm border border-v-outline-variant/10 min-w-[300px]">
<div className="flex text-v-on-tertiary-container mb-2 text-sm">
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
</div>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant mb-2">"The children's programs are amazing! My kids look forward to the reading hour every week."</p>
<p className="font-label-sm text-v-primary font-bold">- Samantha R.</p>
</div>
<div className="bg-v-surface-container-lowest p-4 rounded-lg shadow-sm border border-v-outline-variant/10 min-w-[300px]">
<div className="flex text-v-on-tertiary-container mb-2 text-sm">
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
</div>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant mb-2">"An invaluable resource for the community. The digital collection is extensive and easy to use."</p>
<p className="font-label-sm text-v-primary font-bold">- Marcus B.</p>
</div>
</div>
</div>
</section>
{/*  6. Live Seat Map Section  */}
<section id="seating" className="py-xl bg-v-surface-container-low">
<div className="max-w-container-max mx-auto px-gutter">
<div className="text-center mb-12">
<span className="inline-block bg-v-primary-fixed px-3 py-1 rounded-full text-v-primary font-v-label-md text-v-label-md uppercase tracking-wider mb-2">Live Availability</span>
<h2 className="font-v-display text-v-display text-v-display-mobile md:text-headline-lg text-v-on-background">Current <span className="text-v-secondary border-b-4 border-v-secondary pb-1">Seating</span></h2>
<p className="font-v-body-md text-v-body-md text-v-on-surface-variant mt-4">Check live availability before you visit the Main Branch.</p>
</div>
<div className="bg-v-surface-container-lowest p-8 rounded-2xl shadow-sm border border-v-outline-variant/20 max-w-4xl mx-auto">
<div className="flex items-center justify-center gap-6 mb-8 font-v-label-md text-v-label-md">
<div className="flex items-center gap-2"><div className="w-4 h-4 bg-v-surface-variant rounded"></div> Available</div>
<div className="flex items-center gap-2"><div className="w-4 h-4 bg-v-primary/20 rounded"></div> Partially Full</div>
<div className="flex items-center gap-2"><div className="w-4 h-4 bg-v-primary rounded"></div> Occupied</div>
</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
{/*  Zone A  */}
<div className="bg-v-surface-bright border border-v-outline-variant/30 p-4 rounded-xl text-center">
<h4 className="font-v-headline-sm text-v-headline-sm text-v-on-background mb-4">Quiet Zone</h4>
<div className="grid grid-cols-3 gap-2">
<div className="aspect-square bg-v-primary rounded shadow-sm"></div>
<div className="aspect-square bg-v-primary rounded shadow-sm"></div>
<div className="aspect-square bg-v-surface-variant rounded shadow-sm"></div>
<div className="aspect-square bg-v-primary rounded shadow-sm"></div>
<div className="aspect-square bg-v-surface-variant rounded shadow-sm"></div>
<div className="aspect-square bg-v-surface-variant rounded shadow-sm"></div>
</div>
<p className="mt-4 font-v-label-md text-v-label-md text-v-on-surface-variant">3/6 Available</p>
</div>
{/*  Zone B  */}
<div className="bg-v-surface-bright border border-v-outline-variant/30 p-4 rounded-xl text-center">
<h4 className="font-v-headline-sm text-v-headline-sm text-v-on-background mb-4">Tech Lab</h4>
<div className="grid grid-cols-3 gap-2">
<div className="aspect-square bg-v-primary rounded shadow-sm"></div>
<div className="aspect-square bg-v-primary rounded shadow-sm"></div>
<div className="aspect-square bg-v-primary rounded shadow-sm"></div>
<div className="aspect-square bg-v-primary rounded shadow-sm"></div>
<div className="aspect-square bg-v-primary rounded shadow-sm"></div>
<div className="aspect-square bg-v-primary/20 rounded shadow-sm"></div>
</div>
<p className="mt-4 font-v-label-md text-v-label-md text-v-on-surface-variant">1/6 Available</p>
</div>
{/*  Zone C  */}
<div className="bg-v-surface-bright border border-v-outline-variant/30 p-4 rounded-xl text-center">
<h4 className="font-v-headline-sm text-v-headline-sm text-v-on-background mb-4">Group Study</h4>
<div className="grid grid-cols-2 gap-2">
<div className="aspect-[2/1] bg-v-surface-variant rounded shadow-sm"></div>
<div className="aspect-[2/1] bg-v-primary rounded shadow-sm"></div>
<div className="aspect-[2/1] bg-v-surface-variant rounded shadow-sm"></div>
<div className="aspect-[2/1] bg-v-surface-variant rounded shadow-sm"></div>
</div>
<p className="mt-4 font-v-label-md text-v-label-md text-v-on-surface-variant">3/4 Available</p>
</div>
{/*  Zone D  */}
<div className="bg-v-surface-bright border border-v-outline-variant/30 p-4 rounded-xl text-center">
<h4 className="font-v-headline-sm text-v-headline-sm text-v-on-background mb-4">Reading Lounge</h4>
<div className="grid grid-cols-3 gap-2">
<div className="aspect-square bg-v-surface-variant rounded-full shadow-sm"></div>
<div className="aspect-square bg-v-primary rounded-full shadow-sm"></div>
<div className="aspect-square bg-v-surface-variant rounded-full shadow-sm"></div>
<div className="aspect-square bg-v-surface-variant rounded-full shadow-sm"></div>
<div className="aspect-square bg-v-surface-variant rounded-full shadow-sm"></div>
<div className="aspect-square bg-v-primary rounded-full shadow-sm"></div>
</div>
<p className="mt-4 font-v-label-md text-v-label-md text-v-on-surface-variant">4/6 Available</p>
</div>
</div>
</div>
</div>
</section>
{/*  7. Prices / Membership Plans Section  */}
<section id="membership" className="py-xl bg-v-surface">
<div className="max-w-container-max mx-auto px-gutter">
<div className="text-center mb-12">
<span className="inline-block bg-v-primary-fixed px-3 py-1 rounded-full text-v-primary font-v-label-md text-v-label-md uppercase tracking-wider mb-2">Join Us</span>
<h2 className="font-v-display text-v-display text-v-display-mobile md:text-headline-lg text-v-on-background">Membership <span className="text-v-secondary border-b-4 border-v-secondary pb-1">Plans</span></h2>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
{/*  Plan 1  */}
<div className="bg-v-surface-container-lowest rounded-2xl shadow-sm border border-v-outline-variant/30 p-8 flex flex-col hover:-translate-y-2 transition-transform duration-300">
<h3 className="font-v-headline-md text-v-headline-md text-v-primary mb-2">Basic</h3>
<p className="font-v-display text-v-display text-v-on-background mb-4">Free<span className="font-v-body-md text-v-body-md text-v-on-surface-variant font-normal">/forever</span></p>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant mb-6">Perfect for casual readers and local residents.</p>
<ul className="space-y-4 mb-8 flex-grow">
<li className="flex items-center gap-3 font-v-body-sm text-v-body-sm text-v-on-background"><span className="material-symbols-outlined text-v-primary text-sm">check_circle</span> Up to 5 physical books</li>
<li className="flex items-center gap-3 font-v-body-sm text-v-body-sm text-v-on-background"><span className="material-symbols-outlined text-v-primary text-sm">check_circle</span> Basic Wi-Fi access</li>
<li className="flex items-center gap-3 font-v-body-sm text-v-body-sm text-v-on-background"><span className="material-symbols-outlined text-v-primary text-sm">check_circle</span> Standard study room booking</li>
<li className="flex items-center gap-3 font-v-body-sm text-v-body-sm text-v-outline"><span className="material-symbols-outlined text-v-outline text-sm">cancel</span> No digital library access</li>
</ul>
<button className="w-full py-3 rounded-lg border-2 border-v-primary text-v-primary font-v-label-lg text-v-label-lg hover:bg-v-primary-fixed transition-colors">Sign Up</button>
</div>
{/*  Plan 2  */}
<div className="bg-v-primary rounded-2xl shadow-xl border border-v-primary p-8 flex flex-col relative transform md:scale-105 z-10">
<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-v-secondary text-white px-4 py-1 rounded-full font-label-sm text-xs uppercase tracking-wider">Most Popular</div>
<h3 className="font-v-headline-md text-v-headline-md text-white mb-2">Scholar</h3>
<p className="font-v-display text-v-display text-white mb-4">$5<span className="font-v-body-md text-v-body-md text-v-primary-fixed-dim font-normal">/month</span></p>
<p className="font-v-body-sm text-v-body-sm text-v-primary-fixed-dim mb-6">Ideal for students and avid learners.</p>
<ul className="space-y-4 mb-8 flex-grow">
<li className="flex items-center gap-3 font-v-body-sm text-v-body-sm text-white"><span className="material-symbols-outlined text-v-secondary text-sm">check_circle</span> Up to 15 physical books</li>
<li className="flex items-center gap-3 font-v-body-sm text-v-body-sm text-white"><span className="material-symbols-outlined text-v-secondary text-sm">check_circle</span> High-speed Wi-Fi access</li>
<li className="flex items-center gap-3 font-v-body-sm text-v-body-sm text-white"><span className="material-symbols-outlined text-v-secondary text-sm">check_circle</span> Priority study room booking</li>
<li className="flex items-center gap-3 font-v-body-sm text-v-body-sm text-white"><span className="material-symbols-outlined text-v-secondary text-sm">check_circle</span> Full digital library access</li>
</ul>
<button className="w-full py-3 rounded-lg bg-v-secondary text-white font-v-label-lg text-v-label-lg hover:bg-v-secondary-container transition-colors">Get Scholar</button>
</div>
{/*  Plan 3  */}
<div className="bg-v-surface-container-lowest rounded-2xl shadow-sm border border-v-outline-variant/30 p-8 flex flex-col hover:-translate-y-2 transition-transform duration-300">
<h3 className="font-v-headline-md text-v-headline-md text-v-tertiary mb-2">Premium</h3>
<p className="font-v-display text-v-display text-v-on-background mb-4">$15<span className="font-v-body-md text-v-body-md text-v-on-surface-variant font-normal">/month</span></p>
<p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant mb-6">For researchers, professionals, and families.</p>
<ul className="space-y-4 mb-8 flex-grow">
<li className="flex items-center gap-3 font-v-body-sm text-v-body-sm text-v-on-background"><span className="material-symbols-outlined text-v-tertiary text-sm">check_circle</span> Unlimited physical books</li>
<li className="flex items-center gap-3 font-v-body-sm text-v-body-sm text-v-on-background"><span className="material-symbols-outlined text-v-tertiary text-sm">check_circle</span> High-speed Wi-Fi &amp; Device Loan</li>
<li className="flex items-center gap-3 font-v-body-sm text-v-body-sm text-v-on-background"><span className="material-symbols-outlined text-v-tertiary text-sm">check_circle</span> Advanced booking (up to 30 days)</li>
<li className="flex items-center gap-3 font-v-body-sm text-v-body-sm text-v-on-background"><span className="material-symbols-outlined text-v-tertiary text-sm">check_circle</span> Full digital &amp; premium databases</li>
</ul>
<button className="w-full py-3 rounded-lg border-2 border-v-tertiary text-v-tertiary font-v-label-lg text-v-label-lg hover:bg-v-tertiary-fixed transition-colors">Get Premium</button>
</div>
</div>
</div>
</section>
{/*  8. Enquiry / Contact Section  */}
<section id="contact" className="py-xl bg-wash">
<div className="max-w-container-max mx-auto px-gutter">
<div className="text-center mb-12">
<span className="inline-block bg-v-primary-fixed px-3 py-1 rounded-full text-v-primary font-v-label-md text-v-label-md uppercase tracking-wider mb-2">Get in Touch</span>
<h2 className="font-v-display text-v-display text-v-display-mobile md:text-headline-lg text-v-on-background">Reserve Your <span className="text-v-secondary border-b-4 border-v-secondary pb-1">Study Space</span></h2>
</div>
<div className="flex flex-col lg:flex-row gap-lg bg-v-surface-container-lowest rounded-2xl shadow-md border border-v-outline-variant/20 overflow-hidden">
<div className="w-full lg:w-1/3 bg-v-primary p-8 text-v-on-primary flex flex-col justify-between">
<div>
<h3 className="font-v-headline-md text-v-headline-md mb-4 text-white">Start Your Focus Journey Today</h3>
<p className="font-v-body-sm text-v-body-sm text-v-primary-fixed-dim mb-8">Need a quiet space? Want to collaborate? Reserve a study room or tech space at your local branch—no fee required.</p>
<ul className="space-y-6">
<li className="flex items-start gap-4">
<div className="w-10 h-10 bg-v-on-primary/10 rounded-full flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-white">call</span>
</div>
<div>
<p className="font-v-label-md text-v-label-md text-v-primary-fixed-dim">Call / WhatsApp</p>
<p className="font-v-headline-sm text-v-headline-sm font-bold text-white">+1 (555) 012-3456</p>
</div>
</li>
<li className="flex items-start gap-4">
<div className="w-10 h-10 bg-v-on-primary/10 rounded-full flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-white">location_on</span>
</div>
<div>
<p className="font-v-label-md text-v-label-md text-v-primary-fixed-dim">Main Branch</p>
<p className="font-v-headline-sm text-v-headline-sm font-bold text-white">123 Library Way, City Center</p>
</div>
</li>
</ul>
</div>
</div>
<div className="w-full lg:w-2/3 p-8 md:p-12">
<div className="flex items-center gap-2 mb-6 text-v-primary">
<span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>edit_square</span>
<h4 className="font-v-headline-sm text-v-headline-sm font-bold">Reservation Form</h4>
</div>
<form className="space-y-6">
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div>
<label className="block font-v-label-md text-v-label-md text-v-on-surface-variant mb-2">Full Name *</label>
<input className="w-full bg-v-surface-bright border border-v-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-v-body-sm text-v-body-sm" placeholder="Your full name" type="text"/>
</div>
<div>
<label className="block font-v-label-md text-v-label-md text-v-on-surface-variant mb-2">Phone Number *</label>
<input className="w-full bg-v-surface-bright border border-v-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-v-body-sm text-v-body-sm" placeholder="+1 (555) 000-0000" type="tel"/>
</div>
</div>
<div>
<label className="block font-v-label-md text-v-label-md text-v-on-surface-variant mb-2">Email Address</label>
<input className="w-full bg-v-surface-bright border border-v-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-v-body-sm text-v-body-sm" placeholder="your@email.com" type="email"/>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div>
<label className="block font-v-label-md text-v-label-md text-v-on-surface-variant mb-2">Select Branch *</label>
<select className="w-full bg-v-surface-bright border border-v-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-v-body-sm text-v-body-sm text-v-on-surface-variant appearance-none">
<option>Central Library</option>
<option>Northside Branch</option>
<option>East End Tech Lab</option>
</select>
</div>
<div>
<label className="block font-v-label-md text-v-label-md text-v-on-surface-variant mb-2">Room Type *</label>
<select className="w-full bg-v-surface-bright border border-v-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-v-body-sm text-v-body-sm text-v-on-surface-variant appearance-none">
<option>Quiet Study (1-2 People)</option>
<option>Group Collaboration (3-6 People)</option>
<option>Media Lab Station</option>
</select>
</div>
</div>
<button className="w-full bg-v-primary text-v-on-primary py-4 rounded-lg font-v-label-lg text-v-label-lg shadow-sm hover:bg-primary-fixed-variant transition-colors flex items-center justify-center gap-2 mt-4" type="submit">
<span className="material-symbols-outlined">send</span> Submit Reservation
                            </button>
</form>
</div>
</div>
</div>
</section>
{/*  9. Locations Section  */}
<section id="locations" className="py-xl bg-v-surface">
<div className="w-full">
<div className="max-w-container-max mx-auto px-gutter mb-8 text-center">
<h2 className="font-v-display text-v-display text-v-display-mobile md:text-headline-lg text-v-on-background">Find <span className="text-v-secondary border-b-4 border-v-secondary pb-1">Us Here</span></h2>
<p className="font-v-body-md text-v-body-md text-v-on-surface-variant mt-4">Visit our Main Branch or find one of our 10+ locations across the city.</p>
</div>
</div></section></main>
    </div>
  );
}
