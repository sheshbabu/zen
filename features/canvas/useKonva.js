import { useEffect, useState } from '../../assets/preact.esm.js';

export default function useKonva() {
  const [isKonvaReady, setIsKonvaReady] = useState(false);

  useEffect(() => {
    if (typeof window.Konva !== 'undefined') {
      setIsKonvaReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = '/assets/konva.min.js';
    script.onload = () => {
      setIsKonvaReady(true);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return isKonvaReady;
}
