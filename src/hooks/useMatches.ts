import { useCallback, useEffect, useState } from "react";
import { loadMatches, type Match } from "@/lib/matches";

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => setMatches(loadMatches()), []);

  useEffect(() => {
    refresh();
    setReady(true);
    const onUpdate = () => refresh();
    window.addEventListener("localscore:update", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("localscore:update", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  return { matches, ready, refresh };
}
