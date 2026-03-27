import { RiskAnalysis } from "@/features/dashboard/types";

export function translateStatus(status: RiskAnalysis["currentStatus"]): string {
  if (status === "LOW") return "BAJO";
  if (status === "HIGH") return "ALTO";
  return "EN RANGO";
}

export function translateRiskLevel(level: RiskAnalysis["riskLevel"]): string {
  if (level === "HIGH") return "ALTO";
  if (level === "MEDIUM") return "MEDIO";
  return "BAJO";
}

export function translateTrend(trend: RiskAnalysis["trend"]): string {
  if (trend === "RISING") return "ASCENDENTE";
  if (trend === "FALLING") return "DESCENDENTE";
  return "ESTABLE";
}

export function buildSpanishRiskMessage(risk: RiskAnalysis): string {
  const statusPrefix =
    risk.currentStatus === "LOW"
      ? "Tus valores recientes están por debajo del rango objetivo."
      : risk.currentStatus === "HIGH"
        ? "Tus valores recientes están por encima del rango objetivo."
        : "Tus valores recientes se mantienen dentro del rango objetivo.";

  const trendText = `Tendencia ${translateTrend(risk.trend).toLowerCase()}.`;
  const levelText = `Nivel de riesgo ${translateRiskLevel(risk.riskLevel).toLowerCase()}.`;
  return `${statusPrefix} ${trendText} ${levelText}`;
}

