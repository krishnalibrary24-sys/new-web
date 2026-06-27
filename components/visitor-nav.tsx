"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { id: "about",      label: "About"      },
  { id: "founder-message", label: "Founder" },
  { id: "services",   label: "Services"   },
  { id: "achievers",  label: "Achievers"  },
  { id: "membership", label: "Membership" },
  { id: "contact",    label: "Contact"    },
  { id: "locations",  label: "Branches"   },
  { id: "faq",        label: "FAQ"        },
];

export default function VisitorNav() {
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  /* ── Scroll detection ── */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      let current = "";
      for (const link of NAV_LINKS) {
        const el = document.getElementById(link.id);
        if (el && el.getBoundingClientRect().top <= 100) current = link.id;
      }
      setActiveId(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted]);

  const scrollTo = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  };

  /* ── Full interactive nav (client only) ── */
  return (
    <>
      <header
        suppressHydrationWarning
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
          transition: "background 0.35s ease, box-shadow 0.35s ease, backdrop-filter 0.35s ease",
          background: scrolled ? "rgba(252,248,255,0.82)" : "rgba(252,248,255,0.96)",
          backdropFilter: scrolled ? "blur(18px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(18px) saturate(180%)" : "none",
          boxShadow: scrolled ? "0 1px 0 rgba(0,49,120,0.08), 0 4px 24px rgba(0,0,0,0.06)" : "0 1px 0 rgba(0,49,120,0.08)",
          animation: "kl-nav-fade-in 0.45s ease both",
        }}
      >
        <nav
          ref={navRef}
          style={{
            maxWidth: "1280px", margin: "0 auto", padding: "0 24px",
            height: scrolled ? "80px" : "100px",
            transition: "height 0.3s ease",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "24px",
          }}
        >
          {/* Logo */}
          <a
            href="#"
            onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            style={{ display: "flex", alignItems: "center", flexShrink: 0, textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <img
              src="/assets/logo.png"
              alt="Krishna Library"
              style={{
                height: scrolled ? "64px" : "84px",
                width: "auto", objectFit: "contain",
                transition: "height 0.3s ease",
              }}
            />
          </a>

          {/* Desktop links */}
          <div className="kl-nav-links hidden md:flex" style={{ flex: 1, justifyContent: "center" }}>
            {NAV_LINKS.map(link => {
              const active = activeId === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={e => scrollTo(link.id, e)}
                  className={`kl-nav-link${active ? " kl-nav-link--active" : ""}`}
                  data-active={active ? "true" : "false"}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* CTA group */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>

            <a href="#contact" onClick={e => scrollTo("contact", e)} className="kl-enroll-btn">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>person_add</span>
              Enroll Now
            </a>

            {/* Hamburger */}
            <button
              className="kl-hamburger flex md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <span className="kl-ham-line" style={{ transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
              <span className="kl-ham-line" style={{ opacity: menuOpen ? 0 : 1, transform: menuOpen ? "scaleX(0)" : "none" }} />
              <span className="kl-ham-line" style={{ transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="kl-mobile-menu">
            {NAV_LINKS.map((link, i) => {
              const active = activeId === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={e => scrollTo(link.id, e)}
                  className={`kl-mobile-link${active ? " kl-mobile-link--active" : ""}`}
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  {link.label}
                  {active && (
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                      chevron_right
                    </span>
                  )}
                </a>
              );
            })}
            <div className="kl-mobile-ctas">
              <a href="#contact" onClick={e => scrollTo("contact", e)} className="kl-mobile-enroll">
                Enroll Now
              </a>
            </div>
          </div>
        )}
      </header>

      <div style={{ height: "100px" }} />
    </>
  );
}
