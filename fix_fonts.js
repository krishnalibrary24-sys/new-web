const fs = require('fs');
let c = fs.readFileSync('tailwind.config.ts', 'utf8');

// Replace the entire fontFamily block
c = c.replace(
  /fontFamily:\s*\{[\s\S]*?\},\s*\n(\s*fontSize:)/,
  `fontFamily: {\n        /* DESIGN.md: Montserrat = headings/labels, Lexend = body */\n        'sans': ['Lexend', 'system-ui', 'sans-serif'],\n        'heading': ['Montserrat', 'system-ui', 'sans-serif'],\n        'montserrat': ['Montserrat', 'sans-serif'],\n        'lexend': ['Lexend', 'sans-serif'],\n        'v-display': ['Montserrat'],\n        'v-headline-lg': ['Montserrat'],\n        'v-headline-md': ['Montserrat'],\n        'v-headline-sm': ['Montserrat'],\n        'v-body-lg': ['Lexend'],\n        'v-body-md': ['Lexend'],\n        'v-body-sm': ['Lexend'],\n        'v-label-lg': ['Montserrat'],\n        'v-label-md': ['Montserrat'],\n        'v-display-mobile': ['Montserrat'],\n      },\n      $1`
);

fs.writeFileSync('tailwind.config.ts', c);
console.log('Updated fontFamily in tailwind.config.ts');
