const fs = require('fs');

let html = fs.readFileSync('visitor page/code.html', 'utf8');

let bodyMatch = html.match(/(<nav[\s\S]*<\/main>)/i);
if (!bodyMatch) {
  console.log("Could not find <nav> to </main>");
  process.exit(1);
}
let content = bodyMatch[1];

content = content.replace(/class=/g, 'className=');

// Fix style tags
content = content.replace(/style='font-variation-settings:\s*"FILL"\s*1;?'/g, "style={{ fontVariationSettings: '\"FILL\" 1' }}");
// also fix empty style tags if any
content = content.replace(/style=""/g, "");

// Convert HTML comments to JSX comments
content = content.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

// Self close input tags
content = content.replace(/<input([^>]+)>/g, (match, p1) => {
  if (p1.trim().endsWith('/')) return match;
  return `<input${p1}/>`;
});

// Self close img tags just in case
content = content.replace(/<img([^>]+)>/g, (match, p1) => {
  if (p1.trim().endsWith('/')) return match;
  return `<img${p1}/>`;
});

// Self close br tags just in case
content = content.replace(/<br>/g, '<br/>');

const prefixes = [
  "primary-container", "outline-variant", "outline", "surface-variant",
  "secondary-fixed-dim", "on-error", "secondary-fixed", "on-tertiary",
  "secondary", "surface-container", "surface-tint", "on-tertiary-fixed",
  "surface-bright", "tertiary", "surface-dim", "surface-container-highest",
  "inverse-primary", "surface-container-lowest", "on-tertiary-container",
  "tertiary-container", "surface", "on-primary", "primary-fixed",
  "on-surface-variant", "on-tertiary-fixed-variant", "on-secondary-fixed",
  "on-primary-container", "on-primary-fixed", "inverse-surface",
  "on-error-container", "primary-fixed-dim", "on-secondary", "error-container",
  "on-surface", "on-secondary-fixed-variant", "primary", "background",
  "surface-container-high", "inverse-on-surface", "tertiary-fixed-dim",
  "tertiary-fixed", "secondary-container", "on-background",
  "on-primary-fixed-variant", "error", "on-secondary-container",
  "surface-container-low",
  
  "display-mobile", "body-sm", "headline-md", "label-lg", "display",
  "body-lg", "label-md", "headline-sm", "body-md", "headline-lg"
];

content = content.replace(/className="([^"]+)"/g, (match, p1) => {
  let classes = p1.split(/\s+/);
  let newClasses = classes.map(c => {
    for (let p of prefixes) {
      if (c === `bg-${p}`) return `bg-v-${p}`;
      if (c === `text-${p}`) return `text-v-${p}`;
      if (c === `border-${p}`) return `border-v-${p}`;
      if (c === `font-${p}`) return `font-v-${p}`;
      if (c === `ring-${p}`) return `ring-v-${p}`;
      if (c === `fill-${p}`) return `fill-v-${p}`;
      
      if (c.startsWith(`bg-${p}/`)) return c.replace(`bg-${p}`, `bg-v-${p}`);
      if (c.startsWith(`text-${p}/`)) return c.replace(`text-${p}`, `text-v-${p}`);
      if (c.startsWith(`border-${p}/`)) return c.replace(`border-${p}`, `border-v-${p}`);
      
      if (c === `dark:bg-${p}`) return `dark:bg-v-${p}`;
      if (c === `dark:text-${p}`) return `dark:text-v-${p}`;
      if (c === `dark:border-${p}`) return `dark:border-v-${p}`;
      if (c === `hover:bg-${p}`) return `hover:bg-v-${p}`;
      if (c === `hover:text-${p}`) return `hover:text-v-${p}`;
      if (c === `hover:border-${p}`) return `hover:border-v-${p}`;
    }
    return c;
  });
  return `className="${newClasses.join(' ')}"`;
});

content = content.replace(
  /<button className="hidden md:block text-v-primary font-v-label-lg px-4 py-2 hover:text-v-secondary transition-colors">Staff Login<\/button>/,
  `<Link href="/login" className="hidden md:block text-v-primary font-v-label-lg px-4 py-2 hover:text-v-secondary transition-colors">Staff Login</Link>`
);

let pageTsx = `"use client";
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-v-background text-v-on-background font-v-body-md antialiased selection:bg-v-primary-container selection:text-v-on-primary-container visitor-page">
      <style dangerouslySetInnerHTML={{__html: \`
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
      \`}} />
${content}
    </div>
  );
}
`;

fs.writeFileSync('app/page.tsx', pageTsx);
console.log('Successfully updated page.tsx');
