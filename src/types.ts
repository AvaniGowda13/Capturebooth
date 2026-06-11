export type LayoutType = 'single' | 'strip' | 'grid';

export interface PhotoSlot {
  id: number;
  src: string | null; // dataURL or objectURL
  zoom: number;       // e.g., 1.0 to 3.0
  rotation: number;   // 0, 90, 180, 270 degrees
  xOffset: number;    // relative horizontal panning
  yOffset: number;    // relative vertical panning
  filter: string;     // CSS-like filter code or custom filter name
}

export interface FrameOption {
  id: string;
  name: string;
  className: string;      // Tailwind styles for frame container
  bgColor: string;        // Hex/RGB color for drawings or base fallback
  textColor: string;      // Contrast text color (e.g., #000 or #fff)
  borderColor: string;    // Border wrapper color
  theme: 'classic' | 'retro' | 'pastel' | 'neon' | 'cyberpunk' | 'minimalist' | 'camera' | 'filmstar' | 'scrapbook';
  backgroundStyle?: string; // Additional gradient or custom field
  decorations?: string;   // decoration description
}

export interface Sticker {
  id: string;
  emoji: string;
  x: number;       // offset percentage (0 to 100)
  y: number;       // offset percentage (0 to 100)
  scale: number;   // scale factor (e.g., 0.5 to 2.5)
  rotation: number; // degrees
}

export interface SavedStrip {
  id: string;
  dataUrl: string;
  createdAt: string;
  layout: LayoutType;
}

export interface FontOption {
  id: string;
  name: string;
  family: string;
}

export const FONTS: FontOption[] = [
  { id: 'fredoka', name: 'Cute Rounded 🌸', family: "'Fredoka', sans-serif" },
  { id: 'dynapuff', name: 'Playful Bubble 🧸', family: "'DynaPuff', cursive" },
  { id: 'caveat', name: 'Cozy Script', family: "'Caveat', cursive" },
  { id: 'playfair', name: 'Classy Serif', family: "'Playfair Display', serif" },
  { id: 'grotesk', name: 'Tech Grotesk', family: "'Space Grotesk', sans-serif" },
  { id: 'montserrat', name: 'Bold Minimal', family: "'Montserrat', sans-serif" },
  { id: 'mono', name: 'Raw Mono', family: "'JetBrains Mono', monospace" },
  { id: 'sans', name: 'Default UI', family: "'Inter', sans-serif" },
];

export const FILTERS = [
  { id: 'none', name: 'Normal', filter: 'none' },
  { id: 'bw', name: 'Noir (B&W)', filter: 'grayscale(100%) contrast(120%)' },
  { id: 'classic-bw', name: 'Matte B&W 🎥', filter: 'grayscale(100%) contrast(90%) brightness(105%)' },
  { id: 'sepia', name: 'Vintage Warm 🎞️', filter: 'sepia(50%) contrast(100%) saturate(110%)' },
  { id: 'vintage-polaroid', name: 'Expired Film 📸', filter: 'sepia(25%) saturate(125%) contrast(105%) hue-rotate(-15deg) brightness(98%)' },
  { id: 'vintage-retro', name: 'Indie Gold 🍯', filter: 'sepia(40%) contrast(95%) saturate(130%) hue-rotate(-5deg)' },
  { id: 'vintage-glass', name: 'Warm Amber 🌅', filter: 'sepia(15%) saturate(135%) brightness(102%) contrast(90%)' },
  { id: 'cool', name: 'Cool Fade ❄️', filter: 'hue-rotate(15deg) contrast(95%) saturate(85%) opacity(95%)' },
  { id: 'chrome', name: 'Vibrant Candy 🍭', filter: 'saturate(165%) contrast(110%) brightness(105%)' },
  { id: 'soft-dream', name: 'Romantic Mist 🎀', filter: 'brightness(108%) contrast(85%) saturate(85%) opacity(95%)' },
  { id: 'darker', name: 'Mood Silhouette 👤', filter: 'brightness(80%) contrast(120%)' },
];

export const FRAMES: FrameOption[] = [
  {
    id: 'classic-white',
    name: 'Classic Polaroid',
    className: 'bg-[#faf9f4] border-stone-200 text-stone-900 shadow-2xl',
    bgColor: '#faf9f4',
    textColor: '#1c1917',
    borderColor: '#e2dfd2',
    theme: 'classic',
  },
  {
    id: 'retro-film',
    name: 'Retro Film Black',
    className: 'bg-zinc-900 border-zinc-800 text-amber-500 shadow-xl border-dashed',
    bgColor: '#18181b',
    textColor: '#f59e0b',
    borderColor: '#27272a',
    theme: 'retro',
  },
  {
    id: 'pastel-rose',
    name: 'Creamy Pastel',
    className: 'bg-rose-50/95 border-rose-100 text-rose-700 shadow-xl backdrop-blur-sm',
    bgColor: '#fff1f2',
    textColor: '#be123c',
    borderColor: '#ffe4e6',
    theme: 'pastel',
  },
  {
    id: 'y2k-pink-camera',
    name: 'Vintage Retro Digicam',
    className: 'bg-[#f7f4eb] border-rose-200/40 text-stone-700 shadow-xl overflow-hidden',
    bgColor: '#f7f4eb',
    textColor: '#1c1917',
    borderColor: '#e7e5e4',
    theme: 'camera',
  },
  {
    id: 'minimalist-sand',
    name: 'Beige Sand',
    className: 'bg-[#f2efe9] border-stone-300 text-stone-800 shadow-lg',
    bgColor: '#f2efe9',
    textColor: '#292524',
    borderColor: '#d6d3d1',
    theme: 'minimalist',
  },
  {
    id: 'space-chrome',
    name: 'Galactic Silver',
    className: 'bg-slate-300 border-slate-400 text-indigo-950 shadow-xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 border-2',
    bgColor: '#cbd5e1',
    textColor: '#1e1b4b',
    borderColor: '#94a3b8',
    theme: 'cyberpunk',
  },
  {
    id: 'frame-filmstar',
    name: '3D Chrome Star Filmstrip ⭐',
    className: 'bg-stone-950 text-white shadow-2xl relative border-none',
    bgColor: '#0c0a09',
    textColor: '#ffffff',
    borderColor: '#1c1917',
    theme: 'filmstar',
  },
  {
    id: 'frame-scrapbook',
    name: 'Warm Hibiscus Scrapbook 🌺',
    className: 'bg-[#581c1c] text-rose-950 shadow-2xl relative border-none',
    bgColor: '#ffffff', // paper interior
    textColor: '#450a0a',
    borderColor: '#881337',
    theme: 'scrapbook',
  }
];

export const EMOS = [
  '❤️', '✨', '🌸', '💫', '🌻', '🧸', '✌️', '🕶️', '🐶', '🍕', '🎉', '📷', '☕', '🐱', '🦕', '🪐'
];
