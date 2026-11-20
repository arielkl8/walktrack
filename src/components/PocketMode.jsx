import { useEffect, useRef, useState } from 'react';

const HOLD_MS = 1200;

// Black screen that keeps the app awake (the wake lock stays on), so GPS keeps recording
// while the phone is in a pocket. Turning the screen off with the power button would make
// the browser stop GPS. Black pixels use almost no power on OLED screens.
// Exit with a long press, so touches inside a pocket don't close it.
export default function PocketMode({ distanceKm, time, onExit }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef(null);
  const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  const startHold = () => {
    setHolding(true);
    timer.current = setTimeout(() => { setHolding(false); onExit(); }, HOLD_MS);
  };
  const cancelHold = () => {
    setHolding(false);
    clearTimeout(timer.current);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div
      className="fixed inset-0 z-[3000] flex flex-col items-center justify-center select-none"
      style={{ background: '#000', touchAction: 'none' }}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
    >
      <p className="text-4xl font-black stat-value" style={{ color: '#1E3A66' }}>{distanceKm.toFixed(2)} ק"מ</p>
      <p className="text-2xl font-bold mt-2 stat-value" style={{ color: '#1E293B' }}>{time}</p>

      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-3 px-6 text-center">
        <div className="w-40 h-1 rounded-full overflow-hidden" style={{ background: '#111827' }}>
          <div
            className="h-full"
            style={{
              background: '#1E3A66',
              width: holding ? '100%' : '0%',
              transition: holding ? `width ${HOLD_MS}ms linear` : 'none',
            }}
          />
        </div>
        <p className="text-xs" style={{ color: '#334155' }}>לחיצה ארוכה ליציאה</p>
        <p className="text-[11px] leading-relaxed" style={{ color: '#1F2937' }}>
          {wakeLockSupported
            ? 'המדידה ממשיכה. אל תכבה את המסך בכפתור ההפעלה'
            : 'הדפדפן לא תומך בהשארת המסך דלוק. עדכן את הדפדפן לגרסה האחרונה'}
        </p>
      </div>
    </div>
  );
}
