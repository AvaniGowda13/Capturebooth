import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Download, 
  Printer, 
  Sparkles, 
  Smile, 
  Sliders, 
  Calendar, 
  Type, 
  Image as ImageIcon, 
  Maximize, 
  BookOpen, 
  RefreshCw,
  Undo2
} from 'lucide-react';
import { 
  FONTS, 
  FRAMES, 
  EMOS, 
  FILTERS, 
  LayoutType, 
  FrameOption, 
  PhotoSlot, 
  Sticker
} from './types';
import SlotAdjustments from './components/SlotAdjustments';
import StickerElement from './components/StickerElement';
import { playBeep } from './utils/sound';
import AmHeartLogo from './components/AmHeartLogo';
// @ts-expect-error - Vite handles PNG imports automatically
import heroBgImage from './assets/images/hero_background_1781160440173.png';
// @ts-expect-error - Vite handles PNG imports automatically
import frameFilmstarBg from './assets/images/frame_filmstar_1781160902375.png';
// @ts-expect-error - Vite handles PNG imports automatically
import frameScrapbookBg from './assets/images/frame_scrapbook_1781160933633.png';

/**
 * Aesthetic Photobooth App Layout
 */
export default function App() {
  // ----------------------------------------------------
  // States
  // ----------------------------------------------------
  const [layout, setLayout] = useState<LayoutType>('strip');
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>(FRAMES[0]);
  const [customFrameColor, setCustomFrameColor] = useState<string>('#faf9f4'); // dynamic classic white
  const [useCustomColor, setUseCustomColor] = useState<boolean>(false);
  
  // Custom text notes
  const [noteText, setNoteText] = useState<string>('');
  const [noteDate, setNoteDate] = useState<string>(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase();
  });
  const [noteColor, setNoteColor] = useState<string>('#1c1917');
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);

  // Initializing photo slots based on different layouts
  const [slots, setSlots] = useState<PhotoSlot[]>([
    { id: 1, src: null, zoom: 1.0, rotation: 0, xOffset: 0, yOffset: 0, filter: 'none' },
    { id: 2, src: null, zoom: 1.0, rotation: 0, xOffset: 0, yOffset: 0, filter: 'none' },
    { id: 3, src: null, zoom: 1.0, rotation: 0, xOffset: 0, yOffset: 0, filter: 'none' },
    { id: 4, src: null, zoom: 1.0, rotation: 0, xOffset: 0, yOffset: 0, filter: 'none' },
  ]);

  // Stickers array
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);

  // Active editor items
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);
  const [activeControlTab, setActiveControlTab] = useState<'design' | 'photos' | 'text' | 'stickers'>('design');

  // Popup management
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [compiledStripUrl, setCompiledStripUrl] = useState<string | null>(null);

  // DOM Refs
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Direct Drag to Pan Ref (X/Y mouse offset tracking)
  const dragPanStartRef = useRef<{ x: number; y: number; initialX: number; initialY: number; slotId: number } | null>(null);

  // Sync background colors if non-customized style picked
  useEffect(() => {
    if (!useCustomColor) {
      setCustomFrameColor(selectedFrame.bgColor);
      setNoteColor(selectedFrame.textColor);
    }
  }, [selectedFrame, useCustomColor]);

  // Adjust slots based on layout
  useEffect(() => {
    let requiredSlots = 4;
    if (layout === 'single') {
      requiredSlots = 1;
    } else if (layout === 'strip') {
      requiredSlots = 4;
    } else if (layout === 'grid') {
      requiredSlots = 4;
    }

    setSlots(prev => {
      // Keep existing populated images if we can, else expand or truncate
      const nextSlots = Array.from({ length: requiredSlots }, (_, i) => {
        const id = i + 1;
        const existing = prev.find(s => s.id === id);
        if (existing) return existing;
        return { id, src: null, zoom: 1.0, rotation: 0, xOffset: 0, yOffset: 0, filter: 'none' };
      });
      return nextSlots;
    });

    // Reset editing slot if it's discarded
    if (layout === 'single' && activeSlotId && activeSlotId > 1) {
      setActiveSlotId(null);
    }
  }, [layout]);

  // Convert File to Base64 Url helper
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fileInputRef.current) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const targetId = fileInputRef.current?.getAttribute('data-target-slot');
      if (targetId) {
        updateSlot(parseInt(targetId), { src: result });
      }
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const triggerUploadForSlot = (slotId: number) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-target-slot', slotId.toString());
      fileInputRef.current.click();
    }
  };

  const updateSlot = (id: number, fields: Partial<PhotoSlot>) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...fields } : s));
  };

  const removePhotoFromSlot = (id: number) => {
    updateSlot(id, { src: null, zoom: 1.0, xOffset: 0, yOffset: 0, rotation: 0, filter: 'none' });
  };

  const getCommonFilter = () => {
    if (slots.length === 0) return 'none';
    const firstFilter = slots[0].filter;
    const allSame = slots.every(s => s.filter === firstFilter);
    return allSame ? firstFilter : null;
  };

  const applyFilterToAllSlots = (filterId: string) => {
    setSlots(prev => prev.map(s => ({ ...s, filter: filterId })));
    playBeep(520, 0.05, 'sine');
  };

  // ----------------------------------------------------
  // Drag to Pan Functionality directly inside preview images
  // ----------------------------------------------------
  const handleSlotPointerDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, slot: PhotoSlot) => {
    if (!slot.src) return; // Only pan when photo present
    
    // Stop event bubbling to not trigger sticker deselection or container drag
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragPanStartRef.current = {
      x: clientX,
      y: clientY,
      initialX: slot.xOffset,
      initialY: slot.yOffset,
      slotId: slot.id,
    };

    // Set editing slot active on touch-hold/click
    setActiveSlotId(slot.id);
  };

  useEffect(() => {
    function handlePointerMove(e: MouseEvent | TouchEvent) {
      if (!dragPanStartRef.current) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const diffX = clientX - dragPanStartRef.current.x;
      const diffY = clientY - dragPanStartRef.current.y;

      const updatedX = dragPanStartRef.current.initialX + diffX;
      const updatedY = dragPanStartRef.current.initialY + diffY;

      updateSlot(dragPanStartRef.current.slotId, {
        xOffset: Math.max(-180, Math.min(180, updatedX)),
        yOffset: Math.max(-180, Math.min(180, updatedY)),
      });
    }

    function handlePointerUp() {
      dragPanStartRef.current = null;
    }

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, []);

  // ----------------------------------------------------
  // Stickers management
  // ----------------------------------------------------
  const addStickerToStrip = (emoji: string) => {
    playBeep(440, 0.08, 'triangle');
    const newSticker: Sticker = {
      id: `sticker-${Date.now()}-${Math.random()}`,
      emoji,
      x: 50 + (Math.random() * 20 - 10), // general center with random offset
      y: 60 + (Math.random() * 20 - 10),
      scale: 1.25,
      rotation: Math.round(Math.random() * 40 - 20),
    };

    setStickers(prev => [...prev, newSticker]);
    setActiveStickerId(newSticker.id);
    setActiveControlTab('stickers'); // switch to see controls
  };

  const updateSticker = (id: string, fields: Partial<Sticker>) => {
    setStickers(prev => prev.map(st => st.id === id ? { ...st, ...fields } : st));
  };

  const removeSticker = (id: string) => {
    setStickers(prev => prev.filter(st => st.id !== id));
    if (activeStickerId === id) setActiveStickerId(null);
  };

  const clearAllStickers = () => {
    setStickers([]);
    setActiveStickerId(null);
  };

  // ----------------------------------------------------
  // High-Resolution Image Rendering Canvas
  // ----------------------------------------------------
  const generateHighResRender = (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      setIsGenerating(true);

      // Preload background image if any custom theme image is active
      let loadedBgImg: HTMLImageElement | null = null;
      if (!useCustomColor) {
        let bgSrc: string | null = null;
        if (selectedFrame.theme === 'filmstar') {
          bgSrc = frameFilmstarBg;
        } else if (selectedFrame.theme === 'scrapbook') {
          bgSrc = frameScrapbookBg;
        }

        if (bgSrc) {
          try {
            loadedBgImg = await new Promise<HTMLImageElement>((resolveImg, rejectImg) => {
              const bgImg = new Image();
              bgImg.crossOrigin = 'anonymous';
              bgImg.onload = () => resolveImg(bgImg);
              bgImg.onerror = (err) => rejectImg(err);
              bgImg.src = bgSrc!;
            });
          } catch (e) {
            console.error('Error preloading high-res frame background asset', e);
          }
        }
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsGenerating(false);
        reject('Could not load 2D context');
        return;
      }

      // Canvas Resolution Setup based on layout proportions (300 DPI ready)
      let w = 1200;
      let h = 3600;

      if (layout === 'single') {
        h = selectedFrame.theme === 'camera' ? 680 : 1500;
      } else if (layout === 'grid') {
        h = 1600;
      }

      canvas.width = w;
      canvas.height = h;

      // Draw Background Frame Fill
      if (loadedBgImg) {
        ctx.drawImage(loadedBgImg, 0, 0, w, h);
      } else if (selectedFrame.theme === 'classic' && !useCustomColor) {
        // High-end luxurious warm off-white organic fine gradient
        const paperGrad = ctx.createLinearGradient(0, 0, w, h);
        paperGrad.addColorStop(0, '#fdfdfb');
        paperGrad.addColorStop(0.5, '#FAF8F2');
        paperGrad.addColorStop(1, '#f1ede0');
        ctx.fillStyle = paperGrad;
        ctx.fillRect(0, 0, w, h);

        // Render natural fine analog paper pulp speckles/micro-grain
        ctx.save();
        ctx.fillStyle = '#000000';
        for (let i = 0; i < 4000; i++) {
          const sx = Math.random() * w;
          const sy = Math.random() * h;
          const opacity = Math.random() * 0.016 + 0.004; // extreme fine micro contrast
          ctx.globalAlpha = opacity;
          const sz = Math.random() * 1.6 + 0.4;
          ctx.beginPath();
          ctx.arc(sx, sy, sz, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        ctx.fillStyle = customFrameColor;
        ctx.fillRect(0, 0, w, h);
      }

      // Frame Thematic Decor Painting
      if (selectedFrame.theme === 'camera' && !useCustomColor) {
        // Redraw ambient classic desk wallpaper background
        ctx.fillStyle = '#f7f4eb';
        ctx.fillRect(0, 0, w, h);

        // Scatter soft background rose blossoms & sparkle symbols
        const rosesPositions = [
          { x: 100, y: 70, s: '🌸' },
          { x: 1100, y: 610, s: '🌸' },
          { x: 300, y: 550, s: '🌸' },
          { x: 800, y: 80, s: '🌸' },
          { x: 450, y: 50, s: '✨' },
          { x: 950, y: 480, s: '✨' },
        ];
        ctx.save();
        rosesPositions.forEach(p => {
          ctx.font = '36px serif';
          ctx.globalAlpha = 0.22;
          ctx.fillText(p.s, p.x, p.y);
        });
        ctx.restore();

        // 1. Draw Camera Body Rounded Rectangle
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 15;
        ctx.beginPath();
        ctx.roundRect(24, 24, 1152, 632, 42);
        
        // Dark metallic carbon-charcoal pebble-leather body color
        ctx.fillStyle = '#312d2c'; 
        ctx.fill();
        ctx.restore();

        // 2. Draw Silver Top and Bottom bumper plates (Rangefinder Metal Finish)
        ctx.save();
        const silverGradient = ctx.createLinearGradient(0, 24, 0, 114);
        silverGradient.addColorStop(0, '#f4f4f5');
        silverGradient.addColorStop(0.3, '#ebdcd5'); // warm champagne-silver
        silverGradient.addColorStop(0.7, '#d4d4d8');
        silverGradient.addColorStop(1, '#a1a1aa');

        ctx.fillStyle = silverGradient;
        ctx.beginPath();
        ctx.roundRect(24, 24, 1152, 90, [42, 42, 0, 0]);
        ctx.fill();

        const silverGradientBottom = ctx.createLinearGradient(0, 566, 0, 656);
        silverGradientBottom.addColorStop(0, '#d4d4d8');
        silverGradientBottom.addColorStop(0.5, '#e4e4e7');
        silverGradientBottom.addColorStop(1, '#a1a1aa');
        ctx.fillStyle = silverGradientBottom;
        ctx.beginPath();
        ctx.roundRect(24, 566, 1152, 90, [0, 0, 42, 42]);
        ctx.fill();
        ctx.restore();

        // 3. Draw Groove Lines
        ctx.strokeStyle = '#1e1b1a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(24, 114);
        ctx.lineTo(1176, 114);
        ctx.moveTo(24, 566);
        ctx.lineTo(1176, 566);
        ctx.stroke();

        // 4. Shiny Hex Screws in Corners
        const drawScrew = (sx: number, sy: number) => {
          ctx.save();
          // Screw circle
          ctx.beginPath();
          ctx.arc(sx, sy, 8, 0, Math.PI * 2);
          const screwGrad = ctx.createRadialGradient(sx - 2, sy - 2, 1, sx, sy, 8);
          screwGrad.addColorStop(0, '#ffffff');
          screwGrad.addColorStop(1, '#71717a');
          ctx.fillStyle = screwGrad;
          ctx.fill();
          ctx.strokeStyle = '#3f3f46';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Horizontal thread line
          ctx.strokeStyle = '#18181b';
          ctx.beginPath();
          ctx.moveTo(sx - 5, sy - 2);
          ctx.lineTo(sx + 5, sy + 2);
          ctx.stroke();
          ctx.restore();
        };

        drawScrew(55, 60);
        drawScrew(1145, 60);
        drawScrew(55, 620);
        drawScrew(1145, 620);

        // 5. Classic Glass Viewfinder Port (on the top metallic bar)
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(140, 44, 95, 52, 8);
        ctx.fillStyle = '#18181b'; // outer black rim
        ctx.fill();
        ctx.strokeStyle = '#a1a1aa';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(147, 49, 81, 42, 4);
        const glassGrad = ctx.createRadialGradient(160, 60, 2, 180, 70, 45);
        glassGrad.addColorStop(0, '#06b6d4'); // cyber turquoise lens glow
        glassGrad.addColorStop(0.6, '#0891b2');
        glassGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = glassGrad;
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(155, 52);
        ctx.lineTo(195, 88);
        ctx.stroke();
        ctx.restore();

        // RED recording/timer LED indicator
        ctx.save();
        ctx.beginPath();
        ctx.arc(275, 70, 10, 0, Math.PI * 2);
        const ledGrad = ctx.createRadialGradient(272, 67, 1, 275, 70, 10);
        ledGrad.addColorStop(0, '#fca5a5');
        ledGrad.addColorStop(0.4, '#ef4444');
        ledGrad.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = ledGrad;
        ctx.fill();
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // 6. Vintage Engravings
        ctx.save();
        ctx.fillStyle = '#3f3f46';
        ctx.font = '900 italic 20px "Space Grotesk", sans-serif';
        ctx.fillText('SuperShot Y2K', 460, 75);

        ctx.fillStyle = '#52525b';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('AUTO FOCUS / MULTI-COATED LENS', 740, 72);
        ctx.fillText('SYSTEM MC-33', 1010, 72);
        
        ctx.fillText('VINTAGE HYBRID DIGICAM', 250, 618);
        ctx.fillText('• 12.1 MP • 3.0" LCD MONITOR •', 740, 618);
        ctx.restore();

        // 7. LCD Screen Bezel Frame (Fits photo screen coordinates 75,90, width=760, height=500)
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(58, 73, 794, 534, 18);
        ctx.fillStyle = '#100f0f'; 
        ctx.fill();
        ctx.strokeStyle = '#272525';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // 8. Control Panel Buttons (on the right-hand chassis grip area X = 1010)
        const ctrlX = 1010;

        // Speaker holes
        ctx.fillStyle = '#18181b';
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 2; c++) {
            ctx.beginPath();
            ctx.arc(ctrlX - 35 + c * 18, 160 + r * 14, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        const drawMetallicButton = (bx: number, by: number, label: string, size: number = 24) => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, size + 2, 0, Math.PI * 2);
          ctx.fillStyle = '#18181b';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(bx, by, size, 0, Math.PI * 2);
          const silverBtnGrad = ctx.createLinearGradient(bx - size, by - size, bx + size, by + size);
          silverBtnGrad.addColorStop(0, '#f4f4f5');
          silverBtnGrad.addColorStop(0.5, '#cbd5e1');
          silverBtnGrad.addColorStop(1, '#64748b');
          ctx.fillStyle = silverBtnGrad;
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 12px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, bx, by);
          ctx.restore();
        };

        drawMetallicButton(ctrlX - 35, 270, 'W', 22);
        drawMetallicButton(ctrlX + 25, 270, 'T', 22);
        drawMetallicButton(ctrlX - 5, 360, 'MODE', 25);

        // Navigation Circular D-Pad
        ctx.save();
        const dpadRadius = 55;
        ctx.beginPath();
        ctx.arc(ctrlX - 5, 485, dpadRadius, 0, Math.PI * 2);
        const dpadGrad = ctx.createLinearGradient(ctrlX - 5 - dpadRadius, 485 - dpadRadius, ctrlX - 5 + dpadRadius, 485 + dpadRadius);
        dpadGrad.addColorStop(0, '#cbd5e1');
        dpadGrad.addColorStop(0.5, '#e2e8f0');
        dpadGrad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = dpadGrad;
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', ctrlX - 5, 485 - 38);
        ctx.fillText('🗑️', ctrlX - 5, 485 + 38);
        ctx.fillText('◀', ctrlX - 5 - 38, 485);
        ctx.fillText('▶', ctrlX - 5 + 38, 485);

        drawMetallicButton(ctrlX - 5, 485, 'SET', 20);
        ctx.restore();

        // Hydrangea flowers decoration (gorgeous vintage overlays in bottom-right/top-right corners)
        ctx.save();
        ctx.font = '72px serif';
        ctx.fillText('🌸', 1130, 40);
        ctx.font = '60px serif';
        ctx.fillText('🌸', 1090, 80);
        ctx.font = '45px serif';
        ctx.fillText('✨', 1110, 120);
        ctx.font = '50px serif';
        ctx.fillText('🌸', 1150, 90);
        ctx.restore();
      }

      // Draw Photo Boxes
      interface BoxCoord { x: number; y: number; width: number; height: number; slotId: number }
      const boxes: BoxCoord[] = [];

      if (layout === 'strip') {
        const photoW = 1008;
        const photoH = 672; // aspect 3:2
        const marginX = 96;
        const spacing = 48;
        const startY = 120;

        slots.forEach((slot, idx) => {
          boxes.push({
            x: marginX,
            y: startY + idx * (photoH + spacing),
            width: photoW,
            height: photoH,
            slotId: slot.id,
          });
        });
      } else if (layout === 'grid') {
        const photoW = 490;
        const photoH = 368; // aspect 4:3
        const marginX = 80;
        const spacingX = 60;
        const spacingY = 60;
        const startY = 140;

        boxes.push(
          { x: marginX, y: startY, width: photoW, height: photoH, slotId: 1 },
          { x: marginX + photoW + spacingX, y: startY, width: photoW, height: photoH, slotId: 2 },
          { x: marginX, y: startY + photoH + spacingY, width: photoW, height: photoH, slotId: 3 },
          { x: marginX + photoW + spacingX, y: startY + photoH + spacingY, width: photoW, height: photoH, slotId: 4 }
        );
      } else if (layout === 'single') {
        if (selectedFrame.theme === 'camera') {
          // Horizontal Y2K Camera Viewport fitting screen aspect ratio 3:2 beautifully
          const photoW = 760;
          const photoH = 500;
          const marginX = 75;
          const startY = 90;
          boxes.push({
            x: marginX,
            y: startY,
            width: photoW,
            height: photoH,
            slotId: 1,
          });
        } else {
          const photoW = 1008;
          const photoH = 756; // Polaroid classical square-ish (4:3)
          const marginX = 96;
          const startY = 120;

          boxes.push({
            x: marginX,
            y: startY,
            width: photoW,
            height: photoH,
            slotId: 1,
          });
        }
      }

      const imgLoadPromises = boxes.map(box => {
        return new Promise<void>((resolveBox) => {
          const slot = slots.find(s => s.id === box.slotId);
          if (!slot || !slot.src) {
            // Empty photo box paint dark placeholders standard photobooths
            ctx.fillStyle = '#1e293b'; // dark steel gray
            ctx.fillRect(box.x, box.y, box.width, box.height);
            
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold italic 24px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('[ PHOTO PREVIEW EMPTY ]', box.x + box.width / 2, box.y + box.height / 2);
            resolveBox();
            return;
          }

          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            ctx.save();
            
            // Clip context to the photo box rectangle boundary
            ctx.beginPath();
            ctx.rect(box.x, box.y, box.width, box.height);
            ctx.clip();

            // Set background color for rotated edge spacing
            ctx.fillStyle = '#000';
            ctx.fillRect(box.x, box.y, box.width, box.height);

            // Set filter settings directly on canvas
            const mapFilterVal = FILTERS.find(f => f.id === slot.filter)?.filter || 'none';
            ctx.filter = mapFilterVal;

            // Compute center of box
            const cx = box.x + box.width / 2;
            const cy = box.y + box.height / 2;

            ctx.translate(cx, cy);
            ctx.rotate((slot.rotation * Math.PI) / 180);
            ctx.scale(slot.zoom, slot.zoom);

            // Compute ideal fitted sizes keeping aspect ratio intact before zoom
            const scaleWidth = box.width / img.width;
            const scaleHeight = box.height / img.height;
            const minScale = Math.max(scaleWidth, scaleHeight);

            const drawW = img.width * minScale;
            const drawH = img.height * minScale;

            // Draw with standard user zoom/pan translations
            ctx.drawImage(
              img, 
              -drawW / 2 + slot.xOffset * 2,  // compensate for hi-res canvas size offset coordinates
              -drawH / 2 + slot.yOffset * 2, 
              drawW, 
              drawH
            );

            ctx.restore();

            // Draw vintage photo mounting corners as shown in the requested scrapbook frame layout
            if (selectedFrame.theme === 'scrapbook' && !useCustomColor) {
              ctx.save();
              ctx.strokeStyle = '#450a0a'; // dark warm maroon coordinates matching hibiscus
              ctx.lineWidth = 10;
              
              const gap = 3;
              const cl = 28; // corner length
              
              // Top-left corner
              ctx.beginPath();
              ctx.moveTo(box.x - gap + cl, box.y - gap);
              ctx.lineTo(box.x - gap, box.y - gap);
              ctx.lineTo(box.x - gap, box.y - gap + cl);
              ctx.stroke();

              // Top-right corner
              ctx.beginPath();
              ctx.moveTo(box.x + box.width + gap - cl, box.y - gap);
              ctx.lineTo(box.x + box.width + gap, box.y - gap);
              ctx.lineTo(box.x + box.width + gap, box.y - gap + cl);
              ctx.stroke();

              // Bottom-left corner
              ctx.beginPath();
              ctx.moveTo(box.x - gap + cl, box.y + box.height + gap);
              ctx.lineTo(box.x - gap, box.y + box.height + gap);
              ctx.lineTo(box.x - gap, box.y + box.height + gap - cl);
              ctx.stroke();

              // Bottom-right corner
              ctx.beginPath();
              ctx.moveTo(box.x + box.width + gap - cl, box.y + box.height + gap);
              ctx.lineTo(box.x + box.width + gap, box.y + box.height + gap);
              ctx.lineTo(box.x + box.width + gap, box.y + box.height + gap - cl);
              ctx.stroke();

              ctx.restore();
            }

            // Beautiful 3D cardboard slot cutout bevel & film gloss highlights for realistic Polaroid
            if (selectedFrame.theme === 'classic' && !useCustomColor) {
              ctx.save();
              
              // 1. Photo Cutout Recess Shadow (Simulates thick card overlay casting shadow on photo)
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
              ctx.lineWidth = 4;
              ctx.strokeRect(box.x, box.y, box.width, box.height);

              ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
              ctx.lineWidth = 8;
              ctx.strokeRect(box.x, box.y, box.width, box.height);

              // 2. 3D Embossed Cutout Card Rim (Fine white/creamy raise highlight on the outer container)
              // Top & Left subtle dark/grey shadow edge
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(box.x - 1, box.y + box.height + 1);
              ctx.lineTo(box.x - 1, box.y - 1);
              ctx.lineTo(box.x + box.width + 1, box.y - 1);
              ctx.stroke();

              // Bottom & Right clean self-illuminating white highlight edge
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(box.x - 1, box.y + box.height + 1);
              ctx.lineTo(box.x + box.width + 1, box.y + box.height + 1);
              ctx.lineTo(box.x + box.width + 1, box.y - 1);
              ctx.stroke();

              // 3. Film Gloss Sheen Overlay (Soft gradient sweep representing actual photo finish gloss)
              const glossGrad = ctx.createLinearGradient(box.x, box.y, box.x + box.width, box.y + box.height);
              glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.09)');
              glossGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.04)');
              glossGrad.addColorStop(0.37, 'rgba(255, 255, 255, 0)');
              glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
              ctx.fillStyle = glossGrad;
              ctx.fillRect(box.x, box.y, box.width, box.height);

              ctx.restore();
            }

            resolveBox();
          };
          img.onerror = () => {
            console.error('Cant render photo ' + box.slotId);
            resolveBox();
          };
          img.src = slot.src;
        });
      });

      Promise.all(imgLoadPromises).then(() => {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw Frame Thematic Decor Painting ON TOP of photos!
        if (selectedFrame.theme === 'retro' && !useCustomColor) {
          // Draw vintage sprocket layout lines on sides
          ctx.fillStyle = '#101010';
          // Left rail
          ctx.fillRect(0, 0, 75, h);
          // Right rail
          ctx.fillRect(w - 75, 0, 75, h);

          // Sprockets loop
          ctx.fillStyle = '#ffcf33'; // light film amber yellow
          const sprocketH = 40;
          const sprocketW = 26;
          const spacing = 100;
          ctx.font = 'bold 16px monospace';
          
          for (let i = 40; i < h; i += spacing) {
            // Left sprocketRounded holes
            ctx.fillStyle = '#1e1b1b';
            ctx.beginPath();
            ctx.roundRect(24, i, sprocketW, sprocketH, 8);
            ctx.fill();

            // Right sprocket
            ctx.beginPath();
            ctx.roundRect(w - 50, i, sprocketW, sprocketH, 8);
            ctx.fill();

            // Orange index numbers and timeline frames
            ctx.fillStyle = '#ef4444';
            ctx.fillText(`KODAK 400 • FRAME ${Math.floor(i / 100)}`, 100, i + 25);
          }
        }

        if (selectedFrame.theme === 'pastel' && !useCustomColor) {
          // Draw little vintage romantic borders and corner flowers
          ctx.strokeStyle = 'rgba(244, 143, 177, 0.4)';
          ctx.lineWidth = 12;
          ctx.strokeRect(30, 30, w - 60, h - 90);

          // Cute corner symbols
          ctx.fillStyle = '#f43f5e';
          ctx.font = '48px serif';
          ctx.fillText('🌸', 60, 100);
          ctx.fillText('✨', w - 100, 100);
          ctx.fillText('✨', 60, h - 200);
          ctx.fillText('🌸', w - 100, h - 200);
        }

        if (selectedFrame.theme === 'filmstar' && !useCustomColor) {
          ctx.save();
          ctx.fillStyle = '#facc15'; // bright star gold/yellow
          ctx.font = '64px serif';
          ctx.fillText('⭐', 50, 150);
          ctx.fillText('✨', 45, 300);
          ctx.fillText('✨', w - 85, 120);
          ctx.fillText('✨', w - 85, h - 350);
          ctx.fillText('⭐', 60, h - 240);
          
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 24px monospace';
          ctx.fillText('ISO 400', 80, h - 100);
          ctx.fillText('KODAK 3A', w - 240, h - 100);
          ctx.restore();
        }

        if (selectedFrame.theme === 'scrapbook' && !useCustomColor) {
          ctx.save();
          ctx.font = '72px serif';
          ctx.fillText('🌺', 45, 125);
          ctx.fillText('🌸', w - 110, 150);
          ctx.fillText('🌺', w - 120, h - 280);
          ctx.fillText('💮', 50, h - 180);
          ctx.restore();
        }

        if (selectedFrame.theme === 'neon' && !useCustomColor) {
          // Glowing outline
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 15;
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 8;
          ctx.strokeRect(25, 25, w - 50, h - 50);

          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#f43f5e';
          ctx.strokeRect(35, 35, w - 70, h - 70);
          
          ctx.shadowBlur = 0; // reset
        }

        // Draw Custom Signed Text Notes at Bottom layout gaps
        if (selectedFrame.theme !== 'camera') {
          let textY = h - 350;
          let dateY = h - 180;

          if (layout === 'grid') {
            textY = h - 340;
            dateY = h - 180;
          } else if (layout === 'single') {
            textY = h - 330;
            dateY = h - 180;
          }

          ctx.fillStyle = noteColor;

          // Custom Fonts sizing match
          const canvasFontFamily = selectedFont.family;
          
          ctx.font = `bold 64px ${canvasFontFamily}`;
          if (selectedFont.id === 'caveat') {
            ctx.font = `700 85px ${canvasFontFamily}`;
          }
          ctx.fillText(noteText.toUpperCase(), w / 2, textY);

          ctx.font = `500 36px ${canvasFontFamily}`;
          if (selectedFont.id === 'caveat') {
            ctx.font = `600 52px ${canvasFontFamily}`;
          }
          ctx.fillText(noteDate, w / 2, dateY);
        } else {
          // Viewfinder HUD graphics drawn on top of the image (starts at x=75, y=90, width=760, height=500)
          ctx.save();
          // Subtle screen glossy highlight shine overlay
          const gl = ctx.createLinearGradient(75, 90, 75 + 760, 90 + 500);
          gl.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
          gl.addColorStop(0.3, 'rgba(255, 255, 255, 0.03)');
          gl.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
          gl.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gl;
          ctx.fillRect(75, 90, 760, 500);

          // 1. Central focus crop bounds in soft cyan
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)'; 
          ctx.lineWidth = 3.5;
          const fx = 75 + 760 / 2;
          const fy = 90 + 500 / 2;
          ctx.strokeRect(fx - 40, fy - 40, 80, 80);
          ctx.beginPath();
          ctx.moveTo(fx - 15, fy); ctx.lineTo(fx + 15, fy);
          ctx.moveTo(fx, fy - 15); ctx.lineTo(fx, fy + 15);
          ctx.stroke();

          // 2. Battery status icon
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(740, 110, 35, 18);
          ctx.fillStyle = '#22c55e'; // fully charged green battery
          ctx.fillRect(743, 113, 10, 12);
          ctx.fillRect(755, 113, 10, 12);
          ctx.fillRect(767, 113, 5, 12);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillRect(775, 115, 3, 8); // battery tip

          // 3. REC Blinking dot inside Viewfinder on top left
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(110, 120, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = 'bold 16px "Space Grotesk", sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('REC ●', 125, 120);

          ctx.fillText('12MP [FINE]', 110, 150);
          ctx.fillText('⚡ AUTO', 710, 150);
          ctx.fillText('F2.8  1/125s', 110, 550);
          ctx.fillText('[1.5x]', 745, 550);
          ctx.restore();

          // Inside horizontal camera, overlay dynamic timestamp inside LCD viewport instead (as real digital camera print!)
          ctx.save();
          ctx.fillStyle = '#f59e0b'; // beautiful bright amber quartz
          ctx.shadowColor = '#d97706';
          ctx.shadowBlur = 6;
          ctx.font = 'bold 30px "JetBrains Mono", monospace';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          
          const displayDate = noteDate || new Date().toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
          ctx.fillText(displayDate, 815, 555);
          ctx.restore();
        }

        // Draw Stickers
        stickers.forEach(sticker => {
          ctx.save();
          
          // Map percentage x,y to absolute pixel coordinates
          const absX = (sticker.x / 100) * w;
          const absY = (sticker.y / 100) * h;

          ctx.translate(absX, absY);
          ctx.rotate((sticker.rotation * Math.PI) / 180);
          
          // Compute font rating based on scale state
          const emojiFontSize = Math.floor(74 * sticker.scale);
          ctx.font = `${emojiFontSize}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          ctx.fillText(sticker.emoji, 0, 0);
          ctx.restore();
        });

        // Resolve static compiled string
        const finalUrl = canvas.toDataURL('image/jpeg', 0.92);
        setIsGenerating(false);
        resolve(finalUrl);
      }).catch(err => {
        setIsGenerating(false);
        reject(err);
      });
    });
  };

  const handleDownload = async () => {
    try {
      const dataUrl = await generateHighResRender();
      
      const link = document.createElement('a');
      link.download = `photobooth-print-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();

      // Set compiled image URL to open manual save/share fallback popup modal
      setCompiledStripUrl(dataUrl);

      playBeep(600, 0.2, 'sine');
    } catch (e) {
      alert('Generation error: ' + e);
    }
  };

  const handlePrint = async (directUrl?: string) => {
    try {
      const url = directUrl || (await generateHighResRender());
      const win = window.open();
      if (!win) {
        alert('Could not launch printing tab. Please confirm popup blockers are off.');
        return;
      }
      
      win.document.write(`
        <html>
          <head>
            <title>Print Photobooth Film</title>
            <style>
              body {
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #f7f7f7;
                font-family: system-ui;
              }
              img {
                max-width: 100%;
                max-height: 98vh;
                object-contain: fit;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              }
              @media print {
                body { background: white; }
                img { box-shadow: none; max-height: 100vh; }
              }
            </style>
          </head>
          <body>
            <img src="${url}" onload="window.print()" />
          </body>
        </html>
      `);
      win.document.close();
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to quickly fill standard aesthetic photos with safe, CORS-free canvas beautiful gradient vectors
  const populateMockMemories = () => {
    const mockImages = [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fbcfe8"/><stop offset="100%" stop-color="%23fde047"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g1)"/><circle cx="300" cy="225" r="120" fill="%23f43f5e" opacity="0.35"/><path d="M0,350 Q150,300 300,380 T600,340 L600,450 L0,450 Z" fill="%23fda4af" opacity="0.65"/></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ccfbf1"/><stop offset="100%" stop-color="%2338bdf8"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g2)"/><path d="M 100,50 Q 300,200 500,80" stroke="%2322d3ee" stroke-width="30" fill="none" opacity="0.4" stroke-linecap="round"/><circle cx="450" cy="150" r="40" fill="%23fff" opacity="0.7"/><path d="M0,320 Q200,400 400,300 T600,380 L600,450 L0,450 Z" fill="%230284c7" opacity="0.65"/></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23e879f9"/><stop offset="100%" stop-color="%23312e81"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g3)"/><circle cx="150" cy="150" r="50" fill="%23fef08a" opacity="0.6"/><path d="M0,380 L200,200 L400,390 L600,250 L600,450 L0,450 Z" fill="%231e1b4b" opacity="0.75"/></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fef3c7"/><stop offset="100%" stop-color="%23f472b6"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g4)"/><circle cx="300" cy="180" r="70" fill="%23fcd34d" opacity="0.5"/><path d="M0,360 Q300,290 600,360 L600,450 L0,450 Z" fill="%23db2777" opacity="0.5"/></svg>',
    ];

    setSlots(prev => prev.map((s, idx) => ({
      ...s,
      src: mockImages[idx] || mockImages[0],
      filter: idx === 1 ? 'bw' : idx === 2 ? 'sepia' : 'none'
    })));
    playBeep(520, 0.12, 'sine');
  };

  // ----------------------------------------------------
  // Layout preview ratios & visual classes
  // ----------------------------------------------------
  const getLayoutAspectClass = () => {
    if (layout === 'strip') return 'aspect-[1/2.8] max-h-[72vh] sm:max-h-[75vh]';
    if (layout === 'grid') return 'aspect-[3/4] max-h-[64vh] w-full max-w-[420px]';
    if (selectedFrame.theme === 'camera') return 'aspect-[1.8/1] max-h-[50vh] w-full max-w-[500px] sm:max-w-[560px]';
    return 'aspect-[4/5] max-h-[60vh] w-full max-w-[420px]';
  };

  return (
    <div id="app-root" className="min-h-screen bg-stone-100/30 flex flex-col selection:bg-rose-100 selection:text-rose-950 pb-12 relative overflow-hidden font-sans">
      
      {/* 🌸 FULL-SCREEN HERO SECTION WITH SCROLLING PHOTOBOOTH LANDSCAPE 🌸 */}
      <section id="hero-section" className="h-screen w-full relative overflow-hidden flex flex-col justify-between select-none shrink-0 z-10 border-b border-rose-100/25 bg-sky-100">
        {/* Looping background landscape */}
        <div 
          className="absolute inset-0 z-0 animate-cute-bg-scroll opacity-[0.95] pointer-events-none" 
          style={{ 
            backgroundImage: `url(${heroBgImage})`,
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'center 45%'
          }} 
        />
        {/* Soft atmospheric radial gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-100 via-white/15 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(244,63,94,0.04)_70%)] z-10 pointer-events-none" />

        {/* Top Floating Branding */}
        <div className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between relative z-20">
          <div className="flex items-center gap-2">
            <AmHeartLogo sizeClassName="w-10 h-10" />
            <span 
              className="bg-gradient-to-r from-rose-600 via-pink-600 to-orange-500 bg-clip-text text-transparent font-medium tracking-wide"
              style={{ fontFamily: "'Great Vibes', cursive", fontSize: '22px' }}
            >
              CaptureBooth
            </span>
          </div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-stone-605 font-bold bg-white/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/40 shadow-2xs">
            🌸 Spring Edition
          </div>
        </div>

        {/* Center Glass Card */}
        <div className="flex-1 flex items-center justify-center px-4 relative z-20">
          <div className="glass-contrast max-w-lg w-full rounded-3xl p-6 sm:p-8 text-center shadow-xl border border-white/65 space-y-4 transform hover:scale-[1.01] transition-transform duration-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-650 font-bold text-[10px] tracking-widest uppercase font-mono">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Choose Cute Fonts & Styles
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
              Create Cute Memories <br />
              <span className="bg-gradient-to-r from-rose-600 via-pink-500 to-orange-500 bg-clip-text text-transparent animate-pulse">In Our Capture Booth</span>
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Step into our digital photoland. Select pastel frame themes, play around with whimsical stickers, write custom captions in adorable bubble fonts, and download your customized strips instantly.
            </p>
            <div className="pt-2">
              <button
                id="enter-booth-cta"
                onClick={() => {
                  playBeep(880, 0.08);
                  document.getElementById('main-header')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-xs bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 active:scale-95 transition-all w-full sm:w-auto cursor-pointer"
              >
                <span>Step Into The Booth</span>
                <Camera className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Prompter */}
        <div className="w-full text-center pb-8 relative z-20 flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold font-mono">
            Scroll down to design
          </span>
          <div 
            onClick={() => document.getElementById('main-header')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-8 h-8 rounded-full bg-white/70 border border-white/60 shadow-xs flex items-center justify-center hover:bg-white active:scale-90 transition-all cursor-pointer animate-bounce"
          >
            <span className="text-stone-600 text-sm">↓</span>
          </div>
        </div>
      </section>

      {/* Exquisite Floating Liquid Mesh Gradient Blobs for Glassmorphism backdrop */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-sky-200/30 rounded-full filter blur-[125px] animate-float-1 pointer-events-none z-0"></div>
      <div className="absolute top-[30%] -right-40 w-[550px] h-[550px] bg-rose-250/20 rounded-full filter blur-[110px] animate-float-2 pointer-events-none z-0" style={{ animationDelay: '3s' }}></div>
      <div className="absolute -bottom-40 left-[25%] w-[700px] h-[700px] bg-amber-200/25 rounded-full filter blur-[140px] animate-float-3 pointer-events-none z-0" style={{ animationDelay: '6s' }}></div>

      {/* Dynamic Header */}
      <header id="main-header" className="border-b border-white/30 bg-white/45 backdrop-blur-md shadow-xs py-4 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AmHeartLogo sizeClassName="w-8.5 h-8.5" />
            <span 
              className="bg-gradient-to-r from-rose-600 via-pink-600 to-orange-500 bg-clip-text text-transparent font-medium tracking-wide"
              style={{ fontFamily: "'Great Vibes', cursive", fontSize: '22px' }}
            >
              CaptureBooth
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick action mock filler */}
            <button
              id="mock-quick-load"
              onClick={populateMockMemories}
              className="px-3 py-1.5 glass-button-inactive text-[10px] font-mono font-bold rounded-lg transition-all"
              title="Quickly populate placeholders"
            >
              ⚡ DEV QUICK LOAD
            </button>
          </div>
        </div>
      </header>

      {/* Main Core Workstation */}
      <main id="photobooth-workspace" className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
        
        {/* LEFT COLUMN: Controls custom panel (Colspan 5) */}
        <div id="controls-section" className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
          
          {/* Tabs switch panel toolbar */}
          <div className="flex bg-white/45 backdrop-blur-md border border-white/30 p-1.5 rounded-2xl gap-1 shadow-xs">
            <button
              id="tab-design"
              onClick={() => { setActiveControlTab('design'); playBeep(520, 0.04); }}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl font-medium transition-all ${
                activeControlTab === 'design'
                  ? 'bg-rose-500 text-white font-bold text-xs shadow-xs border border-rose-450/20'
                  : 'text-stone-600 bg-transparent hover:bg-white/40 hover:text-stone-900 text-xs'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Border</span>
            </button>

            <button
              id="tab-photos"
              onClick={() => { setActiveControlTab('photos'); playBeep(520, 0.04); }}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl font-medium transition-all ${
                activeControlTab === 'photos'
                  ? 'bg-rose-500 text-white font-bold text-xs shadow-xs border border-rose-450/20'
                  : 'text-stone-600 bg-transparent hover:bg-white/40 hover:text-stone-900 text-xs'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Photos</span>
            </button>

            <button
              id="tab-text"
              onClick={() => { setActiveControlTab('text'); playBeep(520, 0.04); }}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl font-medium transition-all ${
                activeControlTab === 'text'
                  ? 'bg-rose-500 text-white font-bold text-xs shadow-xs border border-rose-450/20'
                  : 'text-stone-600 bg-transparent hover:bg-white/40 hover:text-stone-900 text-xs'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Text</span>
            </button>

            <button
              id="tab-stickers"
              onClick={() => { setActiveControlTab('stickers'); playBeep(520, 0.04); }}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl font-medium transition-all ${
                activeControlTab === 'stickers'
                  ? 'bg-rose-500 text-white font-bold text-xs shadow-xs border border-rose-450/20'
                  : 'text-stone-600 bg-transparent hover:bg-white/40 hover:text-stone-900 text-xs'
              }`}
            >
              <Smile className="w-4 h-4" />
              <span>Sticker</span>
            </button>
          </div>

          {/* Active Tab Configuration Box */}
          <div className="glass-contrast rounded-3xl p-5 sm:p-6 text-slate-800 space-y-4">
            
            {/* TAB 1: DESIGN & FORMAT */}
            {activeControlTab === 'design' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono mb-2">1. Layout Style</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'strip', title: 'Film Strip', format: 'Vertical (4 Photos)' },
                      { id: 'single', title: 'Single Pic', format: 'Polaroid style' },
                      { id: 'grid', title: '2x2 Grid', format: 'Compact (4 layout)' }
                    ].map((lay) => (
                      <button
                        id={`layout-selector-${lay.id}`}
                        key={lay.id}
                        onClick={() => { 
                          const newLay = lay.id as LayoutType;
                          setLayout(newLay); 
                          if (newLay !== 'single' && selectedFrame.theme === 'camera') {
                            setSelectedFrame(FRAMES[0]);
                          }
                          playBeep(640, 0.06); 
                        }}
                        className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between h-24 ${
                          layout === lay.id
                            ? 'border-rose-500 bg-rose-500/10 text-rose-950 font-bold'
                            : 'border-white/30 hover:border-white/50 bg-white/20 hover:bg-white/40 text-stone-650'
                        }`}
                      >
                        <span className="text-xs">{lay.title}</span>
                        <span className="text-[9px] font-mono leading-tight block text-stone-400">{lay.format}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono mb-2">2. Premium Frame Styles</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {FRAMES.map((f) => (
                      <button
                        id={`frame-style-${f.id}`}
                        key={f.id}
                        onClick={() => {
                          setSelectedFrame(f);
                          setUseCustomColor(false);
                          if (f.theme === 'camera') {
                            setLayout('single');
                          }
                          playBeep(640, 0.05);
                        }}
                        style={{ borderLeftColor: f.borderColor }}
                        className={`p-3 rounded-xl border-l-4 text-left border transition-all ${
                          selectedFrame.id === f.id && !useCustomColor
                            ? 'bg-white/70 border-white/45 ring-2 ring-rose-450/85 font-bold'
                            : 'bg-white/25 border-white/20 text-stone-600 hover:bg-white/40'
                        }`}
                      >
                        <p className="text-xs">{f.name}</p>
                        <span className="text-[9px] font-mono uppercase bg-white/50 text-stone-500 px-1 rounded block w-max mt-1">{f.theme}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🎨 3. Group Filter Control - Below Frame Styles */}
                <div className="pt-3 border-t border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono">3. Quick Photo Filters (All)</h3>
                    </div>
                    {getCommonFilter() === null && (
                      <span className="text-[8px] font-mono text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-200/50 uppercase tracking-wider font-extrabold animate-pulse">Mixed</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto pr-1 pb-1 scrollbar-thin scrollbar-thumb-stone-200/60 font-mono">
                    {FILTERS.map((f) => {
                      const isSelected = getCommonFilter() === f.id;
                      return (
                        <button
                          id={`global-design-filter-${f.id}`}
                          key={f.id}
                          onClick={() => applyFilterToAllSlots(f.id)}
                          className={`py-1.5 px-2 rounded-xl text-[10px] whitespace-nowrap border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-rose-500/10 text-rose-600 border-rose-300 font-bold shadow-xs'
                              : 'bg-white/30 text-stone-650 border-white/20 hover:border-stone-300/50 hover:bg-white/55 shadow-3xs'
                          }`}
                        >
                          <div 
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-3xs"
                            style={{ 
                              filter: f.filter,
                              background: 'linear-gradient(135deg, #f43f5e 0%, #3b82f6 50%, #eab308 100%)'
                            }}
                          />
                          <span className="truncate">{f.name.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Border Styling Color Override */}
                <div className="pt-3 border-t border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono">4. Custom Border Wash</span>
                    <button
                      id="reset-frame-style"
                      onClick={() => setUseCustomColor(!useCustomColor)}
                      className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-mono border transition-all ${
                        useCustomColor ? 'bg-amber-100/60 border-amber-300 text-amber-900 font-bold' : 'bg-white/25 border-white/20 text-stone-400 hover:text-stone-700 hover:bg-white/45'
                      }`}
                    >
                      {useCustomColor ? 'CUSTOM ON' : 'PRESETS ONLY'}
                    </button>
                  </div>
                  
                  {useCustomColor && (
                    <div className="bg-white/40 backdrop-blur-sm p-3.5 rounded-2xl border border-white/25 space-y-3">
                      <div>
                        <label className="text-[10px] font-mono text-stone-500 block mb-1">Pick Custom Frame Color:</label>
                        <div className="flex items-center gap-2">
                          <input
                            id="custom-frame-color-input"
                            type="color"
                            value={customFrameColor}
                            onChange={(e) => setCustomFrameColor(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-white/40 bg-transparent focus:outline-none"
                          />
                          <input
                            id="custom-frame-color-text"
                            type="text"
                            value={customFrameColor}
                            onChange={(e) => setCustomFrameColor(e.target.value)}
                            className="flex-1 py-1.5 px-2.5 text-xs font-mono bg-white/50 border border-white/30 rounded-lg outline-none text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-stone-500 block mb-1">Custom Text Ink Color:</label>
                        <div className="flex items-center gap-2">
                          <input
                            id="custom-ink-color-input"
                            type="color"
                            value={noteColor}
                            onChange={(e) => setNoteColor(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-white/40 bg-transparent focus:outline-none"
                          />
                          <input
                            id="custom-ink-color-text"
                            type="text"
                            value={noteColor}
                            onChange={(e) => setNoteColor(e.target.value)}
                            className="flex-1 py-1.5 px-2.5 text-xs font-mono bg-white/50 border border-white/30 rounded-lg outline-none text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PHOTOS & CAM */}
            {activeControlTab === 'photos' && (
              <div className="space-y-4 animate-fade-in">
                {/* 💡 Friendly Interactive Filter Finder Banner */}
                <div id="filter-hint-banner" className="bg-gradient-to-br from-rose-50/70 to-pink-50/50 border border-rose-100 p-3 rounded-2xl flex gap-2.5 text-stone-700 shadow-3xs">
                  <span className="text-xl shrink-0">🎨</span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">Choose Aesthetic Filters</p>
                    <p className="text-[10px] leading-relaxed text-stone-500">
                      Tap the <b>✨ FILTER</b> button on any uploaded photo below to apply gorgeous effects like <b>Classic Black & White</b>, <b>Expired Film</b>, or <b>Indie Gold</b>!
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono">My Film Sprites</h3>
                  <span className="text-[10px] font-mono py-0.5 px-2.5 rounded-full bg-white/55 text-stone-600 border border-white/20">
                    {slots.filter(s => s.src).length} / {slots.length} UPLOADED
                  </span>
                </div>

                <div className="space-y-2.5">
                  {slots.map((sl) => (
                    <div
                      id={`photo-selector-row-${sl.id}`}
                      key={sl.id}
                      onClick={() => {
                        if (sl.src) {
                          setActiveSlotId(activeSlotId === sl.id ? null : sl.id);
                        } else {
                          triggerUploadForSlot(sl.id);
                        }
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        activeSlotId === sl.id
                          ? 'border-rose-400 bg-rose-500/10 shadow-xs'
                          : 'border-white/25 bg-white/20 hover:bg-white/45'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          {/* Circle Avatar or Placeholder */}
                          {sl.src ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/30 bg-white/20 relative group shrink-0 shadow-2xs">
                              <img
                                src={sl.src}
                                alt="slot micro"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-dashed border-stone-300 bg-white/30 flex items-center justify-center text-xs text-stone-400 font-mono font-bold shrink-0">
                              {sl.id}
                            </div>
                          )}
                          
                          <div>
                            <p className="text-xs font-bold text-slate-800">Photo Frame Box {sl.id}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-mono text-stone-500">
                                {sl.src ? 'Populated' : 'Awaiting Input'}
                              </span>
                              {sl.src && (
                                <span className="text-[8px] font-mono font-extrabold bg-rose-500/10 text-rose-600 border border-rose-200/50 py-0.5 px-1.5 rounded-md uppercase tracking-wider">
                                  ✨ {FILTERS.find(f => f.id === sl.filter)?.name.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '') || 'Normal'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Interactive operations */}
                        <div className="flex items-center gap-1.5">
                          {/* Dedicated, high-discoverability Filter trigger button */}
                          {sl.src && (
                            <button
                              id={`filter-trigger-btn-${sl.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSlotId(activeSlotId === sl.id ? null : sl.id);
                                playBeep(560, 0.05, 'sine');
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-extrabold shadow-3xs border transition-all flex items-center gap-1 cursor-pointer ${
                                activeSlotId === sl.id
                                  ? 'bg-rose-500 text-white border-rose-400 font-black'
                                  : 'bg-white/70 hover:bg-white text-rose-600 border-rose-200 hover:border-rose-300'
                              }`}
                              title="Filters and adjustments"
                            >
                              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                              <span>FILTER</span>
                            </button>
                          )}

                          {/* File input */}
                          <button
                            id={`upload-slot-btn-${sl.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerUploadForSlot(sl.id);
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold bg-white/45 border border-white/30 hover:border-white/55 hover:bg-white text-stone-650 hover:text-stone-900 shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                            title="Upload photo"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{!sl.src ? 'UPLOAD' : 'REPLACE'}</span>
                          </button>

                          {/* Delete */}
                          {sl.src && (
                            <button
                              id={`clear-slot-btn-${sl.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                removePhotoFromSlot(sl.id);
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-2xs cursor-pointer"
                              title="Clear Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expand alignment tuning nested if selected */}
                      {activeSlotId === sl.id && sl.src && (
                        <div className="mt-3 pt-3 border-t border-dashed border-white/30" onClick={(e) => e.stopPropagation()}>
                          <SlotAdjustments
                            slot={sl}
                            onUpdate={(fields) => updateSlot(sl.id, fields)}
                            onRemove={() => removePhotoFromSlot(sl.id)}
                            onClose={() => setActiveSlotId(null)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CUSTOM SIGNATURES & TYPOGRAPHY */}
            {activeControlTab === 'text' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono mb-2">1. Photo Strip Caption</h3>
                  <div className="relative">
                    <input
                      id="note-text-caption-input"
                      type="text"
                      maxLength={32}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="ENTER MEMORIES NOTE"
                      className="w-full py-2.5 px-3.5 text-sm glass-input rounded-xl outline-none transition-all pr-12 text-slate-800"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-stone-500">
                      {noteText.length}/32
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono mb-2">2. Stamp Date</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      id="note-date-stamp-input"
                      type="text"
                      value={noteDate}
                      onChange={(e) => setNoteDate(e.target.value)}
                      placeholder="E.G. JUNE 11, 2026"
                      className="py-2.5 px-3.5 text-xs font-mono glass-input rounded-xl outline-none text-slate-800"
                    />
                    
                    <button
                      id="stamp-today-date"
                      onClick={() => {
                        const today = new Date();
                        setNoteDate(today.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }).toUpperCase());
                        playBeep(640, 0.04);
                      }}
                      className="py-2.5 px-3 glass-button-inactive font-bold rounded-xl text-stone-650 hover:text-stone-900 transition-all font-mono text-[10px]"
                    >
                      RESET TO TODAY
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono mb-2">3. Elegant Typography</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {FONTS.map((font) => (
                      <button
                        id={`font-option-${font.id}`}
                        key={font.id}
                        onClick={() => { setSelectedFont(font); playBeep(640, 0.05); }}
                        style={{ fontFamily: font.family }}
                        className={`p-3 rounded-xl border text-left h-20 flex flex-col justify-between transition-all ${
                          selectedFont.id === font.id
                            ? 'border-rose-400 bg-rose-500/10 font-bold shadow-xs'
                            : 'border-white/20 hover:border-white/40 bg-white/25 hover:bg-white/40 text-stone-700'
                        }`}
                      >
                        <span className="text-[10px] text-stone-400 font-mono block">Aa</span>
                        <span className="text-xs truncate block">{font.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: FUN STICKERS OVERLAY */}
            {activeControlTab === 'stickers' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono">1. Tap to add sticker</h3>
                    {stickers.length > 0 && (
                      <button
                        id="clear-all-stickers-btn"
                        onClick={clearAllStickers}
                        className="text-[10px] font-mono text-rose-500 hover:underline font-bold"
                      >
                        WIPE STICKERS ({stickers.length})
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {EMOS.map((emoji) => (
                      <button
                        id={`sticker-add-${emoji}`}
                        key={emoji}
                        onClick={() => addStickerToStrip(emoji)}
                        className="p-2.5 border border-white/25 hover:border-rose-300 rounded-xl bg-white/25 hover:bg-white/50 text-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xs"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {stickers.length > 0 && (
                  <div className="border-t border-white/20 pt-3.5">
                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-stone-400 font-mono mb-2">
                      Active Sticker layer controls
                    </h4>
                    
                    {activeStickerId ? (
                      <div className="bg-rose-500/10 backdrop-blur-xs border border-rose-100/50 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {stickers.find(s => s.id === activeStickerId)?.emoji}
                          </span>
                          <div>
                            <p className="text-[11px] font-bold text-rose-950 font-mono">SELECTED STICKER</p>
                            <p className="text-[9px] text-stone-500 font-mono">Drag on frame or adjust scale</p>
                          </div>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          <button
                            id="sticker-scale-down"
                            onClick={() => {
                              const s = stickers.find(st => st.id === activeStickerId);
                              if (s) {
                                updateSticker(activeStickerId, { scale: Math.max(0.4, s.scale - 0.2) });
                              }
                            }}
                            className="p-2 bg-white/60 hover:bg-white rounded-lg text-xs font-mono font-bold text-stone-700 border border-white/50 shadow-2xs"
                            title="scale down"
                          >
                            -
                          </button>
                          <button
                            id="sticker-scale-up"
                            onClick={() => {
                              const s = stickers.find(st => st.id === activeStickerId);
                              if (s) {
                                updateSticker(activeStickerId, { scale: Math.min(4.0, s.scale + 0.2) });
                              }
                            }}
                            className="p-2 bg-white/60 hover:bg-white rounded-lg text-xs font-mono font-bold text-stone-700 border border-white/50 shadow-2xs"
                            title="scale up"
                          >
                            +
                          </button>
                          <button
                            id="sticker-remove-active"
                            onClick={() => removeSticker(activeStickerId)}
                            className="p-2 bg-rose-500/20 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors shadow-2xs"
                            title="delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-stone-550 font-mono italic text-center py-2">
                        Tap any sticker inside the strip preview above to edit scales and rotations.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Core Master Operation Line */}
          <div className="flex flex-col gap-2.5">
            <button
              id="master-download"
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-orange-500 text-white font-black tracking-widest rounded-2xl shadow-md active:translate-y-0.5 flex items-center justify-center gap-2 text-xs uppercase transition-all disabled:opacity-50 hover:scale-[1.01]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>COMPILING...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 animate-bounce text-white" />
                  <span>Download Strip</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Print layout block */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/20 text-stone-550">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-stone-600" />
              <div className="text-[10px] leading-tight font-mono text-stone-500">
                <span>Want a real physical print?</span>
                <span className="block text-stone-400">Fits standard photo cardstock papers.</span>
              </div>
            </div>
            <button
              id="quick-print-layout"
              onClick={() => handlePrint()}
              className="px-3.5 py-1.5 border border-white/30 hover:border-white/55 bg-white/55 hover:bg-white text-[10px] font-bold text-stone-700 rounded-xl transition-all font-mono shadow-2xs"
            >
              PRINT FILM
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Real-Time Interactive Design Preview Workspace (Colspan 7) */}
        <div id="preview-workspace" className="lg:col-span-7 flex flex-col items-center justify-center bg-white/30 backdrop-blur-md p-4 sm:p-8 rounded-3xl border border-white/25 shadow-xl min-h-[50vh] sm:min-h-[80vh] relative">
          
          <div className="absolute top-4 left-6 flex items-center gap-1.5">
            <Maximize className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-mono text-[10px] text-stone-400 tracking-wider">LIVE_RETINA_PREVIEW</span>
          </div>

          {/* Interactive Frame Box Canvas */}
          <div
            ref={previewContainerRef}
            id="photobooth-interactive-preview"
            onClick={() => setActiveStickerId(null)} // deselect sticker on canvas tap
            className={`relative flex flex-col items-center justify-between transition-all overflow-hidden cursor-default selection:bg-transparent ${getLayoutAspectClass()} w-full select-none`}
            style={{
              backgroundColor: customFrameColor,
              color: noteColor,
              fontFamily: selectedFont.family,
              boxShadow: !useCustomColor && selectedFrame.theme === 'classic'
                ? '0 30px 80px -15px rgba(28,25,23,0.38), 0 3px 14px rgba(28,25,23,0.12), inset 0 1.5px 1px rgba(255,255,255,0.95)'
                : '0 25px 50px -12px rgba(0,0,0,0.25)',
              borderRadius: !useCustomColor && selectedFrame.theme === 'classic'
                ? '6px'
                : layout === 'strip' ? '32px' : '24px',
              backgroundImage: !useCustomColor && selectedFrame.theme === 'classic'
                ? 'radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(245,243,235,0.2) 100%), url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.035\'/%3E%3C/svg%3E")'
                : !useCustomColor && selectedFrame.theme === 'filmstar' 
                ? `url(${frameFilmstarBg})` 
                : !useCustomColor && selectedFrame.theme === 'scrapbook' 
                ? `url(${frameScrapbookBg})` 
                : undefined,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
            }}
          >
            
            {/* Thematic Decor Rails for Screen Preview */}
            {!useCustomColor && selectedFrame.theme === 'retro' && (
              <>
                {/* Left retro rail sprocket strip */}
                <div className="absolute left-0 top-0 bottom-0 w-[6%] bg-[#121212] z-10 flex flex-col justify-around py-4">
                  {Array.from({ length: layout === 'strip' ? 14 : 7 }).map((_, i) => (
                    <div key={i} className="w-[50%] aspect-square mx-auto bg-stone-850 border border-stone-750/30 rounded-xs flex flex-col items-center justify-center">
                      <div className="w-[70%] h-[55%] bg-stone-900 border border-zinc-950 rounded-sm"></div>
                    </div>
                  ))}
                </div>
                {/* Right retro rail sprocket strip */}
                <div className="absolute right-0 top-0 bottom-0 w-[6%] bg-[#121212] z-10 flex flex-col justify-around py-4">
                  {Array.from({ length: layout === 'strip' ? 14 : 7 }).map((_, i) => (
                    <div key={i} className="w-[50%] aspect-square mx-auto bg-stone-850 border border-stone-750/30 rounded-xs flex flex-col items-center justify-center">
                      <div className="w-[70%] h-[55%] bg-stone-900 border border-zinc-950 rounded-sm"></div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Custom Flower Decors for Screen Preview */}
            {!useCustomColor && selectedFrame.theme === 'pastel' && (
              <div className="absolute inset-4 border border-rose-350/20 pointer-events-none rounded-xl z-30">
                <span className="absolute top-2 left-2 text-base select-none">🌸</span>
                <span className="absolute top-2 right-2 text-base select-none">✨</span>
              </div>
            )}

            {/* Custom overlays for Filmstar and Scrapbook frame themes */}
            {!useCustomColor && selectedFrame.theme === 'filmstar' && (
              <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden">
                {/* Beautiful glowing stars to match silver puffy balloons in design */}
                <div className="absolute top-[8%] left-[2%] text-2xl -rotate-12 animate-pulse filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">⭐</div>
                <div className="absolute top-[28%] left-[1.5%] text-xl rotate-12 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">✨</div>
                <div className="absolute top-[6%] right-[2%] text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">⚡</div>
                <div className="absolute bottom-[28%] right-[2%] text-lg rotate-45 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">✨</div>
                <div className="absolute bottom-[20%] left-[2.5%] text-lg -rotate-45 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">⭐</div>
                {/* Film labeling stamps */}
                <span className="absolute bottom-[4%] left-[1.5%] font-mono text-[7px] font-black text-amber-500/80 uppercase tracking-widest leading-none">ISO 400</span>
                <span className="absolute bottom-[4%] right-[1.5%] font-mono text-[7px] font-black text-amber-505/80 uppercase tracking-widest leading-none">KODAK 3A</span>
              </div>
            )}

            {!useCustomColor && selectedFrame.theme === 'scrapbook' && (
              <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden">
                {/* Lush floral blossom items in corners */}
                <span className="absolute top-[2%] left-[2%] text-2xl -rotate-12 select-none filter drop-shadow-md">🌺</span>
                <span className="absolute top-[3%] right-[3%] text-xl rotate-[15deg] select-none filter drop-shadow-md">🌸</span>
                <span className="absolute bottom-[18%] right-[2%] text-2xl rotate-45 select-none filter drop-shadow-md">🌺</span>
                <span className="absolute bottom-[2%] left-[3%] text-xl -rotate-12 select-none filter drop-shadow-md">💮</span>
              </div>
            )}

            {/* Camera Style Casing and Control Elements (for Y2K Retro Camera) */}
            {!useCustomColor && selectedFrame.theme === 'camera' && (
              <div className="absolute inset-0 pointer-events-none z-10 select-none overflow-hidden bg-[#f7f4eb]">
                {/* Vintage Rose backdrop patterns */}
                <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f43f5e 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                <span className="absolute top-[6%] left-[6%] text-sm opacity-30 select-none">🌸</span>
                <span className="absolute bottom-[6%] right-[6%] text-sm opacity-30 select-none">🌸</span>
                <span className="absolute top-[20%] right-[32%] text-[10px] opacity-20 select-none">🌸</span>
                <span className="absolute bottom-[20%] left-[32%] text-[10px] opacity-20 select-none">🌸</span>

                {/* Torn paper decorative backing (bottom-left) */}
                <div className="absolute bottom-[-15px] left-[-15px] w-[130px] h-[110px] bg-[#d5c8b5] rotate-[-12deg] rounded-tr-xl border border-[#bfae99] opacity-95 shadow-md flex items-center justify-center">
                  <div className="w-[85%] h-[85%] border border-[#c3b19b] border-dashed rounded-xs rounded-tr-xs" />
                </div>

                {/* Camera Body Box Chassis */}
                <div className="absolute left-[2%] top-[3%] right-[2%] bottom-[3%] bg-[#312d2c] rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.15)] border-[5px] border-stone-800 z-10">
                  
                  {/* Top Silver Metallic Plate */}
                  <div className="absolute left-0 top-0 right-0 h-[14%] bg-gradient-to-b from-stone-100 via-stone-200 to-stone-300 border-b border-stone-400/80 rounded-t-[1.7rem] px-5 flex items-center justify-between">
                    {/* Viewfinder Window */}
                    <div className="w-[66px] h-[28px] bg-stone-900 border border-stone-400/60 rounded-md absolute left-[10%] top-[20%] flex items-center justify-center overflow-hidden shadow-inner">
                      <div className="w-[85%] h-[85%] rounded-[3px] bg-gradient-to-br from-cyan-400 to-indigo-950 opacity-90 relative">
                        <div className="absolute top-1 left-2 w-full h-[1.5px] bg-white/40 rotate-[35deg]" />
                      </div>
                    </div>

                    {/* Self-Timer LED blinker */}
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-stone-950 absolute left-[21%] top-[34%] shadow-[0_0_6px_#ef4444]" />

                    {/* Center Brand Text */}
                    <div className="mx-auto text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest text-stone-600 font-sans italic">
                      SuperShot <span className="text-stone-550 font-normal">Y2K</span>
                    </div>

                    {/* Corner Screw rivets */}
                    <div className="absolute top-2 left-2.5 w-1.5 h-1.5 bg-gradient-to-br from-white to-stone-400 border border-stone-600 rounded-full flex items-center justify-center">
                      <div className="w-1 h-[0.5px] bg-stone-850" />
                    </div>
                    <div className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-gradient-to-br from-white to-stone-400 border border-stone-600 rounded-full flex items-center justify-center">
                      <div className="w-1 h-[0.5px] bg-stone-850" />
                    </div>
                  </div>

                  {/* Bottom Silver Metallic Plate */}
                  <div className="absolute left-0 bottom-0 right-0 h-[12%] bg-gradient-to-t from-stone-100 via-stone-200 to-stone-300 border-t border-stone-400/80 rounded-b-[1.7rem] px-5 flex items-center justify-between">
                    <div className="text-[6.5px] font-mono tracking-wide text-stone-500 font-bold">12.1 MP • F/2.8 WIDE LENS</div>
                    <div className="text-[6.5px] font-mono tracking-wide text-stone-500 font-bold">3.0" HYBRID LCD SYSTEM</div>
                    {/* Corner Screw rivets */}
                    <div className="absolute bottom-2 left-2.5 w-1.5 h-1.5 bg-gradient-to-br from-white to-stone-400 border border-stone-600 rounded-full flex items-center justify-center">
                      <div className="w-1 h-[0.5px] bg-stone-850" />
                    </div>
                    <div className="absolute bottom-2 right-2.5 w-1.5 h-1.5 bg-gradient-to-br from-white to-stone-400 border border-stone-600 rounded-full flex items-center justify-center">
                      <div className="w-1 h-[0.5px] bg-stone-850" />
                    </div>
                  </div>

                  {/* Rich textured pebble leatherette pattern for middle body frame area */}
                  <div className="absolute top-[14%] bottom-[12%] left-0 right-0 bg-[#2b2726] bg-[radial-gradient(#3a3433_1px,transparent_1px)] bg-[size:3px_3px]" />

                  {/* LCD Screen Outer Bezel Housing */}
                  <div className="absolute left-[5.25%] top-[12.24%] w-[65.33%] h-[75.53%] bg-[#100f0f] border-[3px] border-stone-900 rounded-2xl shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)] z-0" />
                  
                  {/* Right side controls panel */}
                  <div className="absolute right-[3%] top-[16%] bottom-[14%] w-[23%] flex flex-col justify-between items-center z-20">
                    
                    {/* Speaker Grille dots */}
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-stone-950 rounded-full shadow-[inset_0_1px_1px_rgba(0,0,0,0.6)]" />
                      ))}
                    </div>

                    {/* W/T Zoom Slider Controller */}
                    <div className="flex flex-col items-center gap-0.5 mt-2">
                      <div className="text-[6px] font-black text-stone-400 font-mono tracking-wide">ZOOM W T</div>
                      <div className="w-12 h-5 bg-gradient-to-b from-stone-350 to-stone-200 rounded-md border border-stone-600 flex items-center justify-between px-1 shadow-xs pointer-events-auto cursor-pointer hover:brightness-105 active:brightness-95">
                        <div className="w-[18px] h-3 bg-stone-100 rounded-xs border border-stone-400 flex items-center justify-center shadow-2xs">
                          <span className="text-[7px] text-stone-600 font-bold scale-95 leading-none">W</span>
                        </div>
                        <div className="w-[18px] h-3 bg-stone-100 rounded-xs border border-stone-400 flex items-center justify-center shadow-2xs">
                          <span className="text-[7px] text-stone-600 font-bold scale-95 leading-none">T</span>
                        </div>
                      </div>
                    </div>

                    {/* MODE Button */}
                    <div className="flex flex-col items-center pointer-events-auto cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-b from-stone-200 via-stone-300 to-stone-400 border border-stone-650 shadow-md flex items-center justify-center">
                        <span className="text-[6px] font-black text-stone-850 font-mono scale-90">MODE</span>
                      </div>
                    </div>

                    {/* Navigation directional wheel pad with central SET button */}
                    <div className="w-13 h-13 rounded-full bg-gradient-to-b from-stone-400 via-stone-300 to-stone-400 border border-stone-650 shadow-inner scale-95 flex items-center justify-center relative pointer-events-auto cursor-pointer">
                      {/* Icons on wheel */}
                      <span className="absolute top-1 text-[5.5px] text-stone-700 font-black">⚡</span>
                      <span className="absolute bottom-1 text-[5.5px] text-stone-700 font-black">🗑️</span>
                      <span className="absolute left-1 text-[5.5px] text-stone-700 font-black">◀</span>
                      <span className="absolute right-1 text-[5.5px] text-stone-700 font-black">▶</span>
                      
                      {/* Central SET button */}
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-stone-100 to-stone-300 border border-stone-500/80 shadow-md flex items-center justify-center active:scale-95 transition-transform">
                        <span className="text-[6.5px] font-extrabold text-stone-750 font-mono tracking-tighter">SET</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Hydrangeas blossoms decoration top-right overlap */}
                <div className="absolute top-[-5px] right-[-5px] z-30 pointer-events-none drop-shadow-md">
                  <span className="text-[2.2rem] block select-none rotate-12">🌸</span>
                  <span className="text-[1.8rem] block absolute top-2 right-4 select-none -rotate-12 opacity-95">🌸</span>
                  <span className="text-[1.3rem] block absolute top-6 right-2 select-none rotate-45 opacity-90">✨</span>
                  <span className="text-[1.5rem] block absolute top-[-6px] right-8 select-none -rotate-45 opacity-90">🌸</span>
                </div>

                {/* Blinking Viewfinder Glass sheen and HUD icons (above the single photo viewport inside layout) */}
                {layout === 'single' && (
                  <div className="absolute left-[6.25%] top-[13.24%] w-[63.33%] h-[73.53%] z-30 pointer-events-none overflow-hidden rounded-xl border border-stone-950/40">
                    {/* Diagonal Glass Reflection Highlight */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pr-2" />
                    
                    {/* Top HUD elements of camera finder */}
                    <div className="absolute left-3 top-2.5 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse animate-duration-1000" />
                      <span className="text-[8px] font-sans font-black tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">REC ●</span>
                    </div>
                    <span className="absolute left-3 top-6 text-[7px] font-bold text-white/90 font-mono drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">12MP [FINE]</span>

                    {/* Battery status top-right */}
                    <div className="absolute right-3 top-2.5 flex items-center gap-0.5 scale-90">
                      <div className="border border-white/95 px-0.5 py-[0.5px] rounded-xs flex gap-[0.5px] items-center bg-black/20">
                        <div className="w-1.5 h-2 bg-green-500 rounded-2xs" />
                        <div className="w-1.5 h-2 bg-green-500 rounded-2xs" />
                        <div className="w-1 h-2 bg-green-500 rounded-2xs" />
                      </div>
                      <div className="w-[1.5px] h-1 bg-white rounded-r-xs" />
                    </div>
                    <span className="absolute right-3 top-6 text-[7px] font-bold text-white/90 font-mono text-right drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">⚡ AUTO</span>

                    {/* Central Autofocus Brackets */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 border border-cyan-400/85 relative flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                        <div className="w-3 h-0.5 bg-cyan-400/90" />
                        <div className="w-0.5 h-3 bg-cyan-400/90" />
                      </div>
                    </div>

                    {/* Bottom Finder status labels */}
                    <span className="absolute left-3 bottom-2 text-[7px] font-bold text-white/90 font-mono drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">F2.8  1/125s</span>
                    <span className="absolute right-[22%] bottom-2 text-[7px] font-bold text-white/90 font-mono drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">[1.5x]</span>

                    {/* Back quartz orange numeric date stamp */}
                    <div className="absolute right-3 bottom-2.5 text-[9px] sm:text-[10px] text-[#f59e0b] font-mono tracking-widest font-black opacity-95 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.95)]">
                      {noteDate || new Date().toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Neon double border style */}
            {!useCustomColor && selectedFrame.theme === 'neon' && (
              <div className="absolute inset-1.5 border border-cyan-400 pointer-events-none rounded-xl shadow-[inset_0_0_8px_rgba(34,211,238,0.5)] z-30">
                <div className="absolute inset-1.5 border border-pink-400 rounded-lg"></div>
              </div>
            )}

            {/* Content Slot Layout Items */}
            <div 
              id="preview-nested-slots"
              className={`z-20 ${
                selectedFrame.theme === 'camera' && layout === 'single'
                  ? 'absolute left-[6.25%] top-[13.24%] w-[63.33%] h-[73.53%] flex flex-col justify-center'
                  : layout === 'strip'
                  ? 'w-full flex-1 px-[9%] pt-[9%] pb-[26%] flex gap-2.5 flex-col justify-start' 
                  : layout === 'grid'
                  ? 'w-full flex-1 px-[9%] pt-[9%] pb-[26%] grid grid-cols-2 grid-rows-2 gap-3.5'
                  : 'w-full flex-1 px-[9%] pt-[9%] pb-[26%] flex gap-2.5 flex-col justify-center'
              }`}
            >
              {slots.map((slot) => {
                const isItemCurrentlyAdjusting = activeSlotId === slot.id;
                
                return (
                  <div
                    id={`preview-frame-slot-${slot.id}`}
                    key={slot.id}
                    onPointerDown={(e) => handleSlotPointerDown(e, slot)}
                    className={`relative flex items-center justify-center overflow-hidden bg-slate-200 dark:bg-zinc-900 transition-all select-none ${
                      selectedFrame.theme === 'camera' && layout === 'single'
                        ? 'w-full h-full aspect-auto'
                        : layout === 'strip' 
                        ? 'aspect-[3/2]' 
                        : layout === 'grid'
                        ? 'aspect-[4/3] w-full'
                        : 'aspect-[4/3] w-full'
                    } ${
                      isItemCurrentlyAdjusting 
                        ? 'ring-4 ring-rose-500 ring-offset-2 z-20 scale-[1.01]' 
                        : !useCustomColor && selectedFrame.theme === 'classic'
                        ? 'border-none shadow-[inset_0_4px_8px_rgba(0,0,0,0.35)]'
                        : 'border border-stone-200/50 shadow-[inset_0_4px_12px_rgba(0,0,0,0.12)] hover:border-stone-400'
                    }`}
                    style={{
                      borderRadius: !useCustomColor && selectedFrame.theme === 'classic' ? '2px' : '8px',
                    }}
                  >
                    
                    {/* High-Fidelity physical cardboard cutout & gloss reflection overlays for realistic Polaroid */}
                    {!useCustomColor && selectedFrame.theme === 'classic' && (
                      <>
                        {/* Cutout Bevel Rim (Simulates raised thick paper/cardboard opening edges) */}
                        <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none ring-1 ring-black/15 ring-inset z-10" />
                        
                        {/* Inner cast-shadow from frame board overlay */}
                        <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none shadow-[inset_0_4px_10px_rgba(0,0,0,0.4)] z-10" />
                        
                        {/* Film Gloss Sheen Glare */}
                        <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/12 mix-blend-overlay z-10" />
                      </>
                    )}
                    
                    {/* Img element */}
                    {slot.src ? (
                      <div className="w-full h-full relative select-none cursor-move">
                        <img
                          src={slot.src}
                          alt="slot core"
                          className="absolute pointer-events-none max-w-none origin-center user-select-none"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            // Combine layout transform matrices
                            transform: `translate(-50%, -50%) translate(${slot.xOffset}px, ${slot.yOffset}px) scale(${slot.zoom}) rotate(${slot.rotation}deg)`,
                            left: '50%',
                            top: '50%',
                            filter: FILTERS.find(f => f.id === slot.filter)?.filter || 'none',
                          }}
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Interactive edit indicator overlay */}
                        <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-all pointer-events-none"></div>

                        {/* Top quick adjustment indicators */}
                        {slot.filter !== 'none' && (
                          <div className="absolute top-2 left-2 bg-black/55 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase">
                            {FILTERS.find(f => f.id === slot.filter)?.name}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Empty Uploader Selector Box inside frame slot */
                      <button
                        id={`empty-uploader-box-${slot.id}`}
                        onClick={(e) => { e.stopPropagation(); triggerUploadForSlot(slot.id); }}
                        className="flex flex-col items-center justify-center p-3 text-center h-full w-full bg-stone-100 hover:bg-stone-250/70 dark:bg-zinc-900 dark:hover:bg-zinc-800/70 transition-colors select-none cursor-pointer group/uploader"
                      >
                        <Upload className="w-5 h-5 text-stone-400 dark:text-zinc-500 mb-1.5 group-hover/uploader:text-rose-500 group-hover/uploader:scale-110 transition-all duration-200" />
                        <span className="text-[9px] font-mono text-stone-500 font-bold tracking-tight uppercase group-hover/uploader:text-stone-800 dark:group-hover/uploader:text-zinc-200">ADD PHOTO {slot.id}</span>
                      </button>
                    )}
                    
                    {/* Retro mounting corners for scrapbook look */}
                    {!useCustomColor && selectedFrame.theme === 'scrapbook' && (
                      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-[3px] border-l-[3px] border-amber-950/80 -translate-x-[1px] -translate-y-[1px] rounded-tl-sm"></div>
                        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-[3px] border-r-[3px] border-amber-950/80 translate-x-[1px] -translate-y-[1px] rounded-tr-sm"></div>
                        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-[3px] border-l-[3px] border-amber-950/80 -translate-x-[1px] translate-y-[1px] rounded-bl-sm"></div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-[3px] border-r-[3px] border-amber-950/80 translate-x-[1px] translate-y-[1px] rounded-br-sm"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Floating Draggable Sticker Elements inside preview boundary */}
            <div id="canvas-stickers-sandbox" className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              {stickers.map((st) => (
                <StickerElement
                  key={st.id}
                  sticker={st}
                  isSelected={activeStickerId === st.id}
                  onSelect={() => setActiveStickerId(st.id)}
                  onUpdate={(fields) => updateSticker(st.id, fields)}
                  onRemove={() => removeSticker(st.id)}
                  containerRef={previewContainerRef}
                />
              ))}
            </div>

            {/* Custom Signature text signatures and timestamp at frame bottom */}
            <div className="absolute bottom-[4.5%] left-[8%] right-[8%] z-20 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              
              {/* Primary Signature Note */}
              <p 
                id="display-caption-preview"
                style={{
                  color: noteColor,
                  fontFamily: selectedFont.family,
                  textShadow: selectedFrame.theme === 'neon' ? '0 0 10px rgba(232,121,249,0.3)' : 'none',
                }}
                className={`text-center font-bold break-words w-full px-1 max-w-full truncate ${
                  layout === 'strip'
                    ? 'text-lg sm:text-2xl leading-none'
                    : 'text-base sm:text-xl leading-none'
                }`}
              >
                {noteText.toUpperCase() || 'MEMORIES'}
              </p>

              {/* Timestamp Seal */}
              <p
                id="display-date-preview"
                style={{
                  color: noteColor,
                  fontFamily: selectedFont.family,
                  opacity: 0.82,
                }}
                className={`text-center whitespace-nowrap overflow-hidden text-ellipsis ${
                  layout === 'strip'
                    ? 'text-[10px] sm:text-xs mt-1 font-medium select-none tracking-widest'
                    : 'text-[9px] sm:text-[10px] mt-0.5 tracking-wider'
                }`}
              >
                {noteDate}
              </p>
            </div>

          </div>

          {/* Quick tips label below editor preview */}
          <div className="mt-4 flex flex-col items-center gap-1 px-4 text-center">
            <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">
              ✨ GESTURES: Drag inside individual frames directly to pan/reposition photos. Click on stickers to scale!
            </span>
          </div>

        </div>

      </main>

      {/* Exquisite Footer "In the end" */}
      <footer className="w-full mt-24 py-12 border-t border-rose-100/30 bg-white/20 backdrop-blur-md relative z-10 text-center flex flex-col items-center justify-center gap-4">
        <AmHeartLogo sizeClassName="w-16 h-16 shadow-md" />
        <div className="space-y-1.5 flex flex-col items-center">
          <span 
            className="bg-gradient-to-r from-rose-600 via-pink-600 to-orange-500 bg-clip-text text-transparent font-medium tracking-wide block"
            style={{ fontFamily: "'Great Vibes', cursive", fontSize: '22px' }}
          >
            CaptureBooth
          </span>
          <p className="text-[11px] text-stone-400 mt-1">
            Keep creating beautiful memories 🌸
          </p>
        </div>
      </footer>

      {/* Popups & Drawer Components */}

      {/* 🌟 Download & Share Helper Modal Fallback 🌟 */}
      {compiledStripUrl && (
        <div id="download-success-modal" className="fixed inset-0 bg-stone-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white/95 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-100 flex flex-col items-center justify-center text-center max-h-[92vh] overflow-y-auto">
            <div className="text-4xl animate-bounce mb-3">✨📸✨</div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-850 tracking-tight font-sans mb-1.5">
              Memory Strip Loaded!
            </h2>
            <p className="text-xs text-stone-600 max-w-sm mb-4 leading-relaxed">
              We've automatically initialized your photo download. If it didn't trigger, or if you are using an in-app browser/mobile device, please <b>long-press</b> (or right-click) the image below to save or share it directly!
            </p>

            {/* Rendered Frame Image Container */}
            <div className="relative border-4 border-white shadow-xl rounded-2xl overflow-hidden max-h-[45vh] bg-stone-100/50 mb-5 flex items-center justify-center">
              <img 
                src={compiledStripUrl} 
                alt="Your Saved Photobooth Film" 
                className="max-h-[42vh] object-contain w-auto rounded-lg select-all"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Action buttons */}
            <div className="w-full grid grid-cols-2 gap-3 mt-1">
              <button
                id="btn-re-download"
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `photobooth-print-${Date.now()}.jpg`;
                  link.href = compiledStripUrl;
                  link.click();
                  playBeep(640, 0.1, 'sine');
                }}
                className="py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md active:translate-y-0.5 flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Again</span>
              </button>

              <button
                id="btn-close-modal"
                onClick={() => {
                  setCompiledStripUrl(null);
                  playBeep(480, 0.05, 'sine');
                }}
                className="py-3 px-4 bg-stone-200 hover:bg-stone-300 text-stone-850 font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all text-center"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input target selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoFileChange}
        accept="image/*"
        className="hidden"
      />

    </div>
  );
}
