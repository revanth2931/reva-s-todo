import React, { useState, useEffect, useRef } from 'react';

// Returns value as HH:MM (24h) from h, m, period
function toTime24(h, m, period) {
  let hour = parseInt(h, 10);
  if (period === 'AM') {
    if (hour === 12) hour = 0;
  } else {
    if (hour !== 12) hour += 12;
  }
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Parse HH:MM (24h) to { hour (1-12), minute, period }
function fromTime24(timeStr) {
  if (!timeStr) return { hour: 12, minute: 0, period: 'PM' };
  const [h, m] = timeStr.split(':').map(Number);
  let hour = h % 12 || 12;
  const period = h < 12 ? 'AM' : 'PM';
  return { hour, minute: m, period };
}

const ITEM_HEIGHT = 52;
const VISIBLE = 5;

function PickerColumn({ items, selected, onSelect, renderLabel }) {
  const containerRef = useRef(null);
  const selectedIndex = items.indexOf(selected);
  const isScrolling = useRef(false);

  useEffect(() => {
    if (containerRef.current && !isScrolling.current) {
      const offset = selectedIndex * ITEM_HEIGHT;
      containerRef.current.scrollTop = offset;
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const offset = selectedIndex * ITEM_HEIGHT;
      containerRef.current.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, [selected]);

  const handleScroll = (e) => {
    isScrolling.current = true;
    const scrollTop = e.currentTarget.scrollTop;
    const idx = Math.round(scrollTop / ITEM_HEIGHT);
    if (items[idx] !== undefined && items[idx] !== selected) {
      onSelect(items[idx]);
    }
    clearTimeout(containerRef._scrollTimer);
    containerRef._scrollTimer = setTimeout(() => { isScrolling.current = false; }, 200);
  };

  return (
    <div className="relative" style={{ height: ITEM_HEIGHT * VISIBLE }}>
      {/* Selection indicator */}
      <div
        className="absolute left-0 right-0 bg-violet-600/15 border-t border-b border-violet-500/25 pointer-events-none z-10 rounded-xl"
        style={{ top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT }}
      />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-scroll scrollbar-none"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {/* Top padding for centering */}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
        {items.map((item) => (
          <div
            key={item}
            onClick={() => onSelect(item)}
            style={{ height: ITEM_HEIGHT, scrollSnapAlign: 'start' }}
            className={`flex items-center justify-center cursor-pointer transition-all duration-150 select-none ${
              item === selected
                ? 'text-white text-[28px] font-black'
                : 'text-zinc-600 text-[21px] font-semibold'
            }`}
          >
            {renderLabel ? renderLabel(item) : String(item).padStart(2, '0')}
          </div>
        ))}
        {/* Bottom padding */}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
      </div>
    </div>
  );
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export default function ModernTimePicker({ initialTime, onConfirm, onCancel }) {
  const parsed = fromTime24(initialTime);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState(parsed.period);

  const handleConfirm = () => {
    onConfirm(toTime24(hour, minute, period));
  };

  // Format display time (12h)
  const displayTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onCancel} />

      {/* Picker Card */}
      <div className="relative z-10 w-full max-w-xs mx-4 mb-6 sm:mb-0 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: 'fadeIn 0.2s ease' }}>
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-zinc-800/70 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-400 tracking-widest uppercase">Select time</h3>
          <span className="text-xl font-black text-violet-400 tabular-nums">{displayTime}</span>
        </div>

        {/* Dial Area */}
        <div className="flex items-center justify-center gap-1 px-4 py-3">
          {/* Hours column */}
          <div className="flex-1">
            <PickerColumn items={HOURS} selected={hour} onSelect={setHour} />
          </div>

          {/* Colon */}
          <div className="text-3xl font-bold text-zinc-500 select-none pb-1">:</div>

          {/* Minutes column */}
          <div className="flex-1">
            <PickerColumn
              items={MINUTES}
              selected={minute}
              onSelect={setMinute}
              renderLabel={(m) => String(m).padStart(2, '0')}
            />
          </div>

          {/* AM/PM column */}
          <div
            className="flex flex-col items-center justify-center gap-3 pl-3 select-none"
            style={{ height: ITEM_HEIGHT * VISIBLE }}
          >
            {['AM', 'PM'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`w-14 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  period === p
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-5 py-4 border-t border-zinc-800/70">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl border border-zinc-700 text-zinc-400 font-bold text-sm hover:border-zinc-600 hover:text-zinc-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98]"
          >
            Set Time
          </button>
        </div>
      </div>
    </div>
  );
}
