export type IntelligenceSummary = {
  riskLevel: string;
  ruleBasedRiskLevel: string;
  geminiRiskLevel: string | null;
  finalRiskLevel: string;
  agreementStatus: string;
  trend: string;
  confidence: string | number | null;
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

export type IntelligenceDetailMetricValue = string | number | boolean | null;

export type IntelligenceMeasurementSnapshot = {
  id: number | null;
  glucoseValue: number | null;
  unit: string | null;
  measuredAt: string | null;
  receivedAt: string | null;
  origin: string | null;
  deviceId: number | null;
};

export type IntelligenceAnalysisDetail = {
  id: number;
  generatedAt: string;
  ruleBasedRiskLevel: string | null;
  externalAiRiskLevel: string | null;
  finalRiskLevel: string;
  agreementStatus: string;
  trend: string;
  confidence: string | number | null;
  assistantMood: string;
  summary: string;
  aiExplanation: string;
  assistantMessage: string;
  detectedFactors: string[];
  recommendations: string[];
  hypoglycemiaThreshold: number | null;
  hyperglycemiaThreshold: number | null;
  metrics: Record<string, IntelligenceDetailMetricValue>;
  measurements: IntelligenceMeasurementSnapshot[];
  ruleBasedAnalysis: Record<string, unknown>;
  externalAiAnalysis: Record<string, unknown>;
  finalMergedAnalysis: Record<string, unknown>;
};
