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
    lineStart: styles.getPropertyValue("--chart-line-start").trim() || styles.getPropertyValue("--accent").trim() || "#7ab8f5",
    lineEnd: styles.getPropertyValue("--chart-line-end").trim() || styles.getPropertyValue("--accent-strong").trim() || "#4f92d4",
    fillStart: styles.getPropertyValue("--chart-fill-start").trim() || "rgba(122, 184, 245, 0.12)",
    fillEnd: styles.getPropertyValue("--chart-fill-end").trim() || "rgba(122, 184, 245, 0.015)",
    grid: styles.getPropertyValue("--chart-grid").trim() || "#deebf3",
    gridStrong: styles.getPropertyValue("--chart-grid-strong").trim() || "#c9dbe8",
    tick: styles.getPropertyValue("--text-secondary").trim() || "#8fa7d5",
    tooltipBackground: styles.getPropertyValue("--chart-tooltip-bg").trim() || "#ffffff",
    tooltipBorder: styles.getPropertyValue("--chart-tooltip-border").trim() || "#dbe7ef",
    tooltipText: styles.getPropertyValue("--chart-tooltip-text").trim() || "#18324a",
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
    lineStart: "#7ab8f5",
    lineEnd: "#4f92d4",
    fillStart: "rgba(122, 184, 245, 0.12)",
    fillEnd: "rgba(122, 184, 245, 0.015)",
    grid: "#deebf3",
    gridStrong: "#c9dbe8",
    tick: "#667d90",
    tooltipBackground: "#ffffff",
    tooltipBorder: "#dbe7ef",
    tooltipText: "#18324a",
    tooltipMuted: "#667d90",
    accent: "#7ab8f5",
    accentStrong: "#4f92d4",
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
