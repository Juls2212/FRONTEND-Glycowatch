export type IntelligenceSummary = {
  riskLevel: string;
  ruleBasedRiskLevel: string;
  geminiRiskLevel: string | null;
  finalRiskLevel: string;
  agreementStatus: string;
  trend: string;
  confidence: number;
  assistantMood: string;
  summary: string;
  aiExplanation: string;
  assistantMessage: string;
  geminiAvailable: boolean;
  detectedFactors: string[];
  recommendations: string[];
  disclaimer: string;
  generatedAt: string;
};

export type IntelligenceHistoryItem = {
  id: number;
  finalRiskLevel: string;
  trend: string;
  assistantMood: string;
  summary: string;
  createdAt: string;
};
