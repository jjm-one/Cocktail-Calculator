import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MARGIN = 8;
const MAX_WIDTH = 300;

export function Tooltip({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number; placement: 'top' | 'bottom' } | null>(
    null,
  );

  const show = () => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(MAX_WIDTH, window.innerWidth * 0.78 - MARGIN * 2);
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN));
    const placement: 'top' | 'bottom' = rect.top > 140 ? 'top' : 'bottom';
    const top = placement === 'top' ? rect.top - MARGIN : rect.bottom + MARGIN;
    setPos({ left, top, width, placement });
  };
  const hide = () => setPos(null);

  return (
    <span ref={ref} className="tooltip" tabIndex={0} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      ?
      {pos &&
        createPortal(
          <span
            className={`tooltip-bubble tooltip-bubble-${pos.placement}`}
            style={{ left: pos.left, top: pos.top, width: pos.width }}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
