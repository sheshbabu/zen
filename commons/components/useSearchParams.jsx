import { h, useState, useEffect } from '../../assets/preact.esm.js';

export default function useSearchParams() {
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));

  useEffect(() => {
    function handleLocationChange() {
      setSearchParams(new URLSearchParams(window.location.search));
    }

    window.addEventListener("navigate", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("navigate", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);


  return searchParams;
}