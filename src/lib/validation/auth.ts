import { z } from "zod";
import { LoginFormValues, RegisterFormValues } from "@/features/auth/types";

const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MAX_LENGTH = 72;
const FULL_NAME_MAX_LENGTH = 100;

const trimmedRequiredString = (message: string) => z.string().trim().min(1, message);
const normalizedEmail = z.string().trim().toLowerCase().max(EMAIL_MAX_LENGTH, "Correo invalido.").email("Correo invalido.");
const loginPassword = trimmedRequiredString("La contrasena es obligatoria.")
  .min(6, "La contrasena es obligatoria.")
  .max(PASSWORD_MAX_LENGTH, "La contrasena no puede superar 72 caracteres.");
const registerPassword = z
  .string()
  .trim()
  .min(1, "La contrasena es obligatoria.")
  .min(8, "La contrasena debe tener al menos 8 caracteres.")
  .max(PASSWORD_MAX_LENGTH, "La contrasena no puede superar 72 caracteres.")
  .regex(/[A-Za-z]/, "La contrasena debe incluir al menos una letra.")
  .regex(/\d/, "La contrasena debe incluir al menos un numero.");
const normalizedFullName = z
  .string()
  .trim()
  .min(2, "El nombre es obligatorio.")
  .max(FULL_NAME_MAX_LENGTH, `El nombre no puede superar ${FULL_NAME_MAX_LENGTH} caracteres.`)
  .refine((value) => /[A-Za-zÀ-ÿ]/.test(value), "El nombre debe incluir al menos una letra.");

export const loginSchema = z.object({
  email: normalizedEmail,
  password: loginPassword
});

export const registerSchema = z.object({
  fullName: normalizedFullName,
  email: normalizedEmail,
  password: registerPassword
});

export function parseLoginPayload(values: LoginFormValues): LoginFormValues {
  return loginSchema.parse(values);
}

export function parseRegisterPayload(values: RegisterFormValues): RegisterFormValues {
  return registerSchema.parse(values);
}
