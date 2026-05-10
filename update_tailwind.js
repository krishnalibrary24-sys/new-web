const fs = require('fs');

const designMd = fs.readFileSync('DESIGN.md', 'utf8');

// Parse YAML frontmatter
let inFrontmatter = false;
let lines = designMd.split('\n');
let colors = {};
let typography = {};
let spacing = {};
let rounded = {};

let currentSection = '';
let currentSub = '';

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trimEnd();
  if (line === '---') {
    if (!inFrontmatter) {
      inFrontmatter = true;
      continue;
    } else {
      break;
    }
  }
  
  if (!inFrontmatter) continue;
  
  if (!line.startsWith(' ') && line.endsWith(':')) {
    currentSection = line.replace(':', '');
    continue;
  }
  
  if (currentSection === 'colors') {
    let match = line.match(/^  ([a-zA-Z0-9-]+):\s*'([^']+)'/);
    if (match) {
      colors[`v-${match[1]}`] = match[2];
    }
  } else if (currentSection === 'spacing') {
    let match = line.match(/^  ([a-zA-Z0-9-]+):\s*(.+)/);
    if (match) {
      let val = match[2].replace(/'/g, '');
      if (!val.endsWith('px') && !val.endsWith('rem') && !isNaN(val)) val += 'px';
      spacing[match[1]] = val;
    }
  } else if (currentSection === 'rounded') {
    let match = line.match(/^  ([a-zA-Z0-9-]+):\s*(.+)/);
    if (match) {
      let val = match[2].replace(/'/g, '');
      rounded[match[1]] = val;
    }
  } else if (currentSection === 'typography') {
    if (line.startsWith('  ') && !line.startsWith('    ') && line.endsWith(':')) {
      currentSub = line.trim().replace(':', '');
      typography[`v-${currentSub}`] = {};
    } else if (line.startsWith('    ')) {
      let match = line.match(/^    ([a-zA-Z0-9]+):\s*(.+)/);
      if (match) {
        let key = match[1];
        let val = match[2].replace(/'/g, '');
        typography[`v-${currentSub}`][key] = val;
      }
    }
  }
}

// Convert typography to Tailwind format
let fonts = {};
let fontSizes = {};
for (let key in typography) {
  let item = typography[key];
  if (item.fontFamily) {
    fonts[key] = [item.fontFamily];
  }
  if (item.fontSize) {
    fontSizes[key] = [
      item.fontSize,
      {
        lineHeight: item.lineHeight || 'normal',
        fontWeight: item.fontWeight || 'normal',
        ...(item.letterSpacing ? { letterSpacing: item.letterSpacing } : {})
      }
    ];
  }
}

// Update tailwind.config.ts
let twConfig = fs.readFileSync('tailwind.config.ts', 'utf8');

// Replace colors
twConfig = twConfig.replace(/colors:\s*\{[\s\S]*?\.\.\.\(\{(.*?)\}\)/, (match, p1) => {
  return match.replace(p1, JSON.stringify(colors).slice(1, -1));
});

// Replace fonts
twConfig = twConfig.replace(/fontFamily:\s*\{[\s\S]*?\.\.\.\(\{(.*?)\}\)/, (match, p1) => {
  return match.replace(p1, JSON.stringify(fonts).slice(1, -1));
});

// Replace font sizes
twConfig = twConfig.replace(/fontSize:\s*\{[\s\S]*?\.\.\.\(\{(.*?)\}\)/, (match, p1) => {
  return match.replace(p1, JSON.stringify(fontSizes).slice(1, -1));
});

fs.writeFileSync('tailwind.config.ts', twConfig);
console.log("Updated tailwind.config.ts");
