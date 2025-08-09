// lib/stringToGradient.ts
const GRADIENTS: [string, string][] = [
    ['#FBB199', '#FFD12E'],
    ['#E2ECA6', '#77A3FA'],
    ['#A7A0EF', '#77A3FA'],
    ['#94BE39', '#FFF3B4'],
    ['#FFA4A4', '#737ABB'],
  ];
  
  export function stringToGradient(input: string) {
    const trimmed = (input || '').trim().replace(/\s/g, '');
    const hash = Array.from(trimmed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const idx = GRADIENTS.length ? hash % GRADIENTS.length : 0;
    const [a, b] = GRADIENTS[idx] ?? ['#ddd', '#bbb'];
    return `linear-gradient(45deg, ${a} 15%, ${b} 90%)`;
  }
  