import { z } from "zod";

const MIN_GLUCOSE_MG_DL = 20;
const MAX_GLUCOSE_MG_DL = 600;
const GLUCOSE_TEXT_MAX_LENGTH = 16;
const DATETIME_TEXT_MAX_LENGTH = 32;
const DATE_TEXT_MAX_LENGTH = 10;
const TIME_TEXT_MAX_LENGTH = 5;

const glucoseValueField = z
  .string()
  .trim()
  .min(1, "Ingresa un valor de glucosa valido.")
  .max(GLUCOSE_TEXT_MAX_LENGTH, "El valor de glucosa es demasiado largo.")
  .refine((value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= MIN_GLUCOSE_MG_DL && parsed <= MAX_GLUCOSE_MG_DL;
  }, `Ingresa un valor de glucosa entre ${MIN_GLUCOSE_MG_DL} y ${MAX_GLUCOSE_MG_DL} mg/dL.`);

export const dashboardManualMeasurementSchema = z
  .object({
    glucoseValue: glucoseValueField,
    measuredAt: z.string().trim().min(1, "Selecciona fecha y hora de medicion.").max(DATETIME_TEXT_MAX_LENGTH, "La fecha y hora de medicion son demasiado largas.")
  })
  .superRefine((values, ctx) => {
    const measuredAt = new Date(values.measuredAt);
    if (Number.isNaN(measuredAt.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha y hora de medicion no son validas.",
        path: ["measuredAt"]
      });
      return;
    }

    if (measuredAt.getTime() > Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha y hora de medicion no pueden estar en el futuro.",
        path: ["measuredAt"]
      });
    }
  });

export const manualMeasurementFormSchema = z
  .object({
    glucoseValue: glucoseValueField,
    measuredDate: z.string().trim().min(1, "Selecciona fecha y hora de medicion.").max(DATE_TEXT_MAX_LENGTH, "La fecha de medicion es demasiado larga."),
    measuredTime: z.string().trim().min(1, "Selecciona fecha y hora de medicion.").max(TIME_TEXT_MAX_LENGTH, "La hora de medicion es demasiado larga.")
  })
  .superRefine((values, ctx) => {
    const measuredAt = new Date(`${values.measuredDate}T${values.measuredTime}`);
    if (Number.isNaN(measuredAt.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha y hora ingresadas no son validas.",
        path: ["measuredTime"]
      });
      return;
    }

    if (measuredAt.getTime() > Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha y hora de medicion no pueden estar en el futuro.",
        path: ["measuredTime"]
      });
    }
  });

export function toDashboardMeasuredAtISOString(measuredAt: string): string {
  return new Date(measuredAt).toISOString();
}

export function toManualMeasuredAtISOString(measuredDate: string, measuredTime: string): string {
  return new Date(`${measuredDate}T${measuredTime}`).toISOString();
}
