import { Smile, Sliders, RotateCw, Trash2, X, Move, Sparkles } from 'lucide-react';
import { FILTERS, PhotoSlot } from '../types';

interface SlotAdjustmentsProps {
  slot: PhotoSlot;
  onUpdate: (fields: Partial<PhotoSlot>) => void;
  onRemove: () => void;
  onClose: () => void;
}

export default function SlotAdjustments({ slot, onUpdate, onRemove, onClose }: SlotAdjustmentsProps) {
  return (
    <div id={`adjustments-panel-${slot.id}`} className="backdrop-blur-md bg-white/70 border border-white/45 p-4 rounded-2xl shadow-lg max-w-sm w-full animate-fade-in text-slate-800">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-white/20">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-rose-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Tune Photo {slot.id}</span>
        </div>
        <button
          id={`close-adjust-${slot.id}`}
          onClick={onClose}
          className="p-1 rounded bg-white/40 hover:bg-white/70 border border-white/25 text-stone-500 hover:text-stone-850 transition-colors shadow-2xs"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Control sliders */}
      <div className="space-y-3.5">
        
        {/* Zoom adjustment */}
        <div>
          <div className="flex justify-between text-[11px] font-mono mb-1 text-stone-500 font-semibold">
            <span>ZOOM SCALE:</span>
            <span className="font-bold text-rose-500">{slot.zoom.toFixed(2)}x</span>
          </div>
          <input
            id={`zoom-slider-${slot.id}`}
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={slot.zoom}
            onChange={(e) => onUpdate({ zoom: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-white/40 border border-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
          />
        </div>

        {/* Pan horizontal & vertical offsets */}
        <div>
          <div className="flex justify-between text-[11px] font-mono mb-1 text-stone-500 font-semibold">
            <span>POSITION PAN:</span>
            <span className="text-stone-500 font-medium">X: {slot.xOffset.toFixed(0)}px / Y: {slot.yOffset.toFixed(0)}px</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-mono font-bold block text-stone-400">HORIZONTAL (X)</label>
              <input
                id={`pan-x-slider-${slot.id}`}
                type="range"
                min="-150"
                max="150"
                step="1"
                value={slot.xOffset}
                onChange={(e) => onUpdate({ xOffset: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/40 border border-white/20 accent-rose-500 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[9px] font-mono font-bold block text-stone-400">VERTICAL (Y)</label>
              <input
                id={`pan-y-slider-${slot.id}`}
                type="range"
                min="-150"
                max="150"
                step="1"
                value={slot.yOffset}
                onChange={(e) => onUpdate({ yOffset: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/40 border border-white/20 accent-rose-500 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-1.5 py-1 px-2 border border-dashed border-white/30 rounded bg-white/25 text-[9px] text-stone-500 font-mono">
            <Move className="w-3 h-3 text-stone-500" />
            <span>Hint: You can also drag the photo directly in the frame!</span>
          </div>
        </div>

        {/* Rotate & Reset Button Line */}
        <div className="flex gap-2 items-center justify-between">
          <button
            id={`rotate-btn-${slot.id}`}
            onClick={() => onUpdate({ rotation: (slot.rotation + 90) % 360 })}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-white/30 bg-white/30 hover:bg-white/65 hover:border-white/50 text-xs font-semibold font-mono shadow-2xs transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-500" />
            <span>ROTATE 90°</span>
          </button>

          <button
            id={`reset-pan-zoom-${slot.id}`}
            onClick={() => onUpdate({ zoom: 1, xOffset: 0, yOffset: 0, rotation: 0 })}
            className="py-1.5 px-3 rounded-lg border border-white/20 bg-white/25 hover:bg-white/45 text-[10px] font-mono text-stone-605 shadow-2xs transition-all cursor-pointer"
          >
            RESET ALIGN
          </button>
        </div>

        {/* Filter selection specific to this slot */}
        <div>
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-stone-100">
            <div className="flex items-center gap-1 text-[11px] font-mono text-stone-500 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>AESTHETIC FILTERS:</span>
            </div>
            <span className="text-[9px] font-mono text-stone-400 capitalize bg-white/40 px-1.5 rounded">
              {FILTERS.find(f => f.id === slot.filter)?.name.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '') || 'Normal'}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-200/60 font-mono">
            {FILTERS.map((f) => (
              <button
                id={`filter-${f.id}-${slot.id}`}
                key={f.id}
                onClick={() => onUpdate({ filter: f.id })}
                className={`py-1.5 px-2.5 rounded-xl text-[10px] whitespace-nowrap border transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  slot.filter === f.id
                    ? 'bg-rose-500/10 text-rose-600 border-rose-300 font-bold shadow-xs'
                    : 'bg-white/40 text-stone-605 border-white/30 hover:border-stone-300/60 hover:bg-white/70 shadow-3xs'
                }`}
              >
                {/* Dynamically Filtered Miniature Color Core preview */}
                <div 
                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-3xs"
                  style={{ 
                    filter: f.filter,
                    background: 'linear-gradient(135deg, #f43f5e 0%, #3b82f6 50%, #eab308 100%)'
                  }}
                />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Remove Photo */}
        <button
          id={`remove-photo-btn-${slot.id}`}
          onClick={() => {
            onRemove();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 text-rose-600 hover:text-white bg-white/10 hover:bg-rose-500 border border-rose-300/40 rounded-xl text-xs font-bold shadow-2xs transition-all mt-2 font-mono cursor-pointer hover:border-rose-500"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>REMOVE THIS PHOTO</span>
        </button>

      </div>
    </div>
  );
}
