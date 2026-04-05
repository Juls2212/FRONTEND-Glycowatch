"use client";

import { useEffect, useState } from "react";

export type ChartTheme = {
  lineStart: string;
  lineEnd: string;
  fillStart: string;
  fillEnd: string;
  grid: string;
  gridStrong: string;
  tick: string;
  tooltipBackground: string;
  tooltipBorder: string;
  tooltipText: string;
  tooltipMuted: string;
  accent: string;
  accentStrong: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
};

export function createChartTheme(root: HTMLElement): ChartTheme {
  const styles = window.getComputedStyle(root);

  return {
    lineStart: styles.getPropertyValue("--chart-line-start").trim() || styles.getPropertyValue("--accent").trim() || "#4da3ff",
    lineEnd: styles.getPropertyValue("--chart-line-end").trim() || styles.getPropertyValue("--accent-strong").trim() || "#2f7fd6",
    fillStart: styles.getPropertyValue("--chart-fill-start").trim() || "rgba(77, 163, 255, 0.22)",
    fillEnd: styles.getPropertyValue("--chart-fill-end").trim() || "rgba(77, 163, 255, 0.02)",
    grid: styles.getPropertyValue("--chart-grid").trim() || "#1c2b48",
    gridStrong: styles.getPropertyValue("--chart-grid-strong").trim() || "#31415d",
    tick: styles.getPropertyValue("--text-secondary").trim() || "#8fa7d5",
    tooltipBackground: styles.getPropertyValue("--chart-tooltip-bg").trim() || "#0f1626",
    tooltipBorder: styles.getPropertyValue("--chart-tooltip-border").trim() || "#2e4267",
    tooltipText: styles.getPropertyValue("--chart-tooltip-text").trim() || "#dce8ff",
    tooltipMuted: styles.getPropertyValue("--text-secondary").trim() || "#8fa7d5",
    accent: styles.getPropertyValue("--accent").trim() || "#4da3ff",
    accentStrong: styles.getPropertyValue("--accent-strong").trim() || "#2f7fd6",
    success: styles.getPropertyValue("--success").trim() || "#43c27c",
    warning: styles.getPropertyValue("--warning").trim() || "#f1b24c",
    danger: styles.getPropertyValue("--danger").trim() || "#e46b7d",
    info: styles.getPropertyValue("--info").trim() || "#4f98f5"
  };
}

export function useChartTheme() {
  const [chartTheme, setChartTheme] = useState<ChartTheme>({
    lineStart: "#4da3ff",
    lineEnd: "#2f7fd6",
    fillStart: "rgba(77, 163, 255, 0.22)",
    fillEnd: "rgba(77, 163, 255, 0.02)",
    grid: "#1c2b48",
    gridStrong: "#31415d",
    tick: "#8fa7d5",
    tooltipBackground: "#0f1626",
    tooltipBorder: "#2e4267",
    tooltipText: "#dce8ff",
    tooltipMuted: "#8fa7d5",
    accent: "#4da3ff",
    accentStrong: "#2f7fd6",
    success: "#43c27c",
    warning: "#f1b24c",
    danger: "#e46b7d",
    info: "#4f98f5"
  });

  useEffect(() => {
    const root = document.documentElement;
    const syncChartTheme = () => setChartTheme(createChartTheme(root));

    syncChartTheme();

    const observer = new MutationObserver(syncChartTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-color-mode", "data-accent-theme"]
    });

    return () => observer.disconnect();
  }, []);

  return chartTheme;
}
