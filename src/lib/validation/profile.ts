import { z } from "zod";
import { DiabetesType } from "@/lib/auth/onboarding";
import { UpdateProfilePayload, ProfileData } from "@/features/profile/types";
import { getTimezoneOptions } from "@/lib/timezones";
import { CLINICAL_DECIMAL_FORMAT_MESSAGE, CLINICAL_DECIMAL_PATTERN } from "@/lib/validation/clinical-numbers";

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

export const DIABETES_TYPE_OPTIONS: Array<{ value: DiabetesType; label: string }> = [
  { value: "TYPE_1", label: "Tipo 1" },
  { value: "TYPE_2", label: "Tipo 2" },
  { value: "PREDIABETES", label: "Prediabetes" },
  { value: "OTHER", label: "Otro" }
];

const diabetesTypeSchema = z.enum(["TYPE_1", "TYPE_2", "PREDIABETES", "OTHER"], {
  message: "Selecciona un tipo de diabetes."
});

const timezoneOptions = new Set(getTimezoneOptions());

const requiredTrimmedString = (message: string) => z.string().trim().min(1, message);
const optionalTrimmedString = () => z.string().trim();
const requiredNumericTextField = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .max(NUMERIC_TEXT_MAX_LENGTH, "El valor ingresado es demasiado largo.")
    .refine((value) => CLINICAL_DECIMAL_PATTERN.test(value), `${message} ${CLINICAL_DECIMAL_FORMAT_MESSAGE}`);

const normalizedFullName = requiredTrimmedString("El nombre completo es obligatorio.")
  .max(FULL_NAME_MAX_LENGTH, `El nombre completo no puede superar ${FULL_NAME_MAX_LENGTH} caracteres.`)
  .refine((value) => /[A-Za-zÀ-ÿ]/.test(value), "El nombre completo debe incluir al menos una letra.");

const requiredTimezoneField = requiredTrimmedString("Selecciona una zona horaria.")
  .max(TIMEZONE_MAX_LENGTH, `La zona horaria no puede superar ${TIMEZONE_MAX_LENGTH} caracteres.`)
  .refine((value) => timezoneOptions.has(value), "Selecciona una zona horaria valida.");

function parseOptionalNumber(value: string): number | null {
  if (!value) return null;
  return Number(value);
}

function addBirthDateValidation(values: { birthDate: string }, ctx: z.RefinementCtx) {
  if (!values.birthDate) {
    return;
  }

  const birthDate = new Date(`${values.birthDate}T00:00:00`);
  if (Number.isNaN(birthDate.getTime()) || birthDate.toISOString().slice(0, 10) !== values.birthDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La fecha de nacimiento no es valida.",
      path: ["birthDate"]
    });
    return;
  }

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

function addThresholdValidation(
  values: { hypoglycemiaThreshold: string; hyperglycemiaThreshold: string },
  ctx: z.RefinementCtx
) {
  const hypoglycemiaThreshold = Number(values.hypoglycemiaThreshold);
  const hyperglycemiaThreshold = Number(values.hyperglycemiaThreshold);

  if (hypoglycemiaThreshold < MIN_GLUCOSE_THRESHOLD || hypoglycemiaThreshold > MAX_GLUCOSE_THRESHOLD) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Los umbrales de glucosa deben estar entre ${MIN_GLUCOSE_THRESHOLD} y ${MAX_GLUCOSE_THRESHOLD} mg/dL.`,
      path: ["hypoglycemiaThreshold"]
    });
  }

  if (hyperglycemiaThreshold < MIN_GLUCOSE_THRESHOLD || hyperglycemiaThreshold > MAX_GLUCOSE_THRESHOLD) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Los umbrales de glucosa deben estar entre ${MIN_GLUCOSE_THRESHOLD} y ${MAX_GLUCOSE_THRESHOLD} mg/dL.`,
      path: ["hyperglycemiaThreshold"]
    });
  }

  if (hyperglycemiaThreshold <= hypoglycemiaThreshold) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El umbral maximo debe ser mayor que el minimo.",
      path: ["hyperglycemiaThreshold"]
    });
  }
}

