import { z } from "zod";

const trimmedRequiredString = (message: string) => z.string().trim().min(1, message);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo invalido."),
  password: trimmedRequiredString("La contrasena es obligatoria.").min(6, "La contrasena es obligatoria.")
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "El nombre es obligatorio."),
  email: z.string().trim().toLowerCase().email("Correo invalido."),
  password: trimmedRequiredString("La contrasena es obligatoria.").min(8, "La contrasena debe tener al menos 8 caracteres.")
});
