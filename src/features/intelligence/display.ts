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

export function translateAssistantMood(value: string | null | undefined): string {
  if (!value) return "Sin datos";
  return assistantMoodLabels[value] ?? value;
}

export function formatIntelligenceConfidence(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Sin datos";
  const normalized = value <= 1 ? value * 100 : value;
  return `${normalized.toFixed(normalized >= 10 ? 0 : 1)}%`;
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
