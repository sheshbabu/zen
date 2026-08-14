import { useRef } from "../../assets/preact.esm.js";

export default function useLongPress(callback, delay = 500) {
  const timerRef = useRef(null);
  const firedRef = useRef(false);

  function start(e) {
    // Only left click should start a long-press
    if (e?.button !== undefined && e.button !== 0) {
      return;
    }
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      timerRef.current = null;
      callback();
    }, delay);
  }

  function cancel() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function handleClick(e) {
    if (firedRef.current === true) {
      e.preventDefault();
      e.stopPropagation();
      firedRef.current = false;
    }
  }

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onClickCapture: handleClick,
  };
}
