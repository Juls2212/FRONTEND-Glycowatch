import { z } from "zod";

export const ESP32_IDENTIFIER_PREFIX = "ESP32-";
export const ESP32_IDENTIFIER_PATTERN = /^ESP32-\d{3}$/;
export const ESP32_IDENTIFIER_MAX_LENGTH = 9;
export const ESP32_IDENTIFIER_MESSAGE = "El identificador debe tener el formato ESP32- seguido de 3 numeros.";
export const ESP32_IDENTIFIER_SUFFIX_MESSAGE = "Escribe exactamente 3 numeros despues de ESP32-.";

export function formatEsp32IdentifierInput(value: string): string {
  if (!value) return ESP32_IDENTIFIER_PREFIX;
  if (!value.startsWith(ESP32_IDENTIFIER_PREFIX)) return ESP32_IDENTIFIER_PREFIX;
  return `${ESP32_IDENTIFIER_PREFIX}${value.slice(ESP32_IDENTIFIER_PREFIX.length).replace(/\D/g, "").slice(0, 3)}`;
}

export function getEsp32IdentifierInputError(value: string, formattedValue: string): string | null {
  if (value && !value.startsWith(ESP32_IDENTIFIER_PREFIX)) return ESP32_IDENTIFIER_MESSAGE;
  if (value.slice(ESP32_IDENTIFIER_PREFIX.length).replace(/\d/g, "")) return "Solo se permiten numeros despues de ESP32-.";
  if (formattedValue === ESP32_IDENTIFIER_PREFIX) return null;
  if (!ESP32_IDENTIFIER_PATTERN.test(formattedValue)) return ESP32_IDENTIFIER_SUFFIX_MESSAGE;
  return null;
}

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
  .regex(ESP32_IDENTIFIER_PATTERN, ESP32_IDENTIFIER_MESSAGE);

export const deviceRegisterSchema = z.object({
  name: normalizedDeviceName,
  identifier: normalizedIdentifier
});
