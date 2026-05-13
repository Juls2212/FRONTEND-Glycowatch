"use client";

import { useEffect, useMemo, useState } from "react";
import type { StaticImageData } from "next/image";
import alertRobot from "@/assets/images/robot/alert.png";
import assistantRobot from "@/assets/images/robot/assistant.png";
import monitoringRobot from "@/assets/images/robot/monitoring.png";
import neutralRobot from "@/assets/images/robot/neutral.png";
import stableRobot from "@/assets/images/robot/stable.png";

type IntelligenceAssistantRobotProps = {
  assistantMood?: string;
  finalRiskLevel?: string;
  trend?: string;
  isLoading?: boolean;
  className?: string;
};

function resolveRobotAsset({
  assistantMood,
  finalRiskLevel,
  trend,
  isLoading
}: Omit<IntelligenceAssistantRobotProps, "className">): StaticImageData {
  if (isLoading) return assistantRobot;

  if (assistantMood === "HAPPY" || assistantMood === "CALM") return stableRobot;
  if (assistantMood === "ATTENTIVE") return assistantRobot;
  if (assistantMood === "CONCERNED" || assistantMood === "INSUFFICIENT_DATA") return monitoringRobot;
  if (assistantMood === "ALERT") return alertRobot;

  if (finalRiskLevel === "LOW") return stableRobot;
  if (finalRiskLevel === "MODERATE") return assistantRobot;
  if (finalRiskLevel === "HIGH" || finalRiskLevel === "INSUFFICIENT_DATA" || trend === "VARIABLE") {
    return monitoringRobot;
  }
  if (finalRiskLevel === "CRITICAL") return alertRobot;

  return neutralRobot;
}

export function IntelligenceAssistantRobot({
  assistantMood,
  finalRiskLevel,
  trend,
  isLoading = false,
  className
}: IntelligenceAssistantRobotProps) {
  const resolvedAsset = useMemo(
    () => resolveRobotAsset({ assistantMood, finalRiskLevel, trend, isLoading }),
    [assistantMood, finalRiskLevel, trend, isLoading]
  );
  const [imageSrc, setImageSrc] = useState(resolvedAsset.src);

  useEffect(() => {
    setImageSrc(resolvedAsset.src);
  }, [resolvedAsset]);

  return (
    <div className={`assistant-robot ${isLoading ? "is-loading" : ""} ${className ?? ""}`.trim()}>
      <img
        src={imageSrc}
        alt="Asistente visual de GlycoWatch"
        className="assistant-robot-image"
        onError={() => setImageSrc(neutralRobot.src)}
      />
    </div>
  );
}
