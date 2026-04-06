"use client";

import { FormEvent, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { createManualMeasurement } from "@/features/measurements/api";
import { mapZodIssuesToFieldErrors } from "@/lib/validation/errors";
import { manualMeasurementFormSchema, toManualMeasuredAtISOString } from "@/lib/validation/measurements";

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
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"glucoseValue" | "measuredDate" | "measuredTime", string>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const maxDate = useMemo(() => nowDateInputValue(), []);

  const fillCurrentDateTime = () => {
    setFieldErrors((current) => {
      if (!current.measuredDate && !current.measuredTime) return current;
      const next = { ...current };
      delete next.measuredDate;
      delete next.measuredTime;
      return next;
    });
    setMeasuredDate(nowDateInputValue());
    setMeasuredTime(nowTimeInputValue());
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setError(null);
    setSuccess(null);

    const result = manualMeasurementFormSchema.safeParse({
      glucoseValue,
      measuredDate,
      measuredTime
    });

    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues));
      return;
    }

    setIsSubmitting(true);
    try {
      await createManualMeasurement({
        glucoseValue: Number(result.data.glucoseValue),
        unit: "mg/dL",
        measuredAt: toManualMeasuredAtISOString(result.data.measuredDate, result.data.measuredTime)
      });
      setGlucoseValue("");
      setMeasuredDate("");
      setMeasuredTime("");
      setSuccess("Medicion guardada correctamente.");
      await onCreated();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar la medicion.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form className="manual-form" onSubmit={onSubmit}>
        <label className={`field ${fieldErrors.glucoseValue ? "has-error" : ""}`}>
          <span>Valor de glucosa (mg/dL)</span>
          <input
            type="number"
            step="0.1"
            min="20"
            max="600"
            value={glucoseValue}
            disabled={isSubmitting}
            aria-invalid={fieldErrors.glucoseValue ? "true" : "false"}
            aria-describedby={fieldErrors.glucoseValue ? "measurement-glucose-error" : undefined}
            onChange={(event) => {
              setFieldErrors((current) => {
                if (!current.glucoseValue) return current;
                const next = { ...current };
                delete next.glucoseValue;
                return next;
              });
              setGlucoseValue(event.target.value);
            }}
            placeholder="Ej. 110.5"
          />
          {fieldErrors.glucoseValue ? <small id="measurement-glucose-error">{fieldErrors.glucoseValue}</small> : null}
        </label>

        <label className={`field ${fieldErrors.measuredDate ? "has-error" : ""}`}>
          <span>Fecha de medicion</span>
          <input
            type="date"
            max={maxDate}
            value={measuredDate}
            disabled={isSubmitting}
            aria-invalid={fieldErrors.measuredDate ? "true" : "false"}
            aria-describedby={fieldErrors.measuredDate ? "measurement-date-error" : undefined}
            onChange={(event) => {
              setFieldErrors((current) => {
                if (!current.measuredDate) return current;
                const next = { ...current };
                delete next.measuredDate;
                return next;
              });
              setMeasuredDate(event.target.value);
            }}
          />
          {fieldErrors.measuredDate ? <small id="measurement-date-error">{fieldErrors.measuredDate}</small> : null}
        </label>

        <label className={`field ${fieldErrors.measuredTime ? "has-error" : ""}`}>
          <span>Hora de medicion</span>
          <input
            type="time"
            value={measuredTime}
            disabled={isSubmitting}
            aria-invalid={fieldErrors.measuredTime ? "true" : "false"}
            aria-describedby={fieldErrors.measuredTime ? "measurement-time-error" : undefined}
            onChange={(event) => {
              setFieldErrors((current) => {
                if (!current.measuredTime) return current;
                const next = { ...current };
                delete next.measuredTime;
                return next;
              });
              setMeasuredTime(event.target.value);
            }}
          />
          {fieldErrors.measuredTime ? <small id="measurement-time-error">{fieldErrors.measuredTime}</small> : null}
        </label>

        <label className="field">
          <span>Unidad</span>
          <input type="text" value="mg/dL" disabled />
        </label>

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}
        {success ? <p className="form-feedback form-feedback-success">{success}</p> : null}

        <div className="manual-actions">
          <button type="button" className="ghost-button" onClick={fillCurrentDateTime} disabled={isSubmitting}>
            Usar hora actual
          </button>
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Registrar medicion"}
          </button>
        </div>
      </form>
    </Card>
  );
}
