import { z } from "zod";

export const deviceRegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Completa nombre e identificador.")
    .max(255, "Nombre e identificador no pueden superar 255 caracteres."),
  identifier: z
    .string()
    .trim()
    .min(1, "Completa nombre e identificador.")
    .max(255, "Nombre e identificador no pueden superar 255 caracteres.")
});
