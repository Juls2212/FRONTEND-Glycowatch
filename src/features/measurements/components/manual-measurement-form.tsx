"use client";

import { FormEvent, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { createManualMeasurement } from "@/features/measurements/api";

type Props = {
  onCreated: () => Promise<void>;
};

function nowDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeInputValue(): string {
  return new Date().toTimeString().slice(0, 5);
}

export function ManualMeasurementForm({ onCreated }: Props) {
  const [glucoseValue, setGlucoseValue] = useState("");
  const [measuredDate, setMeasuredDate] = useState("");
  const [measuredTime, setMeasuredTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const maxDate = useMemo(() => nowDateInputValue(), []);

  const fillCurrentDateTime = () => {
    setMeasuredDate(nowDateInputValue());
    setMeasuredTime(nowTimeInputValue());
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedValue = Number(glucoseValue);
    if (!parsedValue || parsedValue <= 0) {
      setError("Ingresa un valor de glucosa válido.");
      return;
    }
    if (!measuredDate || !measuredTime) {
      setError("Selecciona fecha y hora de medición.");
      return;
    }

    setIsSubmitting(true);
    try {
      const measuredAt = new Date(`${measuredDate}T${measuredTime}`);
      if (Number.isNaN(measuredAt.getTime())) {
        setError("La fecha y hora ingresadas no son válidas.");
        setIsSubmitting(false);
        return;
      }
      if (measuredAt.getTime() > Date.now()) {
        setError("La fecha y hora de medición no pueden estar en el futuro.");
        setIsSubmitting(false);
        return;
      }

      await createManualMeasurement({
        glucoseValue: parsedValue,
        unit: "mg/dL",
        measuredAt: measuredAt.toISOString()
      });
      setGlucoseValue("");
      setMeasuredDate("");
      setMeasuredTime("");
      setSuccess("Medición guardada correctamente.");
      await onCreated();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar la medición.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form className="manual-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Valor de glucosa (mg/dL)</span>
          <input
            type="number"
            step="0.1"
            min="1"
            value={glucoseValue}
            onChange={(event) => setGlucoseValue(event.target.value)}
            placeholder="Ej. 110.5"
          />
        </label>

        <label className="field">
          <span>Fecha de medición</span>
          <input type="date" max={maxDate} value={measuredDate} onChange={(event) => setMeasuredDate(event.target.value)} />
        </label>

        <label className="field">
          <span>Hora de medición</span>
          <input type="time" value={measuredTime} onChange={(event) => setMeasuredTime(event.target.value)} />
        </label>

        <label className="field">
          <span>Unidad</span>
          <input type="text" value="mg/dL" disabled />
        </label>

        {error ? <p className="error-text">{error}</p> : null}
        {success ? <p className="success-text">{success}</p> : null}

        <div className="manual-actions">
          <button type="button" className="ghost-button" onClick={fillCurrentDateTime} disabled={isSubmitting}>
            Usar hora actual
          </button>
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Registrar medición"}
          </button>
        </div>
      </form>
    </Card>
  );
}

