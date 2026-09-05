import { useRef, useEffect } from "../../assets/preact.esm.js"

export default function useDebounce(callback, delay) {
  const timerRef = useRef(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  function schedule() {
    cancel();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      callbackRef.current();
    }, delay);
  }

  function cancel() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    return cancel;
  }, []);

  return { schedule, cancel };
}
