"use client";

import { useEffect, useState } from "react";

/**
 * Chart color palette, resolved at runtime so charts render correctly in both
 * light and dark mode. Uses the Smart Library palette (brand sage green +
 * blue accent + amber for "borrowed"). A MutationObserver re-resolves when the
 * `dark` class toggles on <html> (next-themes) so we never need CSS var
 * gymnastics inside SVG presentation attributes.
 */
export interface ChartColors {
  /** Primary series / bars (borrows, available, top lists). */
  primary: string;
  /** Secondary series (returns line). */
  secondary: string;
  /** "Borrowed" slice / alert accent. */
  accent: string;
  /** Axis tick text. */
  tick: string;
  /** Gridline color. */
  grid: string;
  /** Tooltip background. */
  tooltipBg: string;
  /** Tooltip border. */
  tooltipBorder: string;
}

const LIGHT: ChartColors = {
  primary: "#4C7B62",
  secondary: "#3B82F6",
  accent: "#F59E0B",
  tick: "#64748B",
  grid: "#CBD5E1",
  tooltipBg: "#ffffff",
  tooltipBorder: "#E2E8F0",
};

const DARK: ChartColors = {
  primary: "#4C7B62",
  secondary: "#60A5FA",
  accent: "#FBBF24",
  tick: "#94A3B8",
  grid: "#334155",
  tooltipBg: "#232839",
  tooltipBorder: "#464F6F",
};

function current(): ChartColors {
  if (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  ) {
    return DARK;
  }
  return LIGHT;
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(() =>
    typeof document === "undefined" ? LIGHT : current()
  );

  useEffect(() => {
    const compute = () => setColors(current());
    compute();
    const observer = new MutationObserver(compute);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}