import { ChartRange } from "@/features/dashboard/chart-range";

type Props = {
  value: ChartRange;
  onChange: (range: ChartRange) => void;
};

const RANGE_OPTIONS: Array<{ value: ChartRange; label: string }> = [
  { value: "DAY", label: "Este día" },
  { value: "WEEK", label: "Última semana" },
  { value: "MONTH", label: "Último mes" },
  { value: "YEAR", label: "Último año" }
];

export function ChartRangeFilter({ value, onChange }: Props) {
  return (
    <div className="range-filter" role="group" aria-label="Filtro de rango de tiempo">
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`range-pill ${value === option.value ? "active" : ""}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

