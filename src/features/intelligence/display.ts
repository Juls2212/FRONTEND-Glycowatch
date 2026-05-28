const riskLabels: Record<string, string> = {
  LOW: "Bajo",
  MODERATE: "Moderado",
  HIGH: "Alto",
  CRITICAL: "Crítico",
  INSUFFICIENT_DATA: "Datos insuficientes"
};

const trendLabels: Record<string, string> = {
  STABLE: "Estable",
  RISING: "En aumento",
  FALLING: "En descenso",
  VARIABLE: "Variable",
  UNKNOWN: "Sin datos suficientes"
};

const agreementLabels: Record<string, string> = {
  FULL_AGREEMENT: "Coincidencia completa",
  PARTIAL_AGREEMENT: "Coincidencia parcial",
  DISAGREEMENT: "Diferencia detectada",
  GEMINI_UNAVAILABLE: "IA externa no disponible",
  NOT_APPLICABLE: "No aplica"
};

const assistantMoodLabels: Record<string, string> = {
  HAPPY: "Tranquilo",
  CALM: "Estable",
  ATTENTIVE: "Atento",
  CONCERNED: "En observación",
  ALERT: "Alerta",
  INSUFFICIENT_DATA: "Datos insuficientes"
};

export type IntelligenceRiskTheme = "low" | "moderate" | "high" | "critical" | "neutral";
export type IntelligenceAnalysisState = "missing" | "outdated" | "available";

export function translateIntelligenceRiskLevel(value: string | null | undefined): string {
  if (!value) return "No disponible";
  return riskLabels[value] ?? value;
}

export function translateIntelligenceTrend(value: string | null | undefined): string {
  if (!value) return "Sin datos suficientes";
  return trendLabels[value] ?? value;
}

export function translateAgreementStatus(value: string | null | undefined): string {
  if (!value) return "No aplica";
  return agreementLabels[value] ?? value;
}

export function getAgreementExplanation(value: string | null | undefined): string {
  if (value === "FULL_AGREEMENT") {
    return "Ambos análisis coinciden en el nivel de riesgo.";
  }
  if (value === "PARTIAL_AGREEMENT") {
    return "Los análisis son similares, aunque no idénticos.";
  }
  if (value === "DISAGREEMENT") {
    return "Los análisis difieren. GlycoWatch usa el resultado más conservador.";
  }
  if (value === "GEMINI_UNAVAILABLE") {
    return "La IA externa no está disponible. Se utiliza el motor interno basado en reglas.";
  }
  return "No hay suficiente información para comparar ambos análisis.";
}

export function translateAssistantMood(value: string | null | undefined): string {
  if (!value) return "Sin datos";
  return assistantMoodLabels[value] ?? value;
}

export function getRiskTheme(
  finalRiskLevel: string | null | undefined,
  assistantMood?: string | null | undefined
): IntelligenceRiskTheme {
  if (finalRiskLevel === "LOW") return "low";
  if (finalRiskLevel === "MODERATE") return "moderate";
  if (finalRiskLevel === "HIGH") return "high";
  if (finalRiskLevel === "CRITICAL") return "critical";
  if (finalRiskLevel === "INSUFFICIENT_DATA") return "neutral";

  if (assistantMood === "HAPPY" || assistantMood === "CALM") return "low";
  if (assistantMood === "ATTENTIVE") return "moderate";
  if (assistantMood === "CONCERNED") return "high";
  if (assistantMood === "ALERT") return "critical";
  return "neutral";
}

export function getRiskBadgeLabel(finalRiskLevel: string | null | undefined): string {
  return translateIntelligenceRiskLevel(finalRiskLevel);
}

export function getRiskThemeClass(
  finalRiskLevel: string | null | undefined,
  assistantMood?: string | null | undefined
): string {
  return `risk-theme-${getRiskTheme(finalRiskLevel, assistantMood)}`;
}

export function formatIntelligenceConfidence(value: string | number | null | undefined): string {
  if (value === "HIGH") return "Alta";
  if (value === "MEDIUM") return "Media";
  if (value === "LOW") return "Baja";

  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = value <= 1 ? value * 100 : value;
    return `${normalized.toFixed(normalized >= 10 ? 0 : 1)}%`;
  }

  return "Sin datos";
}

export function formatIntelligenceGeneratedAt(value: string | null | undefined): string {
  if (!value) return "Sin datos";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin datos";
  return parsed.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function getIntelligenceAnalysisState(
  generatedAt: string | null | undefined,
  latestMeasurementAt: string | null | undefined
): IntelligenceAnalysisState {
  if (!generatedAt) return "missing";

  const generatedTime = new Date(generatedAt).getTime();
  if (Number.isNaN(generatedTime)) return "missing";

  if (!latestMeasurementAt) return "available";

  const latestMeasurementTime = new Date(latestMeasurementAt).getTime();
  if (Number.isNaN(latestMeasurementTime)) return "available";

  if (latestMeasurementTime > generatedTime) return "outdated";
  return "available";
}

export function getIntelligenceAnalysisLabel(state: IntelligenceAnalysisState): string {
  if (state === "missing") return "Generar análisis";
  return "Actualizar análisis";
}

export function getIntelligenceAnalysisStatusLabel(state: IntelligenceAnalysisState): string {
  if (state === "missing") return "Análisis disponible por generar";
  if (state === "outdated") return "Análisis desactualizado";
  return "Análisis disponible";
}

export function getIntelligenceAnalysisStatusMessage(state: IntelligenceAnalysisState): string {
  if (state === "missing") {
    return "Todavía no hay un análisis generado para tus mediciones recientes.";
  }
  if (state === "outdated") {
    return "Tus mediciones cambiaron desde el último análisis. Puedes generar una versión nueva cuando lo necesites.";
  }
  return "El análisis actual sigue disponible para consultar y puedes actualizarlo manualmente cuando quieras.";
}

export function translateMeasurementOrigin(value: string | null | undefined): string {
  if (value === "IOT" || value === "DEVICE" || value === "HARDWARE") return "Dispositivo";
  if (value === "MANUAL") return "Manual";
  return "No disponible";
}
