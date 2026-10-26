import type { ReactNode } from "react";

// Korta ord med bindestreck, som AI-tjänsterna, bryts inte vid strecket. Inters
// latin-del saknar hårt bindestreck (U+2011), så orden hålls ihop med nowrap.
// Långa ord får brytas, annars blir raden före dem kort.
const KORT_ORD = 14;
export function hallIhop(text: string, nyckel = "ord"): ReactNode[] {
  return text.split(" ").map((ord, i, alla) => (
    <span
      className={
        ord.includes("-") && ord.length <= KORT_ORD ? "whitespace-nowrap" : ""
      }
      // biome-ignore lint/suspicious/noArrayIndexKey: orden byter aldrig plats.
      key={`${nyckel}-${i}`}
    >
      {ord}
      {i < alla.length - 1 ? " " : ""}
    </span>
  ));
}
