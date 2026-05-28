"use client";

import ScrollReveal from "./scroll-reveal";

interface SectionHeadingProps {
  tag: string;
  title: string;
  highlight: string;
  description?: string;
  align?: "center" | "left";
}

export default function SectionHeading({
  tag,
  title,
  highlight,
  description,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div className={`mb-16 ${align === "center" ? "text-center" : "text-left"}`}>
      <ScrollReveal delay={0}>
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-v-primary/[0.06] text-v-primary font-montserrat text-[11px] font-bold uppercase tracking-[0.12em] border border-v-primary/10 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-v-primary" />
          {tag}
        </span>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <h2 className="font-montserrat text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-v-on-background leading-[1.15] tracking-tight">
          {title}{" "}
          <span className="text-v-primary relative">
            {highlight}
            <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-v-primary/20 rounded-full" />
          </span>
        </h2>
      </ScrollReveal>
      {description && (
        <ScrollReveal delay={0.2}>
          <p className="font-lexend text-v-on-surface-variant text-[15px] leading-relaxed mt-4 max-w-xl mx-auto">
            {description}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
}
