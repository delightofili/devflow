import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
    // clear timeout if value changes before delay
    // only fires after user stops typing for `delay` ms
  }, [value, delay]);

  return debouncedValue;
}
