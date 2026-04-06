import { z } from "zod";
import { UpdateProfilePayload } from "@/features/profile/types";
import { getTimezoneOptions } from "@/lib/timezones";

const MIN_GLUCOSE_THRESHOLD = 20;
const MAX_GLUCOSE_THRESHOLD = 600;
const MIN_WEIGHT_KG = 2;
const MAX_WEIGHT_KG = 350;
const MIN_HEIGHT_CM = 30;
const MAX_HEIGHT_CM = 250;
const MIN_BIRTH_YEAR = 1900;
const FULL_NAME_MAX_LENGTH = 100;
const BIRTH_DATE_MAX_LENGTH = 10;
const TIMEZONE_MAX_LENGTH = 100;
const NUMERIC_TEXT_MAX_LENGTH = 16;

const timezoneOptions = new Set(getTimezoneOptions());
const requiredTrimmedString = (message: string) => z.string().trim().min(1, message);
const optionalTrimmedString = () => z.string().trim();
const normalizedFullName = requiredTrimmedString("El nombre completo es obligatorio.")
  .max(FULL_NAME_MAX_LENGTH, `El nombre completo no puede superar ${FULL_NAME_MAX_LENGTH} caracteres.`)
  .refine((value) => /[A-Za-zÀ-ÿ]/.test(value), "El nombre completo debe incluir al menos una letra.");
const glucoseThresholdField = z.coerce
  .number()
  .finite("Los umbrales de glucosa deben ser validos.")
  .min(MIN_GLUCOSE_THRESHOLD, `Los umbrales de glucosa deben estar entre ${MIN_GLUCOSE_THRESHOLD} y ${MAX_GLUCOSE_THRESHOLD} mg/dL.`)
  .max(MAX_GLUCOSE_THRESHOLD, `Los umbrales de glucosa deben estar entre ${MIN_GLUCOSE_THRESHOLD} y ${MAX_GLUCOSE_THRESHOLD} mg/dL.`);

export const profileFormSchema = z
  .object({
    fullName: normalizedFullName,
    birthDate: optionalTrimmedString().max(
      BIRTH_DATE_MAX_LENGTH,
      `La fecha de nacimiento no puede superar ${BIRTH_DATE_MAX_LENGTH} caracteres.`
    ),
    hypoglycemiaThreshold: glucoseThresholdField,
    hyperglycemiaThreshold: glucoseThresholdField,
    timezone: requiredTrimmedString("Selecciona una zona horaria.")
      .max(TIMEZONE_MAX_LENGTH, `La zona horaria no puede superar ${TIMEZONE_MAX_LENGTH} caracteres.`)
      .refine(
      (value) => timezoneOptions.has(value),
      "Selecciona una zona horaria valida."
    ),
    weightKg: optionalTrimmedString().max(NUMERIC_TEXT_MAX_LENGTH, "El peso ingresado es demasiado largo."),
    heightCm: optionalTrimmedString().max(NUMERIC_TEXT_MAX_LENGTH, "La altura ingresada es demasiado larga.")
  })
  .superRefine((values, ctx) => {
    if (values.birthDate) {
      const birthDate = new Date(`${values.birthDate}T00:00:00`);
      if (Number.isNaN(birthDate.getTime()) || birthDate.toISOString().slice(0, 10) !== values.birthDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La fecha de nacimiento no es valida.",
          path: ["birthDate"]
        });
      } else {
        const currentDate = new Date();
        const minimumDate = new Date(`${MIN_BIRTH_YEAR}-01-01T00:00:00`);
        if (birthDate > currentDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha de nacimiento no puede estar en el futuro.",
            path: ["birthDate"]
          });
        } else if (birthDate < minimumDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `La fecha de nacimiento debe ser posterior a ${MIN_BIRTH_YEAR}.`,
            path: ["birthDate"]
          });
        }
      }
    }

    if (values.hyperglycemiaThreshold <= values.hypoglycemiaThreshold) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El umbral maximo debe ser mayor que el minimo.",
        path: ["hyperglycemiaThreshold"]
      });
    }

    if (values.weightKg.trim()) {
      const weight = Number(values.weightKg);
      if (!Number.isFinite(weight) || weight < MIN_WEIGHT_KG || weight > MAX_WEIGHT_KG) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El peso debe estar entre ${MIN_WEIGHT_KG} y ${MAX_WEIGHT_KG} kg.`,
          path: ["weightKg"]
        });
      }
    }

    if (values.heightCm.trim()) {
      const height = Number(values.heightCm);
      if (!Number.isFinite(height) || height < MIN_HEIGHT_CM || height > MAX_HEIGHT_CM) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `La altura debe estar entre ${MIN_HEIGHT_CM} y ${MAX_HEIGHT_CM} cm.`,
          path: ["heightCm"]
        });
      }
    }
  });

function parseOptionalNumber(value: string): number | null {
  if (!value) return null;
  return Number(value);
}

export function buildProfilePayload(values: z.infer<typeof profileFormSchema>): UpdateProfilePayload {
  return {
    fullName: values.fullName.replace(/\s+/g, " "),
    birthDate: values.birthDate || null,
    hypoglycemiaThreshold: values.hypoglycemiaThreshold,
    hyperglycemiaThreshold: values.hyperglycemiaThreshold,
    timezone: values.timezone,
    weightKg: parseOptionalNumber(values.weightKg),
    heightCm: parseOptionalNumber(values.heightCm)
  };
}
