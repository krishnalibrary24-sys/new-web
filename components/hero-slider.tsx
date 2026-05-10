"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";

/* ── Slide data ── */
const SLIDES = [
  {
    src: "/assets/images/hero/bengali_chowk.png",
    tag: "Bengali Chowk Branch",
    headline: "Where Knowledge\nMeets Community.",
    sub: "A serene, fully-equipped study environment in the heart of the city — crafted for focus and excellence.",
    cta: "Explore This Branch",
    ctaHref: "#locations",
  },
  {
    src: "/assets/images/hero/namnakala.png",
    tag: "Namnakala Branch",
    headline: "Quiet Spaces.\nBig Ambitions.",
    sub: "Premium seating, high-speed Wi-Fi, and a culture of achievement — everything you need to succeed.",
    cta: "View Seating",
    ctaHref: "#seating",
  },
  {
    src: "/assets/images/hero/amenities.png",
    tag: "World-Class Amenities",
    headline: "Explore, Learn,\nand Grow.",
    sub: "A network of 2 branches dedicated to lifelong learning, digital literacy, and a safe space to thrive.",
    cta: "Our Membership Plans",
    ctaHref: "#membership",
  },
];

const INTERVAL = 5500; // auto-advance ms

type SlideState = "idle" | "exit-left" | "exit-right" | "enter-left" | "enter-right";

