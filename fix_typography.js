const fs = require('fs');

let pageContent = fs.readFileSync('app/page.tsx', 'utf8');

const typoPrefixes = [
  "display-mobile", "body-sm", "headline-md", "label-lg", "display",
  "body-lg", "label-md", "headline-sm", "body-md", "headline-lg"
];

typoPrefixes.forEach(prefix => {
  let regex = new RegExp(`font-v-${prefix}\\b`, 'g');
  pageContent = pageContent.replace(regex, `font-v-${prefix} text-v-${prefix}`);
});

fs.writeFileSync('app/page.tsx', pageContent);
console.log("Updated typography classes in page.tsx");
