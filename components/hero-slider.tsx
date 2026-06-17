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
    src: "/assets/images/hero/namnakala.jpg", // Fixed extension
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
    ctaHref: "#pricing",
  },
];

const INTERVAL = 5000; // auto-advance ms

type SlideState = "idle" | "exit-left" | "exit-right" | "enter-left" | "enter-right";

export default function HeroSlider() {
  const [current,  setCurrent]  = useState(0);
  const [prevIdx,  setPrevIdx]  = useState<number | null>(null);
  const [dir,      setDir]      = useState<"next" | "prev">("next");
  const [phase,    setPhase]    = useState<"idle" | "transition">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((nextIdx: number, direction: "next" | "prev") => {
    if (phase === "transition") return;
    
    // Immediately update the slides so the new image enters and the old image exits
    setDir(direction);
    setPrevIdx(current);
    setCurrent(nextIdx);
    setPhase("transition");

    // After animation finishes, clean up the exiting slide
    setTimeout(() => {
      setPrevIdx(null);
      setPhase("idle");
    }, 550);
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
        /* Hardware accelerated translate3d to fix slide lag */
        @keyframes hs-img-enter-next {
          0%   { opacity: 0; transform: scale(1.05) translate3d(2%, 0, 0); }
          100% { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
        }
        @keyframes hs-img-enter-prev {
          0%   { opacity: 0; transform: scale(1.05) translate3d(-2%, 0, 0); }
          100% { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
        }
        @keyframes hs-img-exit-next {
          0%   { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
          100% { opacity: 0; transform: scale(0.98) translate3d(-2%, 0, 0); }
        }
        @keyframes hs-img-exit-prev {
          0%   { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
          100% { opacity: 0; transform: scale(0.98) translate3d(2%, 0, 0); }
        }
        @keyframes hs-content-in {
          0%   { opacity: 0; transform: translate3d(0, 18px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes hs-badge-in {
          0%   { opacity: 0; transform: translate3d(-14px, 0, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes hs-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }

        .hs-img-enter-next { animation: hs-img-enter-next 0.55s cubic-bezier(0.2,0.8,0.2,1) forwards; will-change: transform, opacity; }
        .hs-img-enter-prev { animation: hs-img-enter-prev 0.55s cubic-bezier(0.2,0.8,0.2,1) forwards; will-change: transform, opacity; }
        .hs-img-exit-next  { animation: hs-img-exit-next  0.5s cubic-bezier(0.2,0.8,0.2,1) forwards; will-change: transform, opacity; }
        .hs-img-exit-prev  { animation: hs-img-exit-prev  0.5s cubic-bezier(0.2,0.8,0.2,1) forwards; will-change: transform, opacity; }

        .hs-content-enter { animation: hs-content-in 0.5s 0.15s cubic-bezier(0.2,0.8,0.2,1) both; }
        .hs-badge-enter   { animation: hs-badge-in   0.4s 0.1s cubic-bezier(0.34,1.56,0.64,1) both; }

        .hs-progress-bar {
          animation: hs-progress ${INTERVAL}ms linear forwards;
        }

        .hs-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(12px);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hs-nav-btn:hover {
          background: rgba(255,255,255,0.3);
          border-color: rgba(255,255,255,0.9);
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 4px 24px rgba(0,0,0,0.2);
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
          width: 32px;
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
          minHeight: "700px",
          height: "100vh",
          maxHeight: "1080px",
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
              background: "linear-gradient(105deg, rgba(0,18,62,0.85) 0%, rgba(0,18,62,0.55) 55%, rgba(0,18,62,0.25) 100%)",
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
            background: "linear-gradient(to top, rgba(0,10,40,0.65) 0%, transparent 100%)",
          }} />
        </div>

        {/* ── Grain texture overlay (subtle film effect) ── */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.45,
        }} />

        {/* ── Text Content ── */}
        <div
          key={`content-${current}`}
          style={{
            position: "relative", zIndex: 10,
            maxWidth: "1536px", margin: "0 auto",
            padding: "0 clamp(24px, 5vw, 60px)",
            width: "100%",
          }}
        >
          {/* Badge */}
          <div
            className="hs-badge-enter"
            style={{
              display: "inline-flex", alignItems: "center", gap: "10px",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "100px",
              padding: "6px 18px 6px 12px",
              marginBottom: "24px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
            }}
          >
            <span style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: "#fdac29", boxShadow: "0 0 10px #fdac29",
              display: "inline-block", flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "Montserrat, sans-serif", fontSize: "12px",
              fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#ffffff",
            }}>
              {slide.tag}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="hs-content-enter"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 1.08,
              color: "#ffffff",
              marginBottom: "24px",
              maxWidth: "750px",
              whiteSpace: "pre-line",
              textShadow: "0 4px 30px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.3)",
              letterSpacing: "-0.02em",
            }}
          >
            {slide.headline}
          </h1>

          {/* Subheading */}
          <p
            className="hs-content-enter"
            style={{
              fontFamily: "Lexend, sans-serif",
              fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
              fontWeight: 400,
              color: "rgba(255,255,255,0.9)",
              maxWidth: "580px",
              lineHeight: 1.7,
              marginBottom: "42px",
              animationDelay: "0.25s",
              textShadow: "0 2px 10px rgba(0,0,0,0.4)",
            }}
          >
            {slide.sub}
          </p>

          {/* CTA Buttons */}
          <div
            className="hs-content-enter"
            style={{
              display: "flex", flexWrap: "wrap", gap: "16px",
              animationDelay: "0.35s",
            }}
          >
            <a
              href={slide.ctaHref}
              onClick={e => { e.preventDefault(); scrollTo(slide.ctaHref); }}
              style={{
                fontFamily: "Montserrat, sans-serif", fontSize: "14px", fontWeight: 700,
                letterSpacing: "0.06em", textTransform: "uppercase",
                color: "#ffffff", textDecoration: "none",
                padding: "16px 32px",
                background: "linear-gradient(135deg, #003178 0%, #0d47a1 100%)",
                borderRadius: "12px",
                boxShadow: "0 6px 24px rgba(0,49,120,0.6)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "inline-flex", alignItems: "center", gap: "10px",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px rgba(0,49,120,0.8)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(0,49,120,0.6)";
              }}
            >
              {slide.cta}
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
            </a>
            <a
              href="#contact"
              onClick={e => { e.preventDefault(); scrollTo("#contact"); }}
              style={{
                fontFamily: "Montserrat, sans-serif", fontSize: "14px", fontWeight: 700,
                letterSpacing: "0.06em", textTransform: "uppercase",
                color: "#ffffff", textDecoration: "none",
                padding: "16px 32px",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                border: "2px solid rgba(255,255,255,0.4)",
                borderRadius: "12px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "inline-flex", alignItems: "center", gap: "10px",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.8)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.4)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span>
              Enroll Now
            </a>
          </div>
        </div>

        {/* ── Prev / Next Arrows ── */}
        <button
          className="hs-nav-btn"
          style={{ left: "30px" }}
          onClick={goPrev}
          aria-label="Previous slide"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>chevron_left</span>
        </button>
        <button
          className="hs-nav-btn"
          style={{ right: "30px" }}
          onClick={next}
          aria-label="Next slide"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>chevron_right</span>
        </button>

        {/* ── Slide counter + dots + progress ── */}
        <div style={{
          position: "absolute", bottom: "36px", left: 0, right: 0,
          zIndex: 20,
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: "18px",
        }}>
          {/* Progress bar */}
          <div style={{
            width: "min(360px, 70vw)", height: "3px",
            background: "rgba(255,255,255,0.2)",
            borderRadius: "3px", overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          }}>
            <div
              key={`progress-${current}`}
              className="hs-progress-bar"
              style={{
                height: "100%",
                background: "#ffffff",
                borderRadius: "3px",
                animationDuration: `${INTERVAL}ms`,
              }}
            />
          </div>

          {/* Dots + counter */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <span style={{
              fontFamily: "Montserrat, sans-serif", fontSize: "13px",
              fontWeight: 700, color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.1em", textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            }}>
              {String(current + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
          position: "absolute", bottom: "40px", right: "32px",
          zIndex: 20,
          fontFamily: "Montserrat, sans-serif", fontSize: "12px",
          fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          textShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}>
          Krishna Library
        </div>
      </section>
    </>
  );
}
