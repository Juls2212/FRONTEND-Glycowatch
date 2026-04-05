import { z } from "zod";
import { UpdateProfilePayload } from "@/features/profile/types";

const requiredTrimmedString = (message: string) => z.string().trim().min(1, message);
const optionalTrimmedString = () => z.string().transform((value) => value.trim());

export const profileFormSchema = z
  .object({
    fullName: requiredTrimmedString("El nombre completo es obligatorio."),
    birthDate: optionalTrimmedString(),
    hypoglycemiaThreshold: z.coerce
      .number()
      .finite("Los umbrales de glucosa deben ser validos.")
      .positive("Los umbrales de glucosa deben ser mayores a 0."),
    hyperglycemiaThreshold: z.coerce
      .number()
      .finite("Los umbrales de glucosa deben ser validos.")
      .positive("Los umbrales de glucosa deben ser mayores a 0."),
    timezone: requiredTrimmedString("Selecciona una zona horaria."),
    weightKg: optionalTrimmedString(),
    heightCm: optionalTrimmedString()
  })
  .superRefine((values, ctx) => {
    if (values.hyperglycemiaThreshold <= values.hypoglycemiaThreshold) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El umbral maximo debe ser mayor que el minimo.",
        path: ["hyperglycemiaThreshold"]
      });
    }

    if (values.weightKg.trim()) {
      const weight = Number(values.weightKg);
      if (Number.isNaN(weight) || weight < 1 || weight > 500) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El peso debe estar entre 1 y 500 kg.",
          path: ["weightKg"]
        });
      }
    }

    if (values.heightCm.trim()) {
      const height = Number(values.heightCm);
      if (Number.isNaN(height) || height < 30 || height > 300) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La altura debe estar entre 30 y 300 cm.",
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
    fullName: values.fullName,
    birthDate: values.birthDate || null,
    hypoglycemiaThreshold: values.hypoglycemiaThreshold,
    hyperglycemiaThreshold: values.hyperglycemiaThreshold,
    timezone: values.timezone,
    weightKg: parseOptionalNumber(values.weightKg),
    heightCm: parseOptionalNumber(values.heightCm)
  };
}