export default function HeroSlider() {
  const [current,  setCurrent]  = useState(0);
  const [prevIdx,  setPrevIdx]  = useState<number | null>(null);
  const [dir,      setDir]      = useState<"next" | "prev">("next");
  const [phase,    setPhase]    = useState<"idle" | "transition">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((nextIdx: number, direction: "next" | "prev") => {
    if (phase === "transition") return;
    setDir(direction);
    setPrevIdx(current);
    setPhase("transition");

    // After exit animation finishes, snap to new slide
    setTimeout(() => {
      setCurrent(nextIdx);
      setPrevIdx(null);
      setPhase("idle");
    }, 700);
  }, [current, phase]);

  const next   = useCallback(() => goTo((current + 1) % SLIDES.length, "next"),  [current, goTo]);
  const goPrev = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length, "prev"), [current, goTo]);


  /* ── Auto-play ── */
  useEffect(() => {
    timerRef.current = setTimeout(next, INTERVAL);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, next]);

  /* ── Keyboard ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, goPrev]);

  const scrollTo = (href: string) => {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const slide     = SLIDES[current];
  const prevSlide  = prevIdx !== null ? SLIDES[prevIdx] : null;

  return (
    <>
      <style>{`
        /* ── Hero Slider Keyframes ── */
        @keyframes hs-img-enter-next {
          0%   { opacity: 0; transform: scale(1.06) translateX(3%); filter: blur(12px); }
          40%  { opacity: 0.7; filter: blur(4px); }
          100% { opacity: 1; transform: scale(1) translateX(0); filter: blur(0); }
        }
        @keyframes hs-img-enter-prev {
          0%   { opacity: 0; transform: scale(1.06) translateX(-3%); filter: blur(12px); }
          40%  { opacity: 0.7; filter: blur(4px); }
          100% { opacity: 1; transform: scale(1) translateX(0); filter: blur(0); }
        }
        @keyframes hs-img-exit-next {
          0%   { opacity: 1; transform: scale(1) translateX(0); filter: blur(0); }
          60%  { opacity: 0.4; filter: blur(6px); }
          100% { opacity: 0; transform: scale(0.97) translateX(-3%); filter: blur(14px); }
        }
        @keyframes hs-img-exit-prev {
          0%   { opacity: 1; transform: scale(1) translateX(0); filter: blur(0); }
          60%  { opacity: 0.4; filter: blur(6px); }
          100% { opacity: 0; transform: scale(0.97) translateX(3%); filter: blur(14px); }
        }
        @keyframes hs-content-in {
          0%   { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes hs-badge-in {
          0%   { opacity: 0; transform: translateX(-14px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes hs-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }

        .hs-img-enter-next { animation: hs-img-enter-next 0.7s cubic-bezier(0.4,0,0.2,1) forwards; }
        .hs-img-enter-prev { animation: hs-img-enter-prev 0.7s cubic-bezier(0.4,0,0.2,1) forwards; }
        .hs-img-exit-next  { animation: hs-img-exit-next  0.65s cubic-bezier(0.4,0,0.2,1) forwards; }
        .hs-img-exit-prev  { animation: hs-img-exit-prev  0.65s cubic-bezier(0.4,0,0.2,1) forwards; }

        .hs-content-enter { animation: hs-content-in 0.6s 0.25s cubic-bezier(0.4,0,0.2,1) both; }
        .hs-badge-enter   { animation: hs-badge-in   0.5s 0.15s cubic-bezier(0.34,1.56,0.64,1) both; }

        .hs-progress-bar {
          animation: hs-progress ${INTERVAL}ms linear forwards;
        }

        .hs-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(8px);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
        }
        .hs-nav-btn:hover {
          background: rgba(255,255,255,0.25);
          border-color: rgba(255,255,255,0.7);
          transform: translateY(-50%) scale(1.08);
        }
        .hs-nav-btn:active { transform: translateY(-50%) scale(0.95); }

        .hs-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.6);
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }
        .hs-dot--active {
          width: 28px;
          border-radius: 4px;
          background: white;
          border-color: white;
        }
      `}</style>

      <section
        id="hero"
        style={{
          position: "relative",
          width: "100%",
          minHeight: "620px",
          height: "90vh",
          maxHeight: "820px",
          overflow: "hidden",
          background: "#001a4d",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* ── Image Layers ── */}
        {/* Exiting slide */}
        {prevSlide && (
          <div
            key={`exit-${prevIdx}`}
            style={{ position: "absolute", inset: 0, zIndex: 1 }}
            className={dir === "next" ? "hs-img-exit-next" : "hs-img-exit-prev"}
          >
            <img
              src={prevSlide.src}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            />
            {/* Dark gradient overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(105deg, rgba(0,18,62,0.82) 0%, rgba(0,18,62,0.45) 55%, rgba(0,18,62,0.20) 100%)",
            }} />
          </div>
        )}

        {/* Entering / current slide */}
        <div
          key={`enter-${current}`}
          style={{ position: "absolute", inset: 0, zIndex: 2 }}
          className={phase === "transition"
            ? (dir === "next" ? "hs-img-enter-next" : "hs-img-enter-prev")
            : ""}
        >
          <img
            src={slide.src}
            alt={slide.tag}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
          {/* Cinematic dark gradient — left-heavy for text legibility */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(105deg, rgba(0,18,62,0.85) 0%, rgba(0,18,62,0.50) 50%, rgba(0,18,62,0.18) 100%)",
          }} />
          {/* Bottom fade for progress bar contrast */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "180px",
            background: "linear-gradient(to top, rgba(0,10,40,0.55) 0%, transparent 100%)",
          }} />
        </div>

        {/* ── Grain texture overlay (subtle film effect) ── */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.35,
        }} />

        {/* ── Text Content ── */}
        <div
          key={`content-${current}`}
          style={{
            position: "relative", zIndex: 10,
            maxWidth: "1280px", margin: "0 auto",
            padding: "0 24px",
            width: "100%",
          }}
        >
          {/* Badge */}
          <div
            className="hs-badge-enter"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: "100px",
              padding: "5px 14px 5px 10px",
              marginBottom: "20px",
            }}
          >
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#fdac29", boxShadow: "0 0 8px #fdac29",
              display: "inline-block", flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "Montserrat, sans-serif", fontSize: "11px",
              fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.92)",
            }}>
              {slide.tag}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="hs-content-enter"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "clamp(2rem, 5.5vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.12,
              color: "#ffffff",
              marginBottom: "20px",
              maxWidth: "700px",
              whiteSpace: "pre-line",
              textShadow: "0 2px 24px rgba(0,0,0,0.35)",
              letterSpacing: "-0.01em",
            }}
          >
            {slide.headline}
          </h1>

          {/* Subheading */}
          <p
            className="hs-content-enter"
            style={{
              fontFamily: "Lexend, sans-serif",
              fontSize: "clamp(0.95rem, 1.6vw, 1.15rem)",
              fontWeight: 400,
              color: "rgba(255,255,255,0.78)",
              maxWidth: "520px",
              lineHeight: 1.65,
              marginBottom: "36px",
              animationDelay: "0.35s",
            }}
          >
            {slide.sub}
          </p>

          {/* CTA Buttons */}
          <div
            className="hs-content-enter"
            style={{
              display: "flex", flexWrap: "wrap", gap: "12px",
              animationDelay: "0.45s",
            }}
          >
            <a
              href={slide.ctaHref}
              onClick={e => { e.preventDefault(); scrollTo(slide.ctaHref); }}
              style={{
                fontFamily: "Montserrat, sans-serif", fontSize: "13px", fontWeight: 700,
                letterSpacing: "0.05em", textTransform: "uppercase",
                color: "#ffffff", textDecoration: "none",
                padding: "13px 28px",
                background: "linear-gradient(135deg, #003178 0%, #0d47a1 100%)",
                borderRadius: "10px",
                boxShadow: "0 4px 20px rgba(0,49,120,0.50)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                display: "inline-flex", alignItems: "center", gap: "8px",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,49,120,0.65)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,49,120,0.50)";
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_forward</span>
              {slide.cta}
            </a>
            <a
              href="#contact"
              onClick={e => { e.preventDefault(); scrollTo("#contact"); }}
              style={{
                fontFamily: "Montserrat, sans-serif", fontSize: "13px", fontWeight: 700,
                letterSpacing: "0.05em", textTransform: "uppercase",
                color: "#ffffff", textDecoration: "none",
                padding: "13px 28px",
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(8px)",
                border: "1.5px solid rgba(255,255,255,0.35)",
                borderRadius: "10px",
                transition: "background 0.2s ease, border-color 0.2s ease",
                display: "inline-flex", alignItems: "center", gap: "8px",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.20)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.65)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.35)";
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>person_add</span>
              Enroll Now
            </a>
          </div>
        </div>

        {/* ── Prev / Next Arrows ── */}
        <button
          className="hs-nav-btn"
          style={{ left: "20px" }}
          onClick={goPrev}
          aria-label="Previous slide"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>chevron_left</span>
        </button>
        <button
          className="hs-nav-btn"
          style={{ right: "20px" }}
          onClick={next}
          aria-label="Next slide"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>chevron_right</span>
        </button>

        {/* ── Slide counter + dots + progress ── */}
        <div style={{
          position: "absolute", bottom: "28px", left: 0, right: 0,
          zIndex: 20,
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: "14px",
        }}>
          {/* Progress bar */}
          <div style={{
            width: "min(320px, 60vw)", height: "2px",
            background: "rgba(255,255,255,0.18)",
            borderRadius: "2px", overflow: "hidden",
          }}>
            <div
              key={`progress-${current}`}
              className="hs-progress-bar"
              style={{
                height: "100%",
                background: "rgba(255,255,255,0.85)",
                borderRadius: "2px",
                animationDuration: `${INTERVAL}ms`,
              }}
            />
          </div>

          {/* Dots + counter */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{
              fontFamily: "Montserrat, sans-serif", fontSize: "11px",
              fontWeight: 600, color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.08em",
            }}>
              {String(current + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
            </span>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`hs-dot${i === current ? " hs-dot--active" : ""}`}
                  onClick={() => goTo(i, i > current ? "next" : "prev")}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Slide label bottom-right ── */}
        <div style={{
          position: "absolute", bottom: "32px", right: "24px",
          zIndex: 20,
          fontFamily: "Montserrat, sans-serif", fontSize: "10px",
          fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.40)",
        }}>
          Krishna Library
        </div>
      </section>
    </>
  );
}
