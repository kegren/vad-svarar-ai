import { type RefObject, useEffect, useState } from "react";

// Sant från första gången elementet syns på skärmen. Används för att starta en
// rörelse när besökaren kommer dit, inte när datan kommer.
export function useSyns(ref: RefObject<Element | null>) {
  const [syns, setSyns] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!(el && "IntersectionObserver" in window)) {
      setSyns(true);
      return;
    }
    const observator = new IntersectionObserver(
      ([post]) => {
        if (post?.isIntersecting) {
          setSyns(true);
          observator.disconnect();
        }
      },
      { threshold: 0 }
    );
    observator.observe(el);
    return () => observator.disconnect();
  }, [ref]);
  return syns;
}
