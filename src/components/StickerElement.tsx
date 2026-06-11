import React, { useState, useRef, useEffect } from 'react';
import { Trash2, RotateCcw, ZoomIn, ZoomOut, X } from 'lucide-react';
import { Sticker } from '../types';

interface StickerElementProps {
  key?: any;
  sticker: Sticker;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (fields: Partial<Sticker>) => void;
  onRemove: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function StickerElement({
  sticker,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  containerRef,
}: StickerElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; stickerX: number; stickerY: number }>({
    x: 0,
    y: 0,
    stickerX: 0,
    stickerY: 0,
  });

  const stickerRef = useRef<HTMLDivElement>(null);

  // Click outside listener to deselect sticker
  useEffect(() => {
    if (!isSelected) return;

    function handleGlobalPointerDown(e: MouseEvent | TouchEvent) {
      if (stickerRef.current && !stickerRef.current.contains(e.target as Node)) {
        // give it a short buffer to avoid deselecting while clicking control items
      }
    }

    document.addEventListener('mousedown', handleGlobalPointerDown);
    return () => document.removeEventListener('mousedown', handleGlobalPointerDown);
  }, [isSelected]);

  // Handle Drag Start
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    onSelect();
    
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      stickerX: sticker.x,
      stickerY: sticker.y,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    handleDragStart(clientX, clientY);
  };

  // Drag Move Effect
  useEffect(() => {
    if (!isDragging || !containerRef.current) return;

    function handlePointerMove(e: MouseEvent | TouchEvent) {
      const container = containerRef.current;
      if (!container) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const rect = container.getBoundingClientRect();
      
      // Calculate delta movement in pixels
      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;

      // Convert delta from pixels to container percentage values
      const percentDeltaX = (deltaX / rect.width) * 100;
      const percentDeltaY = (deltaY / rect.height) * 100;

      let nextX = dragStartRef.current.stickerX + percentDeltaX;
      let nextY = dragStartRef.current.stickerY + percentDeltaY;

      // Bound inside container with padding margins
      nextX = Math.max(-10, Math.min(105, nextX));
      nextY = Math.max(-10, Math.min(105, nextY));

      onUpdate({ x: nextX, y: nextY });
    }

    function handlePointerUp() {
      setIsDragging(false);
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
  }, [isDragging, sticker, containerRef, onUpdate]);

  const changeScale = (amount: number) => {
    const nextScale = Math.max(0.4, Math.min(4.0, sticker.scale + amount));
    onUpdate({ scale: nextScale });
  };

  const changeRotation = () => {
    const nextRotation = (sticker.rotation + 45) % 360;
    onUpdate({ rotation: nextRotation });
  };

  return (
    <div
      ref={stickerRef}
      id={`sticker-element-${sticker.id}`}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      style={{
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        transform: `translate(-50%, -50%) scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
        touchAction: 'none',
      }}
      className={`absolute select-none cursor-move z-30 transition-shadow duration-150 ${
        isDragging ? 'opacity-85 scale-105' : ''
      }`}
    >
      {/* Visual Content (Emoji) */}
      <span className="text-3xl sm:text-4.5xl block filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] select-none">
        {sticker.emoji}
      </span>

      {/* Floating Outline Controls */}
      {isSelected && (
        <div className="absolute -inset-4 border-2 border-dashed border-rose-500 rounded-lg pointer-events-none group animate-pulse">
          {/* Active outline marker */}
        </div>
      )}

      {/* Control overlay buttons when selected */}
      {isSelected && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center bg-zinc-900 border border-zinc-800 text-white rounded-xl shadow-xl py-1 px-1.5 gap-1.5 z-40 scale-90 sm:scale-100 pointer-events-auto"
        >
          {/* Scale Down */}
          <button
            id={`sticker-scale-down-${sticker.id}`}
            onClick={() => changeScale(-0.15)}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
            title="Shrink"
          >
            <ZoomOut className="w-3 h-3" />
          </button>

          {/* Scale Up */}
          <button
            id={`sticker-scale-up-${sticker.id}`}
            onClick={() => changeScale(0.15)}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
            title="Grow"
          >
            <ZoomIn className="w-3 h-3" />
          </button>

          {/* Rotate key */}
          <button
            id={`sticker-rotate-${sticker.id}`}
            onClick={changeRotation}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
            title="Rotate 45°"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {/* Delete sticker */}
          <button
            id={`sticker-remove-${sticker.id}`}
            onClick={onRemove}
            className="p-1.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-400 hover:text-white ml-0.5"
            title="Remove Sticker"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
