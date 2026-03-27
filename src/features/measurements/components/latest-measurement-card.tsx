import { Card } from "@/components/ui/card";
import { LatestMeasurement } from "@/features/measurements/types";

type Props = {
  latestMeasurement: LatestMeasurement | null;
};

export function LatestMeasurementCard({ latestMeasurement }: Props) {
  const formattedDate = latestMeasurement
    ? new Date(latestMeasurement.measuredAt).toLocaleString("es-CO")
    : "Sin registros";

  return (
    <Card>
      <p className="metric-label">Última medición</p>
      <p className="metric-value">
        {latestMeasurement ? `${latestMeasurement.glucoseValue} ${latestMeasurement.unit}` : "--"}
      </p>
      <p className="metric-meta">{formattedDate}</p>
    </Card>
  );
}

