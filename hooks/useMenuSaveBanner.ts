import { useEffect, useState } from "react";

export function useMenuSaveBanner() {
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showSaveBanner, setShowSaveBanner] = useState(false);

  useEffect(() => {
    if (!lastSavedAt) return;
    setShowSaveBanner(true);
    const timer = setTimeout(() => {
      setShowSaveBanner(false);
      setLastSavedAt(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [lastSavedAt]);

  return { lastSavedAt, setLastSavedAt, showSaveBanner };
}