function addOptionalBodyMetricsValidation(values: { weightKg: string; heightCm: string }, ctx: z.RefinementCtx) {
  if (values.weightKg) {
    const weight = Number(values.weightKg);
    if (!CLINICAL_DECIMAL_PATTERN.test(values.weightKg) || weight < MIN_WEIGHT_KG || weight > MAX_WEIGHT_KG) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El peso debe estar entre ${MIN_WEIGHT_KG} y ${MAX_WEIGHT_KG} kg. ${CLINICAL_DECIMAL_FORMAT_MESSAGE}`,
        path: ["weightKg"]
      });
    }
  }

  if (values.heightCm) {
    const height = Number(values.heightCm);
    if (!CLINICAL_DECIMAL_PATTERN.test(values.heightCm) || height < MIN_HEIGHT_CM || height > MAX_HEIGHT_CM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `La altura debe estar entre ${MIN_HEIGHT_CM} y ${MAX_HEIGHT_CM} cm. ${CLINICAL_DECIMAL_FORMAT_MESSAGE}`,
        path: ["heightCm"]
      });
    }
  }
}

function addRequiredBodyMetricsValidation(values: { weightKg: string; heightCm: string }, ctx: z.RefinementCtx) {
  addOptionalBodyMetricsValidation(values, ctx);
}

const profileFormShape = {
  fullName: normalizedFullName,
  birthDate: optionalTrimmedString().max(
    BIRTH_DATE_MAX_LENGTH,
    `La fecha de nacimiento no puede superar ${BIRTH_DATE_MAX_LENGTH} caracteres.`
  ),
  hypoglycemiaThreshold: requiredNumericTextField("Ingresa un umbral minimo valido."),
  hyperglycemiaThreshold: requiredNumericTextField("Ingresa un umbral maximo valido."),
  timezone: requiredTimezoneField,
  weightKg: optionalTrimmedString().max(NUMERIC_TEXT_MAX_LENGTH, "El peso ingresado es demasiado largo."),
  heightCm: optionalTrimmedString().max(NUMERIC_TEXT_MAX_LENGTH, "La altura ingresada es demasiado larga.")
};

export const profileFormSchema = z
  .object(profileFormShape)
  .superRefine((values, ctx) => {
    addBirthDateValidation(values, ctx);
    addThresholdValidation(values, ctx);
    addOptionalBodyMetricsValidation(values, ctx);
  });

export const profileViewSchema = z
  .object({
    ...profileFormShape,
    diabetesType: diabetesTypeSchema
  })
  .superRefine((values, ctx) => {
    addBirthDateValidation(values, ctx);
    addThresholdValidation(values, ctx);
    addOptionalBodyMetricsValidation(values, ctx);
  });

export const onboardingProfileSchema = z
  .object({
    fullName: normalizedFullName,
    birthDate: requiredTrimmedString("La fecha de nacimiento es obligatoria.").max(
      BIRTH_DATE_MAX_LENGTH,
      `La fecha de nacimiento no puede superar ${BIRTH_DATE_MAX_LENGTH} caracteres.`
    ),
    timezone: requiredTimezoneField,
    diabetesType: diabetesTypeSchema,
    hypoglycemiaThreshold: requiredNumericTextField("Ingresa un umbral minimo valido."),
    hyperglycemiaThreshold: requiredNumericTextField("Ingresa un umbral maximo valido."),
    weightKg: requiredNumericTextField("Ingresa un peso valido."),
    heightCm: requiredNumericTextField("Ingresa una altura valida.")
  })
  .superRefine((values, ctx) => {
    addBirthDateValidation(values, ctx);
    addThresholdValidation(values, ctx);
    addRequiredBodyMetricsValidation(values, ctx);
  });

export function buildProfilePayload(values: z.infer<typeof profileViewSchema>): UpdateProfilePayload {
  return {
    fullName: values.fullName.replace(/\s+/g, " "),
    birthDate: values.birthDate || null,
    diabetesType: values.diabetesType,
    hypoglycemiaThreshold: Number(values.hypoglycemiaThreshold),
    hyperglycemiaThreshold: Number(values.hyperglycemiaThreshold),
    timezone: values.timezone,
    weightKg: parseOptionalNumber(values.weightKg),
    heightCm: parseOptionalNumber(values.heightCm)
  };
}

export function buildOnboardingProfilePayload(values: z.infer<typeof onboardingProfileSchema>): UpdateProfilePayload {
  return {
    fullName: values.fullName.replace(/\s+/g, " "),
    birthDate: values.birthDate,
    diabetesType: values.diabetesType,
    hypoglycemiaThreshold: Number(values.hypoglycemiaThreshold),
    hyperglycemiaThreshold: Number(values.hyperglycemiaThreshold),
    timezone: values.timezone,
    weightKg: Number(values.weightKg),
    heightCm: Number(values.heightCm)
  };
}

export function isProfileComplete(profile: ProfileData | null, diabetesType: DiabetesType | null): boolean {
  if (!profile) return false;
  const resolvedDiabetesType = profile.diabetesType ?? diabetesType;
  return Boolean(
    profile.fullName &&
      profile.birthDate &&
      profile.timezone &&
      resolvedDiabetesType &&
      profile.hypoglycemiaThreshold >= MIN_GLUCOSE_THRESHOLD &&
      profile.hypoglycemiaThreshold <= MAX_GLUCOSE_THRESHOLD &&
      profile.hyperglycemiaThreshold >= MIN_GLUCOSE_THRESHOLD &&
      profile.hyperglycemiaThreshold <= MAX_GLUCOSE_THRESHOLD &&
      profile.hyperglycemiaThreshold > profile.hypoglycemiaThreshold &&
      profile.weightKg != null &&
      profile.weightKg >= MIN_WEIGHT_KG &&
      profile.weightKg <= MAX_WEIGHT_KG &&
      profile.heightCm != null &&
      profile.heightCm >= MIN_HEIGHT_CM &&
      profile.heightCm <= MAX_HEIGHT_CM
  );
}
