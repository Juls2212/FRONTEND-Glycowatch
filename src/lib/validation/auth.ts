import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Correo invalido."),
  password: z.string().min(6, "La contrasena es obligatoria.")
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "El nombre es obligatorio."),
  email: z.string().trim().email("Correo invalido."),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres.")
});
