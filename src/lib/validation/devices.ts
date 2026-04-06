import { z } from "zod";

const normalizedDeviceName = z
  .string()
  .trim()
  .min(1, "Completa nombre e identificador.")
  .max(80, "El nombre del dispositivo no puede superar 80 caracteres.")
  .transform((value) => value.replace(/\s+/g, " "));

const normalizedIdentifier = z
  .string()
  .trim()
  .min(1, "Completa nombre e identificador.")
  .max(120, "El identificador no puede superar 120 caracteres.")
  .regex(/^[A-Za-z0-9._:-]+$/, "El identificador solo puede incluir letras, numeros, punto, guion, guion bajo o dos puntos.");

export const deviceRegisterSchema = z.object({
  name: normalizedDeviceName,
  identifier: normalizedIdentifier
});
